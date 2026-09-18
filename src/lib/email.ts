interface EmailPayload {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === 'VOTRE_RESEND_KEY') {
    console.warn('[email] RESEND_API_KEY non configuré — email ignoré')
    return { ok: false, reason: 'not_configured' }
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM ?? 'noreply@ibiglearn.com', to, subject, html }),
  })
  const data = await res.json()
  if (!res.ok) { console.error('[email] Resend error:', data); return { ok: false, error: data } }
  return { ok: true, id: data.id }
}

// ── Templates ──────────────────────────────────────────────────────

export function inscriptionEmail({ name, courseTitle, courseSlug }: { name: string; courseTitle: string; courseSlug: string }) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://ibig-elearn.vercel.app'}/formation/${courseSlug}`
  return {
    subject: `✅ Inscription confirmée — ${courseTitle}`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(11,61,145,.08)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0B3D91,#1558c0);padding:32px 40px;text-align:center">
            <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-.3px">
              IBIG <span style="color:#FFA500">E-LEARN</span>
            </p>
            <p style="margin:8px 0 0;font-size:13px;color:#a8c4f0">Votre plateforme panafricaine de formation</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px">
            <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a2e">Bienvenue, ${name} ! 🎉</p>
            <p style="margin:0 0 24px;font-size:15px;color:#666">Votre inscription à la formation ci-dessous a bien été confirmée.</p>

            <div style="background:#f0f4ff;border-left:4px solid #0B3D91;border-radius:8px;padding:16px 20px;margin-bottom:28px">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#0B3D91;text-transform:uppercase;letter-spacing:.5px">Formation</p>
              <p style="margin:0;font-size:16px;font-weight:700;color:#1a1a2e">${courseTitle}</p>
            </div>

            <p style="margin:0 0 20px;font-size:14px;color:#666;line-height:1.6">
              Vous avez désormais accès à l'intégralité du contenu. Commencez à votre rythme et obtenez votre certificat vérifiable à la fin.
            </p>

            <table cellpadding="0" cellspacing="0" style="margin:0 0 28px">
              <tr>
                <td style="background:#0B3D91;border-radius:10px;padding:0">
                  <a href="${url}" style="display:block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">
                    ▶ Accéder à ma formation
                  </a>
                </td>
              </tr>
            </table>

            <div style="border-top:1px solid #eef0f5;padding-top:24px">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1a1a2e">Ce qui vous attend :</p>
              <table cellpadding="0" cellspacing="0" style="width:100%">
                ${['Accès à vie au contenu', 'Leçons vidéo + documents téléchargeables', 'Certificat vérifiable à la réussite', 'Support du formateur'].map(f => `
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#555">
                    <span style="color:#22c55e;margin-right:8px">✓</span>${f}
                  </td>
                </tr>`).join('')}
              </table>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fc;padding:20px 40px;text-align:center;border-top:1px solid #eef0f5">
            <p style="margin:0;font-size:12px;color:#999">© 2026 IBIG E-LEARN · <a href="https://ibig-elearn.vercel.app" style="color:#0B3D91;text-decoration:none">ibig-elearn.vercel.app</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }
}

export function bienvenuEmail({ name, email }: { name: string; email: string }) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://ibig-elearn.vercel.app'}/catalogue`
  return {
    subject: 'Bienvenue sur IBIG E-LEARN 🎓',
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(11,61,145,.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#0B3D91,#1558c0);padding:32px 40px;text-align:center">
            <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff">IBIG <span style="color:#FFA500">E-LEARN</span></p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <p style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1a1a2e">Bienvenue, ${name} !</p>
            <p style="margin:0 0 24px;font-size:15px;color:#666;line-height:1.7">
              Votre compte a bien été créé avec l'adresse <strong>${email}</strong>.<br>
              Vous rejoignez une communauté de professionnels africains qui apprennent, se certifient et évoluent.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr>
                <td style="background:#FFA500;border-radius:10px">
                  <a href="${url}" style="display:block;padding:14px 28px;font-size:15px;font-weight:700;color:#000;text-decoration:none">
                    🎓 Explorer les formations
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:12px;color:#999">Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8f9fc;padding:16px 40px;text-align:center;border-top:1px solid #eef0f5">
            <p style="margin:0;font-size:12px;color:#999">© 2026 IBIG E-LEARN</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }
}
