import type { Metadata } from 'next'
import { Code2, KeyRound, Webhook, ShieldCheck } from 'lucide-react'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'API & webhooks — documentation développeurs',
  description: 'Connectez votre SIRH à IBIG E-LEARNING : API REST pour les inscriptions, la progression et les certificats, webhooks signés en temps réel.',
  alternates: { canonical: '/developpeurs' },
}

const API = `${SITE_URL}/api/v1`

function Code({ children }: { children: string }) {
  return <pre className="bg-[#0b1220] text-gray-100 text-[13px] leading-relaxed rounded-xl p-4 overflow-x-auto"><code>{children}</code></pre>
}

const ENDPOINTS = [
  { m: 'GET', p: '/courses', d: 'Catalogue des formations publiées (identifiant, titre, durée, niveau, validité du certificat).' },
  { m: 'GET', p: '/members', d: 'Collaborateurs actifs de votre espace entreprise.' },
  { m: 'GET', p: '/enrollments?since=2026-01-01&course_id=…', d: 'Inscriptions financées par votre organisation : progression, échéance et statut (in_progress, overdue, completed).' },
  { m: 'POST', p: '/enrollments', d: 'Inscrit un collaborateur (compte existant) à une formation, avec une échéance facultative.' },
  { m: 'GET', p: '/certificates?since=2026-01-01', d: 'Certificats obtenus : numéro, dates, statut (valid, expired, revoked) et lien de vérification.' },
]

export default function DeveloppeursPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-10">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-[#FFA500]">Développeurs</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-gray-900">API & webhooks IBIG E-LEARNING</h1>
        <p className="mt-3 text-gray-600 text-lg">Synchronisez votre SIRH avec la formation de vos équipes : inscriptions automatiques, suivi de la progression et récupération des certificats.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><KeyRound className="w-5 h-5 text-[#0B3D91]" /> Authentification</h2>
        <p className="text-gray-600">Créez une clé dans votre <strong>espace entreprise → Intégrations</strong> (réservé au propriétaire ou à un administrateur). Elle s&apos;affiche une seule fois ; envoyez-la dans l&apos;en-tête <code>Authorization</code>. Une clé ne donne accès qu&apos;aux données de votre organisation.</p>
        <Code>{`curl ${API}/enrollments \\
  -H "Authorization: Bearer ibig_live_xxxxxxxxxxxxxxxxxxxxxxxx"`}</Code>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Code2 className="w-5 h-5 text-[#0B3D91]" /> Points d&apos;accès</h2>
        <p className="text-gray-600">Base : <code>{API}</code> · réponses JSON au format <code>{'{ "data": [...] }'}</code> · dates ISO 8601.</p>
        <div className="rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {ENDPOINTS.map(e => (
            <div key={e.m + e.p} className="p-4 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
              <span className={`self-start text-xs font-bold px-2 py-1 rounded ${e.m === 'GET' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>{e.m}</span>
              <span className="min-w-0"><code className="text-sm font-semibold text-gray-900 break-all">{e.p}</code><span className="block text-sm text-gray-600 mt-0.5">{e.d}</span></span>
            </div>
          ))}
        </div>
        <p className="text-sm font-semibold text-gray-800">Exemple : inscrire un collaborateur</p>
        <Code>{`curl -X POST ${API}/enrollments \\
  -H "Authorization: Bearer ibig_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{ "email": "awa.kone@entreprise.ci", "course_id": "…", "due_date": "2026-12-31" }'

→ 201 { "ok": true, "created": true }`}</Code>
        <p className="text-sm text-gray-600">Codes d&apos;erreur : <code>401</code> clé invalide ou révoquée · <code>404</code> formation ou compte introuvable · <code>409</code> plus de siège disponible.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Webhook className="w-5 h-5 text-[#0B3D91]" /> Webhooks</h2>
        <p className="text-gray-600">IBIG E-LEARNING envoie une requête <code>POST</code> JSON à votre URL (HTTPS obligatoire) lors de ces événements :</p>
        <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm">
          <li><code>enrollment.created</code> — un collaborateur est inscrit à une formation financée par votre organisation ;</li>
          <li><code>course.completed</code> — il termine la formation ;</li>
          <li><code>certificate.issued</code> — son certificat est délivré (numéro, date d&apos;expiration, lien de vérification).</li>
        </ul>
        <Code>{`POST /webhooks/ibig
X-IBIG-Event: certificate.issued
X-IBIG-Signature: sha256=5f2b…

{
  "id": "evt_8c1e…",
  "event": "certificate.issued",
  "created_at": "2026-10-08T09:30:00.000Z",
  "data": {
    "user_id": "…", "email": "awa.kone@entreprise.ci", "name": "Awa Koné",
    "course_id": "…", "course_title": "Comptabilité OHADA pour PME",
    "certificate_number": "IBIG-2026-4K9Q2Z", "issued_at": "…", "expires_at": null,
    "verify_url": "${SITE_URL}/certificat/IBIG-2026-4K9Q2Z"
  }
}`}</Code>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-[#0B3D91]" /> Vérifier la signature</h2>
        <p className="text-gray-600">Chaque envoi est signé avec le secret affiché à la création du webhook (HMAC-SHA256 du corps brut). Rejetez toute requête dont la signature ne correspond pas. Répondez par un code 2xx en moins de 5 secondes.</p>
        <Code>{`import crypto from 'node:crypto'

function verify(rawBody, signatureHeader, secret) {
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected))
}`}</Code>
      </section>
    </div>
  )
}
