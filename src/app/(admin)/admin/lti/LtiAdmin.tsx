'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Copy, Check, Trash2 } from 'lucide-react'

type Platform = { id: string; name: string; issuer: string; client_id: string; is_active: boolean; org: string | null; launches: number }

async function post(body: unknown) {
  const res = await fetch('/api/admin/lti', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const d = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(d.error ?? 'Erreur')
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [ok, setOk] = useState(false)
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-44 flex-shrink-0 text-gray-500">{label}</span>
      <code className="flex-1 min-w-0 truncate bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 text-xs">{value}</code>
      <button type="button" onClick={async () => { await navigator.clipboard.writeText(value); setOk(true); setTimeout(() => setOk(false), 1500) }} className="p-1.5 text-gray-400 hover:text-[#0B3D91]" aria-label="Copier">
        {ok ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default function LtiAdmin({ urls, platforms, orgs }: { urls: Record<string, string>; platforms: Platform[]; orgs: { id: string; name: string }[] }) {
  const router = useRouter()
  const empty = { name: '', issuer: '', clientId: '', authLoginUrl: '', jwksUrl: '', deploymentIds: '', orgId: '' }
  const [f, setF] = useState(empty)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const input = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm'

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2.5">
        <h2 className="font-bold text-gray-900">1. Informations à saisir dans votre plateforme (Moodle, Canvas…)</h2>
        <CopyRow label="Initiate login URL" value={urls.login} />
        <CopyRow label="Redirection URI / Launch" value={urls.launch} />
        <CopyRow label="Public keyset (JWKS)" value={urls.jwks} />
        <CopyRow label="Target link / Tool URL" value={urls.target} />
        <p className="text-xs text-gray-500 pt-1">Ajoutez le paramètre personnalisé <code>course=&lt;identifiant ou slug de la formation&gt;</code> à chaque activité. Activez le partage de l&apos;<strong>email</strong> et du nom, et choisissez l&apos;ouverture <strong>dans une nouvelle fenêtre</strong>.</p>
      </section>

      <form className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3"
        onSubmit={async e => { e.preventDefault(); setBusy(true); setErr(''); try { await post(f); setF(empty); router.refresh() } catch (x) { setErr((x as Error).message) } finally { setBusy(false) } }}>
        <h2 className="font-bold text-gray-900">2. Enregistrer la plateforme</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input required className={input} placeholder="Nom (ex. Moodle Université FHB)" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
          <input required className={input} placeholder="Issuer / Platform ID (https://…)" value={f.issuer} onChange={e => setF({ ...f, issuer: e.target.value })} />
          <input required className={input} placeholder="Client ID" value={f.clientId} onChange={e => setF({ ...f, clientId: e.target.value })} />
          <input className={input} placeholder="Deployment ID(s) — facultatif" value={f.deploymentIds} onChange={e => setF({ ...f, deploymentIds: e.target.value })} />
          <input required className={input} placeholder="Authentication request URL (https://…)" value={f.authLoginUrl} onChange={e => setF({ ...f, authLoginUrl: e.target.value })} />
          <input required className={input} placeholder="Public keyset URL / JWKS (https://…)" value={f.jwksUrl} onChange={e => setF({ ...f, jwksUrl: e.target.value })} />
          <select className={`${input} sm:col-span-2`} value={f.orgId} onChange={e => setF({ ...f, orgId: e.target.value })}>
            <option value="">Inscriptions non rattachées à un espace entreprise</option>
            {orgs.map(o => <option key={o.id} value={o.id}>Rattacher les inscriptions à : {o.name}</option>)}
          </select>
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button disabled={busy} className="flex items-center gap-2 bg-[#0B3D91] text-white font-semibold text-sm px-4 py-2.5 rounded-xl">{busy && <Loader2 className="w-4 h-4 animate-spin" />} Enregistrer</button>
      </form>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 font-bold text-gray-900">Plateformes connectées ({platforms.length})</div>
        {platforms.length === 0 ? <p className="p-6 text-center text-sm text-gray-400">Aucune plateforme enregistrée.</p> : (
          <ul className="divide-y divide-gray-50">
            {platforms.map(p => (
              <li key={p.id} className="px-5 py-3 flex items-center gap-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-gray-900">{p.name}{!p.is_active && <span className="ml-2 text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Désactivée</span>}</span>
                  <span className="block text-xs text-gray-400 truncate">{p.issuer} · client {p.client_id}{p.org ? ` · ${p.org}` : ''} · {p.launches} lancement{p.launches > 1 ? 's' : ''}</span>
                </span>
                <button type="button" onClick={async () => { await post({ action: 'toggle', id: p.id, isActive: !p.is_active }); router.refresh() }} className="text-xs font-semibold text-gray-500 hover:text-[#0B3D91]">{p.is_active ? 'Désactiver' : 'Activer'}</button>
                <button type="button" aria-label="Supprimer" onClick={async () => { if (confirm(`Supprimer « ${p.name} » ?`)) { await post({ action: 'delete', id: p.id }); router.refresh() } }} className="p-1.5 text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
