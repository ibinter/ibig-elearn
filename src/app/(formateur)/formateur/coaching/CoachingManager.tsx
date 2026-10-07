'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DURATIONS, WEEKDAYS } from '@/lib/coaching'
import { COURSE_LANGUAGES } from '@/lib/languages'

type Offer = { id: string; title: string; description: string; category: string | null; duration_min: number; price_xof: number; language: string; format: string; is_active: boolean }
type Avail = { id: string; weekday: number; start_time: string; end_time: string }

const TIMEZONES = ['Africa/Abidjan', 'Africa/Dakar', 'Africa/Bamako', 'Africa/Ouagadougou', 'Africa/Lome', 'Africa/Porto-Novo', 'Africa/Conakry', 'Africa/Niamey', 'Africa/Douala', 'Africa/Libreville', 'Africa/Brazzaville', 'Africa/Kinshasa', 'Africa/Casablanca', 'Africa/Tunis', 'Europe/Paris', 'America/Montreal']
const field = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30'
const empty = { title: '', description: '', category: '', duration_min: 60, price_xof: 15000, language: 'fr', format: 'video' }

export default function CoachingManager({ coachId, initialOffers, initialAvailability, timezone }: { coachId: string; initialOffers: Offer[]; initialAvailability: Avail[]; timezone: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [offers, setOffers] = useState(initialOffers)
  const [avail, setAvail] = useState(initialAvailability)
  const [tz, setTz] = useState(timezone)
  const [editing, setEditing] = useState<Partial<Offer> & typeof empty | null>(null)
  const [slot, setSlot] = useState({ weekday: 1, start_time: '09:00', end_time: '12:00' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)

  const flash = (ok: boolean, t: string) => { setMsg({ ok, t }); setTimeout(() => setMsg(null), 4000) }

  async function saveOffer() {
    if (!editing) return
    if (editing.title.trim().length < 5 || editing.description.trim().length < 30) { flash(false, 'Titre (5 caractères min.) et description (30 caractères min.) requis.'); return }
    setBusy(true)
    const payload = {
      title: editing.title.trim(), description: editing.description.trim(), category: editing.category?.trim() || null,
      duration_min: Number(editing.duration_min), price_xof: Math.max(0, Math.round(Number(editing.price_xof) || 0)),
      language: editing.language, format: editing.format, updated_at: new Date().toISOString(),
    }
    const res = editing.id
      ? await supabase.from('coaching_offers').update(payload).eq('id', editing.id).select().single()
      : await supabase.from('coaching_offers').insert({ ...payload, coach_id: coachId, is_active: true }).select().single()
    setBusy(false)
    if (res.error) { flash(false, res.error.message); return }
    setOffers(o => editing.id ? o.map(x => x.id === editing.id ? res.data as Offer : x) : [res.data as Offer, ...o])
    setEditing(null)
    flash(true, 'Offre enregistrée')
    router.refresh()
  }

  async function toggleOffer(o: Offer) {
    const { error } = await supabase.from('coaching_offers').update({ is_active: !o.is_active }).eq('id', o.id)
    if (!error) setOffers(list => list.map(x => x.id === o.id ? { ...x, is_active: !o.is_active } : x))
  }

  async function addSlot() {
    if (slot.end_time <= slot.start_time) { flash(false, 'L\'heure de fin doit être après l\'heure de début.'); return }
    const { data, error } = await supabase.from('coach_availability').insert({ coach_id: coachId, ...slot }).select('id, weekday, start_time, end_time').single()
    if (error) { flash(false, error.message); return }
    setAvail(a => [...a, data as Avail].sort((x, y) => x.weekday - y.weekday || x.start_time.localeCompare(y.start_time)))
  }

  async function removeSlot(id: string) {
    const { error } = await supabase.from('coach_availability').delete().eq('id', id)
    if (!error) setAvail(a => a.filter(x => x.id !== id))
  }

  async function saveTz(v: string) {
    setTz(v)
    const { error } = await supabase.from('profiles').update({ timezone: v }).eq('id', coachId)
    flash(!error, error ? error.message : 'Fuseau horaire enregistré')
  }

  return (
    <div className="space-y-6">
      {msg && <div className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg.t}</div>}

      {/* ── Offres ── */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900">Mes offres de coaching</h2>
          {!editing && (
            <button onClick={() => setEditing({ ...empty })} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl ibig-gradient text-white text-sm font-semibold">
              <Plus className="w-4 h-4" /> Nouvelle offre
            </button>
          )}
        </div>

        {editing && (
          <div className="mt-4 space-y-3 rounded-xl bg-gray-50 border border-gray-100 p-4">
            <input className={field} placeholder="Titre — ex : Préparer un entretien d'embauche" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} />
            <textarea className={field} rows={4} placeholder="Ce que la séance apporte, pour qui, comment elle se déroule…" value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className="text-xs font-semibold text-gray-600">Durée
                <select className={field} value={editing.duration_min} onChange={e => setEditing({ ...editing, duration_min: Number(e.target.value) })}>
                  {DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-gray-600">Prix (FCFA)
                <input className={field} type="number" min={0} step={500} inputMode="numeric" value={editing.price_xof} onChange={e => setEditing({ ...editing, price_xof: Number(e.target.value) })} />
              </label>
              <label className="text-xs font-semibold text-gray-600">Langue
                <select className={field} value={editing.language} onChange={e => setEditing({ ...editing, language: e.target.value })}>
                  {COURSE_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-gray-600">Format
                <select className={field} value={editing.format} onChange={e => setEditing({ ...editing, format: e.target.value })}>
                  <option value="video">Visio</option>
                  <option value="phone">Téléphone</option>
                </select>
              </label>
            </div>
            <input className={field} placeholder="Thème (optionnel) — ex : Carrière, Entrepreneuriat, Leadership" value={editing.category ?? ''} onChange={e => setEditing({ ...editing, category: e.target.value })} />
            <p className="text-xs text-gray-500">Votre part : selon votre convention de partenariat (50 % par défaut), créditée à chaque séance payée.</p>
            <div className="flex gap-2">
              <button onClick={saveOffer} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl ibig-gradient text-white text-sm font-semibold disabled:opacity-60">
                {busy && <Loader2 className="w-4 h-4 animate-spin" />} Enregistrer
              </button>
              <button onClick={() => setEditing(null)} className="px-4 py-2.5 rounded-xl text-sm text-gray-600">Annuler</button>
            </div>
          </div>
        )}

        <div className="mt-4 divide-y divide-gray-100">
          {offers.length === 0 && !editing && <p className="py-4 text-sm text-gray-500">Aucune offre. Créez votre première offre de coaching.</p>}
          {offers.map(o => (
            <div key={o.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 truncate">{o.title}</p>
                <p className="text-sm text-gray-500">{o.duration_min} min · {o.price_xof > 0 ? `${o.price_xof.toLocaleString('fr-FR')} FCFA` : 'Gratuit'} · {o.format === 'phone' ? 'Téléphone' : 'Visio'}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleOffer(o)} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${o.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {o.is_active ? 'En ligne' : 'Masquée'}
                </button>
                <button onClick={() => setEditing({ ...empty, ...o, category: o.category ?? '' })} className="text-sm font-semibold text-[#0B3D91] px-2 py-1">Modifier</button>
                {o.is_active && <Link href={`/coaching/${o.id}`} target="_blank" className="text-gray-400 hover:text-[#0B3D91] p-1" aria-label="Voir la page publique"><ExternalLink className="w-4 h-4" /></Link>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Disponibilités ── */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Mes disponibilités hebdomadaires</h2>
          <p className="text-sm text-gray-500">Les apprenants réservent dans ces plages (au moins 12 h à l&apos;avance, jusqu&apos;à 3 semaines). Les créneaux déjà réservés sont retirés automatiquement.</p>
        </div>
        <label className="block text-xs font-semibold text-gray-600 max-w-xs">Votre fuseau horaire
          <select className={field} value={tz} onChange={e => saveTz(e.target.value)}>
            {TIMEZONES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
        </label>

        <div className="flex flex-wrap items-end gap-2 rounded-xl bg-gray-50 border border-gray-100 p-3">
          <label className="text-xs font-semibold text-gray-600">Jour
            <select className={field} value={slot.weekday} onChange={e => setSlot({ ...slot, weekday: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5, 6, 0].map(d => <option key={d} value={d}>{WEEKDAYS[d]}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-gray-600">De
            <input type="time" step={1800} className={field} value={slot.start_time} onChange={e => setSlot({ ...slot, start_time: e.target.value })} />
          </label>
          <label className="text-xs font-semibold text-gray-600">À
            <input type="time" step={1800} className={field} value={slot.end_time} onChange={e => setSlot({ ...slot, end_time: e.target.value })} />
          </label>
          <button onClick={addSlot} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0B3D91] text-white text-sm font-semibold"><Plus className="w-4 h-4" /> Ajouter</button>
        </div>

        {avail.length === 0 ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">Ajoutez au moins une plage : sans disponibilité, vos offres n&apos;affichent aucun créneau.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {avail.map(a => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2.5">
                <span className="text-sm"><strong>{WEEKDAYS[a.weekday]}</strong> · {a.start_time.slice(0, 5)} – {a.end_time.slice(0, 5)}</span>
                <button onClick={() => removeSlot(a.id)} className="text-gray-400 hover:text-red-600 p-1" aria-label="Supprimer"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
