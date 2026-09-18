import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { name, email, subject, message } = await req.json()

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? 'contact@ibiglearn.com'

  // Email à l'équipe IBIG
  await sendEmail({
    to: adminEmail,
    subject: `[Contact] ${subject} — de ${name}`,
    html: `
<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<h2 style="color:#0B3D91">Nouveau message de contact</h2>
<table style="width:100%;border-collapse:collapse">
  <tr><td style="padding:8px 0;color:#666;width:100px">De :</td><td style="font-weight:bold">${name}</td></tr>
  <tr><td style="padding:8px 0;color:#666">Email :</td><td><a href="mailto:${email}">${email}</a></td></tr>
  <tr><td style="padding:8px 0;color:#666">Sujet :</td><td>${subject}</td></tr>
</table>
<div style="margin-top:16px;padding:16px;background:#f9fafb;border-radius:8px;color:#374151;line-height:1.6">
${message.replace(/\n/g, '<br>')}
</div>
<p style="margin-top:24px;font-size:12px;color:#9ca3af">Message envoyé depuis ibig-elearn.vercel.app</p>
</body></html>`,
  })

  // Accusé de réception à l'expéditeur
  await sendEmail({
    to: email,
    subject: `✅ Votre message a bien été reçu — IBIG E-LEARN`,
    html: `
<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<div style="background:linear-gradient(135deg,#0B3D91,#1a6bd4);padding:32px;border-radius:16px;text-align:center;margin-bottom:24px">
  <h1 style="color:white;font-size:24px;margin:0">Message reçu !</h1>
  <p style="color:rgba(255,255,255,0.8);margin:8px 0 0">Nous reviendrons vers vous sous 24h ouvrées.</p>
</div>
<p style="color:#374151">Bonjour <strong>${name}</strong>,</p>
<p style="color:#374151">Nous avons bien reçu votre message concernant : <strong>${subject}</strong></p>
<p style="color:#374151">Notre équipe vous répondra dans les meilleurs délais.</p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
<p style="font-size:12px;color:#9ca3af;text-align:center">IBIG EDUFORM — ibig-elearn.vercel.app</p>
</body></html>`,
  })

  return NextResponse.json({ ok: true })
}
