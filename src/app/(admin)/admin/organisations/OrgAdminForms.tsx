'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'

const input = 'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30'

async function post(body: unknown) {
  const res = await fetch('/api/admin/organisations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? 'Erreur')
  return data
}

type Req = { id: string; company: string; contact: string; email: string; phone: string; seats: number }

export function CreateOrgForm({ requests }: { requests: Req[] }) {
  const router = useRouter()
  const empty = { name: '', ownerEmail: '', contactName: '', contactPhone: '', country: 'CI', plan: 'starter', maxSeats: 10, b2bRequestId: '' }
  const [f, setF] = useState(empty)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const set = (k: keyof typeof empty, v: string | number) => setF(p => ({ ...p, [k]: v }))

  function fromRequest(id: string) {
    const r = requests.find(x => x.id === id)
    if (!r) return set('b2bRequestId', '')
    setF(p => ({ ...p, b2bRequestId: id, name: r.company, ownerEmail: r.email, contactName: r.contact, contactPhone: r.phone, maxSeats: r.seats }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    try {
      const r = await post({ ...f, b2bRequestId: f.b2bRequestId || null })
      setMsg({ ok: true, text: r.ownerStatus === 'invited'
        ? 'Espace créé. Le responsable a reçu un email pour activer son compte.'
        : 'Espace créé et rattaché au compte du responsable.' })
      setF(empty)
      router.refresh()
    } catch (err) { setMsg({ ok: false, text: (err as Error).message }) } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-bold text-gray-900 flex items-center gap-2"><Plus className="w-5 h-5 text-[#0B3D91]" /> Ouvrir un espace entreprise</h2>
      {requests.length > 0 && (
        <select value={f.b2bRequestId} onChange={e => fromRequest(e.target.value)} className={`${input} mt-3`}>
          <option value="">Pré-remplir depuis une demande entreprise…</option>
          {requests.map(r => <option key={r.id} value={r.id}>{r.company} — {r.contact}</option>)}
        </select>
      )}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <input required value={f.name} onChange={e => set('name', e.target.value)} placeholder="Nom de l'entreprise" className={input} />
        <input required type="email" value={f.ownerEmail} onChange={e => set('ownerEmail', e.target.value)} placeholder="Email du responsable" className={input} />
        <input value={f.contactName} onChange={e => set('contactName', e.target.value)} placeholder="Nom du responsable" className={input} />
        <input value={f.contactPhone} onChange={e => set('contactPhone', e.target.value)} placeholder="Téléphone" className={input} />
        <select value={f.plan} onChange={e => set('plan', e.target.value)} className={input}>
          <option value="starter">Starter</option><option value="business">Business</option><option value="enterprise">Enterprise</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Sièges <input type="number" min={1} max={10000} value={f.maxSeats} onChange={e => set('maxSeats', Number(e.target.value))} className={input} />
        </label>
        <input value={f.country} onChange={e => set('country', e.target.value.toUpperCase().slice(0, 2))} placeholder="Pays (CI)" className={input} />
        <button disabled={busy} className="flex items-center justify-center gap-2 bg-[#0B3D91] text-white font-semibold rounded-xl py-2.5 disabled:opacity-50">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Créer l&apos;espace
        </button>
      </div>
      {msg && <p className={`mt-2 text-sm ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</p>}
    </form>
  )
}

export function OrgSettings({ orgId, plan, maxSeats, isActive }: { orgId: string; plan: string; maxSeats: number; isActive: boolean }) {
  const router = useRouter()
  const [p, setP] = useState(plan)
  const [s, setS] = useState(maxSeats)
  const [busy, setBusy] = useState(false)
  const dirty = p !== plan || s !== maxSeats
  async function save(extra: Record<string, unknown> = {}) {
    setBusy(true)
    try { await post({ orgId, plan: p, maxSeats: s, ...extra }); router.refresh() }
    catch (err) { alert((err as Error).message) } finally { setBusy(false) }
  }
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select value={p} onChange={e => setP(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs">
        <option value="starter">Starter</option><option value="business">Business</option><option value="enterprise">Enterprise</option>
      </select>
      <input type="number" min={1} value={s} onChange={e => setS(Number(e.target.value))} className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-xs" aria-label="Sièges" />
      {dirty && <button disabled={busy} onClick={() => save()} className="text-xs font-semibold bg-[#0B3D91] text-white px-3 py-1.5 rounded-lg">Enregistrer</button>}
      <button disabled={busy} onClick={() => save({ isActive: !isActive })} className="text-xs font-semibold text-gray-500 hover:text-red-600 px-2 py-1.5">
        {isActive ? 'Désactiver' : 'Réactiver'}
      </button>
    </div>
  )
}
