'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileSignature, Loader2, Percent } from 'lucide-react'
import type { PartnerAgreement } from '@/lib/partner'

export default function AgreementAcceptance({ agreement, defaultName }: { agreement: PartnerAgreement; defaultName: string }) {
  const router = useRouter()
  const [name, setName] = useState(defaultName)
  const [accept, setAccept] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const share = Number(agreement.instructor_share_pct)

  async function sign() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/partenaire/accepter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agreementId: agreement.id, signatureName: name, accept }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Une erreur est survenue.'); return }
    router.push('/formateur/formations/nouvelle?bienvenue=1')
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
        <p className="font-bold text-emerald-900 text-lg">🎉 Votre candidature est retenue</p>
        <p className="mt-1 text-emerald-800 text-[15px]">IBIG EDUFORM vous propose la convention ci-dessous. Lisez-la attentivement, puis signez-la pour commencer à publier vos formations.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <Percent className="w-5 h-5 text-[#0B3D91] mx-auto" />
          <p className="mt-1 text-3xl font-extrabold text-[#0B3D91]">{share} %</p>
          <p className="text-xs text-gray-500">Votre part sur chaque vente</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <Percent className="w-5 h-5 text-[#FFA500] mx-auto" />
          <p className="mt-1 text-3xl font-extrabold text-[#FFA500]">{Math.round((100 - share) * 100) / 100} %</p>
          <p className="text-xs text-gray-500">Part IBIG EDUFORM</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <p className="px-5 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FileSignature className="w-4 h-4 text-[#0B3D91]" /> Convention de partenariat · version {agreement.terms_version}
        </p>
        <div className="max-h-[55vh] overflow-y-auto overscroll-contain px-5 py-4 text-[14px] leading-relaxed text-gray-700 whitespace-pre-line" data-no-translate>
          {agreement.terms_snapshot}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div>
          <label htmlFor="sig" className="block text-sm font-semibold text-gray-800 mb-1.5">Signature — saisissez votre nom complet</label>
          <input id="sig" value={name} onChange={e => setName(e.target.value)} autoComplete="name"
            className="w-full rounded-xl border border-gray-200 px-3.5 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
          {name.trim() && <p className="mt-2 text-3xl text-[#0B3D91]" style={{ fontFamily: '"Brush Script MT", "Segoe Script", cursive' }}>{name}</p>}
        </div>
        <label className="flex items-start gap-3 text-sm text-gray-700">
          <input type="checkbox" className="mt-0.5 w-5 h-5 accent-[#0B3D91]" checked={accept} onChange={e => setAccept(e.target.checked)} />
          <span>J&apos;ai lu et j&apos;accepte la convention de partenariat IBIG EDUFORM. Je reconnais que cette acceptation électronique vaut signature.</span>
        </label>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button onClick={sign} disabled={!accept || name.trim().length < 3 || loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl ibig-gradient text-white font-bold disabled:opacity-60">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSignature className="w-5 h-5" />}
          Signer et devenir formateur partenaire
        </button>
      </div>
    </div>
  )
}
