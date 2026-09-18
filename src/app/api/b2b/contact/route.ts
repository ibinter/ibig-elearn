import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { company, contact_name, email, phone, sector, company_size, learners_count, message } = body

  if (!company || !contact_name || !email || !phone) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
  }

  const supabase = await createClient()

  // Sauvegarder en base
  await supabase.from('b2b_requests').insert({
    company,
    contact_name,
    email,
    phone,
    sector: sector || null,
    company_size: company_size || null,
    learners_count: learners_count ? parseInt(learners_count) : null,
    message: message || null,
    status: 'new',
  })

  // Notification email admin
  try {
    const adminEmail = process.env.ADMIN_EMAIL ?? process.env.EMAIL_FROM ?? 'contact@ibiglearn.com'
    await sendEmail({
      to: adminEmail,
      subject: `🏢 Nouvelle demande B2B — ${company}`,
      html: `
        <h2>Nouvelle demande entreprise</h2>
        <p><strong>Entreprise :</strong> ${company}</p>
        <p><strong>Contact :</strong> ${contact_name}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Téléphone :</strong> ${phone}</p>
        <p><strong>Secteur :</strong> ${sector || 'Non précisé'}</p>
        <p><strong>Taille :</strong> ${company_size || 'Non précisé'}</p>
        <p><strong>Apprenants :</strong> ${learners_count || 'Non précisé'}</p>
        <p><strong>Message :</strong> ${message || 'Aucun'}</p>
      `,
    })
  } catch (e) {
    console.error('[b2b] email error:', e)
  }

  return NextResponse.json({ ok: true })
}
