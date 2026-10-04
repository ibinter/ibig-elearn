import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { orgId, emails, role = 'learner', cohortId } = await request.json()
  if (!orgId || !Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: 'orgId et emails requis' }, { status: 400 })
  }

  // Vérifier que l'utilisateur est admin/owner de l'org
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership || !['owner','admin','manager'].includes(membership.role)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('name, max_seats, used_seats')
    .eq('id', orgId)
    .single()

  if (!org) return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 })

  // Vérifier les sièges disponibles
  if (org.used_seats + emails.length > org.max_seats) {
    return NextResponse.json({
      error: `Quota dépassé : ${org.max_seats - org.used_seats} siège(s) disponible(s), ${emails.length} invitation(s) demandée(s)`
    }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const results: { email: string; status: 'sent' | 'already_member' | 'error' }[] = []

  for (const email of emails) {
    // Vérifier si l'utilisateur existe déjà
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingProfile) {
      // Déjà membre ?
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('org_id', orgId)
        .eq('user_id', existingProfile.id)
        .single()

      if (existingMember) {
        results.push({ email, status: 'already_member' })
        continue
      }

      // Ajouter directement
      await supabase.from('organization_members').insert({
        org_id: orgId, user_id: existingProfile.id, role, invited_by: user.id,
        invited_at: new Date().toISOString(),
      })
    } else {
      // Créer une invitation
      const { data: inv } = await supabase.from('org_invitations').insert({
        org_id: orgId, email, role, cohort_id: cohortId ?? null, invited_by: user.id,
      }).select().single()

      if (inv) {
        // Envoyer l'email d'invitation
        try {
          await sendEmail({
            to: email,
            subject: `Invitation à rejoindre ${org.name} sur IBIG E-LEARN`,
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:auto">
                <h2 style="color:#0B3D91">Vous êtes invité(e) !</h2>
                <p>${org.name} vous invite à rejoindre sa plateforme de formation sur IBIG E-LEARN.</p>
                <a href="${appUrl}/rejoindre/${inv.token}"
                   style="display:inline-block;background:#FFA500;color:#000;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">
                  Accepter l'invitation
                </a>
                <p style="color:#666;font-size:12px">Ce lien expire dans 7 jours.</p>
              </div>
            `,
          })
        } catch (e) {
          console.error('[org/invite] email error:', e)
        }
      }
    }

    results.push({ email, status: 'sent' })
  }

  // Mettre à jour used_seats
  const added = results.filter(r => r.status === 'sent').length
  if (added > 0) {
    await supabase.from('organizations')
      .update({ used_seats: org.used_seats + added })
      .eq('id', orgId)
  }

  return NextResponse.json({ results })
}
