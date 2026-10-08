'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { KeyRound, Webhook, Loader2, Trash2, Copy, Check, Send, BookOpen } from 'lucide-react'

type Key = { id: string; name: string; key_prefix: string; last_used_at: string | null; revoked_at: string | null; created_at: string }
type Hook = { id: string; url: string; events: string[]; last: { ok: boolean; status_code: number | null; attempted_at: string } | null }

const EVENTS: Record<string, string> = {
  'enrollment.created': 'Inscription à une formation',
  'course.completed': 'Formation terminée',
  'certificate.issued': 'Certificat délivré',
}

async function post(body: Record<string, unknown>) {
  const res = await fetch('/api/org/integrations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const d = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(d.error ?? 'Erreur')
  return d
}

function Secret({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm">
      <p className="font-semibold text-amber-900">{label} — copiez-la maintenant, elle ne sera plus affichée.</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="flex-1 min-w-0 truncate bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs">{value}</code>
        <button type="button" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true) }} className="flex items-center gap-1 text-xs font-semibold text-amber-900">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copier
        </button>
      </div>
    </div>
  )
}

export default function Integrations({ orgId, keys, hooks }: { orgId: string; keys: Key[]; hooks: Hook[] }) {
  const router = useRouter()
  const [keyName, setKeyName] = useState('')
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState<string[]>(Object.keys(EVENTS))
  const [shown, setShown] = useState<{ label: string; value: string } | null>(null)
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')

  const run = async (id: string, body: Record<string, unknown>, after?: (d: Record<string, unknown>) => void) => {
    setBusy(id); setMsg('')
    try { const d = await post({ orgId, ...body }); after?.(d); router.refresh() }
    catch (e) { setMsg((e as Error).message) } finally { setBusy('') }
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-gray-900">Intégrations (API & webhooks)</h2>
          <p className="text-xs text-gray-500">Connectez votre SIRH : synchronisez les inscriptions, la progression et les certificats.</p>
        </div>
        <Link href="/developpeurs" target="_blank" className="flex items-center gap-1 text-xs font-semibold text-[#0B3D91] whitespace-nowrap"><BookOpen className="w-3.5 h-3.5" /> Documentation</Link>
      </div>

      {shown && <Secret label={shown.label} value={shown.value} />}
      {msg && <p className="text-sm text-red-600">{msg}</p>}

      {/* Clés d'API */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-800 flex items-center gap-2"><KeyRound className="w-4 h-4 text-[#0B3D91]" /> Clés d&apos;API</p>
        {keys.filter(k => !k.revoked_at).map(k => (
          <div key={k.id} className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2 text-sm">
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-gray-900">{k.name}</span>
              <span className="block text-xs text-gray-400"><code>{k.key_prefix}…</code> · {k.last_used_at ? `utilisée le ${new Date(k.last_used_at).toLocaleDateString('fr-FR')}` : 'jamais utilisée'}</span>
            </span>
            <button type="button" disabled={busy === k.id} onClick={() => confirm('Révoquer cette clé ? Les intégrations qui l’utilisent cesseront de fonctionner.') && run(k.id, { action: 'revoke_key', id: k.id })}
              className="text-xs font-semibold text-red-600 hover:underline">Révoquer</button>
          </div>
        ))}
        <form onSubmit={e => { e.preventDefault(); run('key', { action: 'create_key', name: keyName }, d => { setShown({ label: 'Nouvelle clé d’API', value: String(d.key) }); setKeyName('') }) }} className="flex gap-2">
          <input value={keyName} onChange={e => setKeyName(e.target.value)} placeholder="Nom de l'intégration (ex. SIRH)" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <button disabled={busy === 'key'} className="flex items-center gap-1.5 bg-[#0B3D91] text-white text-sm font-semibold px-3 py-2 rounded-xl">{busy === 'key' && <Loader2 className="w-4 h-4 animate-spin" />} Créer une clé</button>
        </form>
      </div>

      {/* Webhooks */}
      <div className="space-y-2 border-t border-gray-100 pt-4">
        <p className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Webhook className="w-4 h-4 text-[#0B3D91]" /> Webhooks</p>
        {hooks.map(h => (
          <div key={h.id} className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2 text-sm">
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-xs text-gray-900 truncate">{h.url}</span>
              <span className="block text-xs text-gray-400">{h.events.map(e => EVENTS[e] ?? e).join(' · ')}
                {h.last ? <span className={h.last.ok ? 'text-emerald-600' : 'text-red-600'}> · dernier envoi {h.last.ok ? 'réussi' : `en échec${h.last.status_code ? ` (${h.last.status_code})` : ''}`}</span> : null}
              </span>
            </span>
            <button type="button" title="Envoyer un test" disabled={busy === `t${h.id}`} onClick={() => run(`t${h.id}`, { action: 'test_webhook', id: h.id }, d => setMsg(d.ok ? '' : `Test en échec ${d.status ?? ''} ${d.error ?? ''}`))}
              className="p-1.5 text-gray-400 hover:text-[#0B3D91]">{busy === `t${h.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</button>
            <button type="button" title="Supprimer" onClick={() => confirm('Supprimer ce webhook ?') && run(h.id, { action: 'delete_webhook', id: h.id })} className="p-1.5 text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        <form onSubmit={e => { e.preventDefault(); run('hook', { action: 'create_webhook', url, events }, d => { setShown({ label: 'Secret de signature du webhook', value: String(d.secret) }); setUrl('') }) }} className="space-y-2">
          <input value={url} onChange={e => setUrl(e.target.value)} required placeholder="https://votre-sirh.example.com/webhooks/ibig" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <div className="flex flex-wrap gap-3 text-xs text-gray-700">
            {Object.entries(EVENTS).map(([k, label]) => (
              <label key={k} className="flex items-center gap-1.5">
                <input type="checkbox" className="accent-[#0B3D91]" checked={events.includes(k)} onChange={e => setEvents(list => e.target.checked ? [...list, k] : list.filter(x => x !== k))} /> {label}
              </label>
            ))}
          </div>
          <button disabled={busy === 'hook'} className="flex items-center gap-1.5 bg-[#0B3D91] text-white text-sm font-semibold px-3 py-2 rounded-xl">{busy === 'hook' && <Loader2 className="w-4 h-4 animate-spin" />} Ajouter le webhook</button>
        </form>
      </div>
    </section>
  )
}
