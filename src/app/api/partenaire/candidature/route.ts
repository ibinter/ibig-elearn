import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notifyStaff } from '@/lib/notify'
import { EXPERTISE_DOMAINS, PAYOUT_METHODS } from '@/lib/partner'

const str = (v: unknown, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const url = (v: unknown) => {
  const s = str(v, 300)
  if (!s) return null
  try { const u = new URL(s.startsWith('http') ? s : `https://${s}`); return u.toString() } catch { return null }
}

/** Dépôt (ou re-dépôt après refus) d'une candidature de formateur partenaire. */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connectez-vous pour candidater.' }, { status: 401 })
  if (!user.email_confirmed_at) return NextResponse.json({ error: 'Confirmez d\'abord votre adresse email.' }, { status: 403 })

  const b = await req.json().catch(() => ({}))
  const domains = Array.isArray(b.expertise_domains) ? b.expertise_domains.filter((d: unknown) => typeof d === 'string' && EXPERTISE_DOMAINS.includes(d)).slice(0, 5) : []
  const languages = Array.isArray(b.teaching_languages) ? b.teaching_languages.filter((l: unknown) => ['fr', 'en', 'ar', 'pt'].includes(l as string)) : []
  const years = Number.parseInt(String(b.years_experience), 10)

  const app = {
    user_id: user.id,
    status: 'submitted' as const,
    full_name: str(b.full_name, 120),
    professional_title: str(b.professional_title, 120),
    phone: str(b.phone, 30),
    whatsapp: str(b.whatsapp, 30) || null,
    country: str(b.country, 60),
    city: str(b.city, 80),
    expertise_domains: domains,
    years_experience: Number.isFinite(years) ? years : -1,
    bio: str(b.bio, 3000),
    linkedin_url: url(b.linkedin_url),
    website_url: url(b.website_url),
    sample_content_url: url(b.sample_content_url),
    teaching_languages: languages.length ? languages : ['fr'],
    planned_courses: str(b.planned_courses, 2000),
    legal_status: b.legal_status === 'company' ? 'company' as const : 'individual' as const,
    company_name: str(b.company_name, 160) || null,
    tax_id: str(b.tax_id, 60) || null,
    payout_method: b.payout_method,
    payout_account: str(b.payout_account, 80),
    signature_name: str(b.signature_name, 120),
    motivation: str(b.motivation, 2000) || null,
    rejection_reason: null,
    admin_note: null,
    reviewed_at: null,
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const errors: string[] = []
  if (app.full_name.length < 3) errors.push('Nom complet')
  if (app.professional_title.length < 2) errors.push('Titre professionnel')
  if (app.phone.length < 8) errors.push('Téléphone')
  if (!app.country || !app.city) errors.push('Pays et ville')
  if (!domains.length) errors.push('Au moins un domaine d\'expertise')
  if (app.years_experience < 0 || app.years_experience > 60) errors.push('Années d\'expérience')
  if (app.bio.length < 150) errors.push('Biographie (150 caractères minimum)')
  if (app.planned_courses.length < 30) errors.push('Formations envisagées')
  if (!(app.payout_method in PAYOUT_METHODS)) errors.push('Mode de versement')
  if (app.payout_account.length < 6) errors.push('Numéro / compte de versement')
  if (app.legal_status === 'company' && !app.company_name) errors.push('Raison sociale')
  if (app.signature_name.length < 3) errors.push('Nom de signature')
  if (b.accept_cgu !== true) errors.push('Acceptation des CGU')
  if (errors.length) return NextResponse.json({ error: `Champs à compléter : ${errors.join(', ')}.` }, { status: 400 })

  const { data: existing } = await supabase.from('instructor_applications').select('id, status').eq('user_id', user.id).maybeSingle()
  if (existing && !['submitted', 'rejected'].includes(existing.status)) {
    return NextResponse.json({ error: 'Votre candidature a déjà été traitée.' }, { status: 409 })
  }

  const { error } = existing
    ? await supabase.from('instructor_applications').update(app).eq('id', existing.id)
    : await supabase.from('instructor_applications').insert(app)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Profil : coordonnées utiles (champs non protégés)
  await supabase.from('profiles').update({ phone: app.phone, bio: app.bio, professional_title: app.professional_title }).eq('id', user.id)

  await notifyStaff({
    title: existing ? 'Candidature formateur mise à jour' : 'Nouvelle candidature formateur partenaire',
    body: `${app.full_name} — ${app.professional_title} (${app.city}, ${app.country})`,
    link: '/admin/partenaires',
  })

  return NextResponse.json({ ok: true })
}
