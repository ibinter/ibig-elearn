import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { addMember, seatsUsed, slugify } from '@/lib/org'
import { sendEmail } from '@/lib/email'
import { notifyUsers } from '@/lib/notify'
import { SITE_URL } from '@/lib/site'

/** Création / mise à jour d'une organisation cliente par l'équipe IBIG. */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const admin = createAdminClient()
  const { data: staff } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'coordinateur'].includes(staff?.role ?? '')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const b = await request.json().catch(() => ({}))
  const plan = ['starter', 'business', 'enterprise'].includes(b.plan) ? b.plan : 'starter'
  const maxSeats = Math.max(1, Math.min(10000, Number(b.maxSeats) || 10))

  // Mise à jour (sièges, formule, activation)
  if (b.orgId) {
    const patch: Record<string, unknown> = { plan, max_seats: maxSeats, updated_at: new Date().toISOString() }
    if (typeof b.isActive === 'boolean') patch.is_active = b.isActive
    const { error } = await admin.from('organizations').update(patch).eq('id', String(b.orgId))
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const name = String(b.name ?? '').trim().slice(0, 120)
  const ownerEmail = String(b.ownerEmail ?? '').trim().toLowerCase()
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
    return NextResponse.json({ error: "Nom de l'entreprise et email du responsable requis." }, { status: 400 })
  }

  let slug = slugify(name) || 'entreprise'
  const { data: taken } = await admin.from('organizations').select('slug').like('slug', `${slug}%`)
  if (taken?.some(t => t.slug === slug)) slug = `${slug}-${(taken?.length ?? 0) + 1}`

  const { data: org, error } = await admin.from('organizations').insert({
    name, slug, plan, max_seats: maxSeats, country: String(b.country ?? 'CI').slice(0, 2).toUpperCase(),
    billing_email: ownerEmail, contact_name: b.contactName ? String(b.contactName).slice(0, 120) : null,
    contact_phone: b.contactPhone ? String(b.contactPhone).slice(0, 40) : null,
  }).select('id, slug, name').single()
  if (error || !org) return NextResponse.json({ error: error?.message ?? 'Création impossible' }, { status: 500 })

  if (b.b2bRequestId) await admin.from('b2b_requests').update({ status: 'won' }).eq('id', String(b.b2bRequestId))

  // Responsable : rattaché directement s'il a un compte, sinon invité par email
  const { data: owner } = await admin.from('profiles').select('id').eq('email', ownerEmail).maybeSingle()
  let ownerStatus: 'added' | 'invited' = 'added'
  if (owner) {
    await addMember(admin, org.id, owner.id, 'owner', user.id)
    await notifyUsers([owner.id], { title: 'Votre espace entreprise est prêt', body: `Gérez la formation de vos équipes ${org.name}.`, link: `/organisation/${org.slug}` })
  } else {
    ownerStatus = 'invited'
    const { data: inv } = await admin.from('org_invitations')
      .insert({ org_id: org.id, email: ownerEmail, role: 'owner', invited_by: user.id, expires_at: new Date(Date.now() + 30 * 86400_000).toISOString() })
      .select('token').single()
    if (inv) {
      try {
        await sendEmail({
          to: ownerEmail,
          subject: `Votre espace entreprise ${org.name} sur IBIG E-LEARNING`,
          html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111">
            <h2 style="color:#0B3D91">Bienvenue sur IBIG E-LEARNING</h2>
            <p>L'espace de formation de <strong>${org.name}</strong> est prêt. Activez-le pour inviter vos collaborateurs et suivre leur progression.</p>
            <p><a href="${SITE_URL}/rejoindre/${inv.token}" style="display:inline-block;background:#FFA500;color:#000;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none">Activer mon espace entreprise</a></p>
            <p style="color:#666;font-size:12px">Ce lien est valable 30 jours.</p></div>`,
        })
      } catch (e) { console.error('[admin/organisations] email', e) }
    }
  }
  await admin.from('organizations').update({ used_seats: await seatsUsed(admin, org.id) }).eq('id', org.id)
  return NextResponse.json({ ok: true, slug: org.slug, ownerStatus })
}
