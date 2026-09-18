const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ibiglearn.com'

function emailWrapper(content: string) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 16px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(11,61,145,.08)">
<tr><td style="background:linear-gradient(135deg,#0B3D91,#1558c0);padding:28px 40px;text-align:center">
  <p style="margin:0;font-size:20px;font-weight:800;color:#fff">IBIG <span style="color:#FFA500">E-LEARN</span></p>
</td></tr>
<tr><td style="padding:36px 40px">${content}</td></tr>
<tr><td style="background:#f8f9fc;padding:16px 40px;text-align:center;border-top:1px solid #eef0f5">
  <p style="margin:0;font-size:12px;color:#999">© 2026 IBIG E-LEARN · <a href="${BASE}" style="color:#0B3D91;text-decoration:none">${BASE.replace('https://', '')}</a></p>
</td></tr>
</table></td></tr></table></body></html>`
}

function btn(href: string, label: string, bg = '#0B3D91', color = '#fff') {
  return `<table cellpadding="0" cellspacing="0" style="margin:20px 0"><tr><td style="background:${bg};border-radius:10px"><a href="${href}" style="display:block;padding:13px 26px;font-size:14px;font-weight:700;color:${color};text-decoration:none">${label}</a></td></tr></table>`
}

export function rappelInactifEmail({ name, daysSinceActivity }: { name: string; daysSinceActivity: number }) {
  return {
    subject: `${name}, votre formation vous attend 🔔`,
    html: emailWrapper(`
      <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1a2e">On a remarqué votre absence, ${name} !</p>
      <p style="margin:0 0 20px;font-size:14px;color:#666;line-height:1.7">
        Cela fait <strong>${daysSinceActivity} jours</strong> que vous n'avez pas ouvert votre formation.
        Votre progression est sauvegardée — reprenez là où vous vous êtes arrêté.
      </p>
      <div style="background:#fff9e6;border-left:4px solid #FFA500;border-radius:8px;padding:14px 18px;margin-bottom:20px">
        <p style="margin:0;font-size:13px;color:#856404">💡 <strong>Conseil :</strong> 15 minutes par jour suffisent pour progresser régulièrement et maintenir votre streak !</p>
      </div>
      ${btn(`${BASE}/mes-formations`, '▶ Reprendre mes formations')}
    `),
  }
}

export function felicitationsFormationEmail({ name, courseTitle, certId }: { name: string; courseTitle: string; certId: string }) {
  return {
    subject: `🎓 Félicitations ${name} — Certificat obtenu !`,
    html: emailWrapper(`
      <div style="text-align:center;margin-bottom:28px">
        <div style="width:72px;height:72px;background:linear-gradient(135deg,#FFA500,#ff8c00);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:32px">🏆</div>
      </div>
      <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1a2e;text-align:center">Bravo ${name} !</p>
      <p style="margin:0 0 20px;font-size:14px;color:#666;text-align:center;line-height:1.7">
        Vous avez terminé la formation <strong>${courseTitle}</strong>.<br>
        Votre certificat vérifiable est prêt à être téléchargé et partagé.
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px">
        <p style="margin:0 0 4px;font-size:13px;color:#166534;font-weight:600">Certificat de réussite</p>
        <p style="margin:0;font-size:16px;font-weight:700;color:#15803d">${courseTitle}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#4ade80">Délivré par IBIG E-LEARN · Vérifiable en ligne</p>
      </div>
      ${btn(`${BASE}/mes-certificats/${certId}`, '📜 Télécharger mon certificat', '#FFA500', '#000')}
      <p style="margin:0;font-size:13px;color:#666;line-height:1.7">
        Partagez votre succès sur LinkedIn et montrez à votre réseau ce que vous avez accompli.
        Votre prochaine formation vous attend !
      </p>
    `),
  }
}

export function nouvelleLeonEmail({ name, courseTitle, lessonTitle, courseSlug, lessonId }: { name: string; courseTitle: string; lessonTitle: string; courseSlug: string; lessonId: string }) {
  return {
    subject: `📚 Nouvelle leçon disponible — ${courseTitle}`,
    html: emailWrapper(`
      <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1a1a2e">Nouvelle leçon publiée !</p>
      <p style="margin:0 0 20px;font-size:14px;color:#666;line-height:1.7">
        Bonjour ${name}, une nouvelle leçon vient d'être ajoutée à votre formation.
      </p>
      <div style="background:#f0f4ff;border-left:4px solid #0B3D91;border-radius:8px;padding:16px 20px;margin-bottom:20px">
        <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#0B3D91;text-transform:uppercase">Formation</p>
        <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#1a1a2e">${courseTitle}</p>
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#0B3D91;text-transform:uppercase">Nouvelle leçon</p>
        <p style="margin:0;font-size:14px;color:#374151">${lessonTitle}</p>
      </div>
      ${btn(`${BASE}/apprendre/${courseSlug}/${lessonId}`, '▶ Accéder à la leçon')}
    `),
  }
}
