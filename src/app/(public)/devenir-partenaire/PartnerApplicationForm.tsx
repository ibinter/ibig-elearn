'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Send } from 'lucide-react'
import { EXPERTISE_DOMAINS, PAYOUT_METHODS, type InstructorApplication, type PartnerState } from '@/lib/partner'

const COUNTRIES = ["Côte d'Ivoire", 'Sénégal', 'Mali', 'Burkina Faso', 'Bénin', 'Togo', 'Guinée', 'Niger', 'Cameroun', 'Gabon', 'Congo', 'RD Congo', 'Maroc', 'Tunisie', 'Algérie', 'France', 'Canada', 'Autre']
const LANGS = [{ v: 'fr', l: 'Français' }, { v: 'en', l: 'Anglais' }, { v: 'ar', l: 'Arabe' }, { v: 'pt', l: 'Portugais' }]

type Props = { initial: InstructorApplication | null; profile: PartnerState['profile'] }

const field = 'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91]'
const label = 'block text-sm font-semibold text-gray-800 mb-1.5'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-xs font-bold uppercase tracking-wider text-[#0B3D91] mb-1">{title}</legend>
      {children}
    </fieldset>
  )
}

export default function PartnerApplicationForm({ initial, profile }: Props) {
  const router = useRouter()
  const [f, setF] = useState({
    full_name: initial?.full_name ?? profile?.full_name ?? '',
    professional_title: initial?.professional_title ?? '',
    phone: initial?.phone ?? profile?.phone ?? '',
    whatsapp: initial?.whatsapp ?? '',
    country: initial?.country ?? '',
    city: initial?.city ?? '',
    expertise_domains: initial?.expertise_domains ?? [] as string[],
    years_experience: initial?.years_experience?.toString() ?? '',
    bio: initial?.bio ?? '',
    linkedin_url: initial?.linkedin_url ?? '',
    website_url: initial?.website_url ?? '',
    sample_content_url: initial?.sample_content_url ?? '',
    teaching_languages: initial?.teaching_languages ?? ['fr'],
    planned_courses: initial?.planned_courses ?? '',
    legal_status: initial?.legal_status ?? 'individual',
    company_name: initial?.company_name ?? '',
    tax_id: initial?.tax_id ?? '',
    payout_method: initial?.payout_method ?? 'orange_money',
    payout_account: initial?.payout_account ?? '',
    signature_name: initial?.signature_name ?? profile?.full_name ?? '',
    motivation: initial?.motivation ?? '',
    accept_cgu: !!initial,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(s => ({ ...s, [k]: v }))
  const toggle = (k: 'expertise_domains' | 'teaching_languages', v: string, max = 5) =>
    setF(s => {
      const cur = s[k]
      return { ...s, [k]: cur.includes(v) ? cur.filter(x => x !== v) : cur.length >= max ? cur : [...cur, v] }
    })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/partenaire/candidature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(f),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Une erreur est survenue.'); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    router.refresh()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const bioLeft = Math.max(0, 150 - f.bio.trim().length)

  return (
    <form onSubmit={submit} className="space-y-8">
      {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3" role="alert">{error}</div>}

      <Section title="Identité">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label} htmlFor="full_name">Nom complet *</label>
            <input id="full_name" className={field} value={f.full_name} onChange={e => set('full_name', e.target.value)} required autoComplete="name" />
          </div>
          <div>
            <label className={label} htmlFor="professional_title">Titre professionnel *</label>
            <input id="professional_title" className={field} value={f.professional_title} onChange={e => set('professional_title', e.target.value)} placeholder="Ex : Expert-comptable, Consultant RH" required />
          </div>
          <div>
            <label className={label} htmlFor="phone">Téléphone *</label>
            <input id="phone" type="tel" className={field} value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="+225 07 00 00 00 00" required autoComplete="tel" />
          </div>
          <div>
            <label className={label} htmlFor="whatsapp">WhatsApp</label>
            <input id="whatsapp" type="tel" className={field} value={f.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="Si différent du téléphone" />
          </div>
          <div>
            <label className={label} htmlFor="country">Pays *</label>
            <select id="country" className={field} value={f.country} onChange={e => set('country', e.target.value)} required>
              <option value="">Sélectionner…</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="city">Ville *</label>
            <input id="city" className={field} value={f.city} onChange={e => set('city', e.target.value)} required autoComplete="address-level2" />
          </div>
        </div>
      </Section>

      <Section title="Expertise">
        <div>
          <p className={label}>Domaines d&apos;expertise * <span className="font-normal text-gray-400">(5 maximum)</span></p>
          <div className="flex flex-wrap gap-2">
            {EXPERTISE_DOMAINS.map(d => {
              const on = f.expertise_domains.includes(d)
              return (
                <button type="button" key={d} onClick={() => toggle('expertise_domains', d)} aria-pressed={on}
                  className={`px-3 py-2 rounded-full text-sm border transition-colors ${on ? 'bg-[#0B3D91] border-[#0B3D91] text-white' : 'bg-white border-gray-200 text-gray-700'}`}>
                  {d}
                </button>
              )
            })}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label} htmlFor="years">Années d&apos;expérience professionnelle *</label>
            <input id="years" type="number" min={0} max={60} inputMode="numeric" className={field} value={f.years_experience} onChange={e => set('years_experience', e.target.value)} required />
          </div>
          <div>
            <p className={label}>Langues d&apos;enseignement *</p>
            <div className="flex flex-wrap gap-2">
              {LANGS.map(l => {
                const on = f.teaching_languages.includes(l.v)
                return (
                  <button type="button" key={l.v} onClick={() => toggle('teaching_languages', l.v, 4)} aria-pressed={on}
                    className={`px-3 py-2 rounded-full text-sm border ${on ? 'bg-[#0B3D91] border-[#0B3D91] text-white' : 'bg-white border-gray-200 text-gray-700'}`}>
                    {l.l}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <div>
          <label className={label} htmlFor="bio">Biographie professionnelle *</label>
          <textarea id="bio" rows={5} className={field} value={f.bio} onChange={e => set('bio', e.target.value)}
            placeholder="Votre parcours, vos réalisations, vos certifications… Elle apparaîtra sur votre profil public de formateur." required />
          <p className={`mt-1 text-xs ${bioLeft ? 'text-gray-400' : 'text-emerald-600'}`}>{bioLeft ? `Encore ${bioLeft} caractères minimum` : '✓ Longueur suffisante'}</p>
        </div>
        <div>
          <label className={label} htmlFor="planned">Formations que vous souhaitez créer *</label>
          <textarea id="planned" rows={3} className={field} value={f.planned_courses} onChange={e => set('planned_courses', e.target.value)}
            placeholder="Titres, public visé, durée approximative de chaque formation." required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={label} htmlFor="linkedin">LinkedIn</label>
            <input id="linkedin" className={field} value={f.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} placeholder="linkedin.com/in/…" inputMode="url" />
          </div>
          <div>
            <label className={label} htmlFor="website">Site web</label>
            <input id="website" className={field} value={f.website_url} onChange={e => set('website_url', e.target.value)} placeholder="https://…" inputMode="url" />
          </div>
          <div>
            <label className={label} htmlFor="sample">Exemple de contenu</label>
            <input id="sample" className={field} value={f.sample_content_url} onChange={e => set('sample_content_url', e.target.value)} placeholder="Vidéo, support, chaîne…" inputMode="url" />
          </div>
        </div>
        <div>
          <label className={label} htmlFor="motivation">Motivation</label>
          <textarea id="motivation" rows={3} className={field} value={f.motivation} onChange={e => set('motivation', e.target.value)} placeholder="Pourquoi souhaitez-vous enseigner avec IBIG EDUFORM ?" />
        </div>
      </Section>

      <Section title="Statut et versement des revenus">
        <div className="grid grid-cols-2 gap-2">
          {([['individual', 'Personne physique'], ['company', 'Entreprise / cabinet']] as const).map(([v, l]) => (
            <button type="button" key={v} onClick={() => set('legal_status', v)} aria-pressed={f.legal_status === v}
              className={`py-3 rounded-xl border text-sm font-semibold ${f.legal_status === v ? 'border-[#0B3D91] bg-[#0B3D91]/5 text-[#0B3D91]' : 'border-gray-200 bg-white text-gray-600'}`}>
              {l}
            </button>
          ))}
        </div>
        {f.legal_status === 'company' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label} htmlFor="company">Raison sociale *</label>
              <input id="company" className={field} value={f.company_name} onChange={e => set('company_name', e.target.value)} required />
            </div>
            <div>
              <label className={label} htmlFor="tax">N° contribuable / RCCM</label>
              <input id="tax" className={field} value={f.tax_id} onChange={e => set('tax_id', e.target.value)} />
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label} htmlFor="payout_method">Mode de versement *</label>
            <select id="payout_method" className={field} value={f.payout_method} onChange={e => set('payout_method', e.target.value as typeof f.payout_method)}>
              {Object.entries(PAYOUT_METHODS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="payout_account">{f.payout_method === 'bank_transfer' ? 'IBAN / RIB *' : 'Numéro Mobile Money *'}</label>
            <input id="payout_account" className={field} value={f.payout_account} onChange={e => set('payout_account', e.target.value)} required />
          </div>
        </div>
      </Section>

      <Section title="Signature et engagement">
        <div>
          <label className={label} htmlFor="signature">Nom figurant sur vos certificats cosignés *</label>
          <input id="signature" className={field} value={f.signature_name} onChange={e => set('signature_name', e.target.value)} required />
          {f.signature_name.trim() && (
            <p className="mt-2 text-3xl text-[#0B3D91]" style={{ fontFamily: '"Brush Script MT", "Segoe Script", cursive' }}>{f.signature_name}</p>
          )}
        </div>
        <label className="flex items-start gap-3 text-sm text-gray-700">
          <input type="checkbox" className="mt-0.5 w-5 h-5 accent-[#0B3D91]" checked={f.accept_cgu} onChange={e => set('accept_cgu', e.target.checked)} />
          <span>
            Je certifie l&apos;exactitude de ces informations et j&apos;accepte les <Link href="/cgu" target="_blank" className="text-[#0B3D91] font-semibold underline">CGU</Link> de la plateforme.
            J&apos;ai pris connaissance du modèle de <Link href="/conditions-partenaires" target="_blank" className="text-[#0B3D91] font-semibold underline">convention de partenariat</Link> que je signerai si ma candidature est retenue.
          </span>
        </label>
      </Section>

      <button type="submit" disabled={loading || !f.accept_cgu}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl ibig-gradient text-white font-bold disabled:opacity-60">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        {initial ? 'Envoyer ma candidature mise à jour' : 'Envoyer ma candidature'}
      </button>
    </form>
  )
}
