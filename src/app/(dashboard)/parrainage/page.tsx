'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, Share2, Users, Gift, Trophy } from 'lucide-react'

export default function ParrainagePage() {
  interface Referral { id: string; status: string; created_at: string; name: string; country?: string | null }
  const [data, setData] = useState<{
    code: string; referralUrl: string; totalRefs: number; rewardedRefs: number; pointsPerReferral: number
    referrals: Referral[]
  } | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)

  useEffect(() => {
    fetch('/api/referral').then(r => r.json()).then(setData)
  }, [])

  const copyCode = async () => {
    if (!data) return
    await navigator.clipboard.writeText(data.code)
    setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000)
  }
  const copyUrl = async () => {
    if (!data) return
    await navigator.clipboard.writeText(data.referralUrl)
    setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000)
  }

  const shareWhatsApp = () => {
    if (!data) return
    const msg = `🎓 Je t'invite à rejoindre IBIG E-LEARN, la plateforme de formation panafricaine !\nUtilise mon lien pour t'inscrire gratuitement : ${data.referralUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const shareEmail = () => {
    if (!data) return
    const subject = encodeURIComponent("Je t'invite sur IBIG E-LEARN !")
    const body = encodeURIComponent(
      `Bonjour,\n\nJe t'invite à rejoindre IBIG E-LEARN, la plateforme de formation panafricaine.\n\nInscris-toi gratuitement avec mon lien : ${data.referralUrl}\n\nÀ bientôt sur la plateforme !`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Programme de parrainage</h1>
        <p className="text-gray-500">Invitez vos proches et gagnez des points de fidélité</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Users, label: 'Filleuls invités', value: data?.totalRefs ?? 0, color: 'text-[#0B3D91] bg-blue-50' },
          { icon: Trophy, label: 'Filleuls actifs', value: data?.rewardedRefs ?? 0, color: 'text-green-600 bg-green-50' },
          { icon: Gift, label: 'Points gagnés', value: (data?.rewardedRefs ?? 0) * (data?.pointsPerReferral ?? 50), color: 'text-[#FFA500] bg-orange-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Lien de parrainage */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-[#0B3D91]" /> Votre lien de parrainage
        </h2>

        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <p className="text-xs text-gray-400 mb-1">Votre code personnel</p>
          <div className="flex items-center gap-3">
            <code className="text-2xl font-mono font-bold text-[#0B3D91] tracking-widest">{data?.code ?? '...'}</code>
            <button
              onClick={copyCode}
              className="text-xs flex items-center gap-1 text-gray-400 hover:text-[#0B3D91] transition-colors"
            >
              {copiedCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 mb-5">
          <span className="flex-1 text-sm text-gray-600 truncate font-mono">{data?.referralUrl ?? '...'}</span>
          <button
            onClick={copyUrl}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#0B3D91] px-3 py-2 rounded-lg hover:bg-blue-800 transition-colors flex-shrink-0"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            Copier
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={shareWhatsApp}
            className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold py-3 rounded-xl hover:bg-[#128C7E] transition-colors text-sm"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
            Partager WhatsApp
          </button>
          <button
            onClick={shareEmail}
            className="flex items-center justify-center gap-2 bg-gray-700 text-white font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors text-sm"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>
            Partager Email
          </button>
        </div>
      </div>

      {/* Liste des filleuls */}
      {data && data.referrals.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">Mes filleuls ({data.referrals.length})</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {data.referrals.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-6 py-3.5">
                <div className="w-8 h-8 rounded-full bg-[#0B3D91] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-400">
                    {r.country && `${r.country} · `}
                    Inscrit le {new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                  r.status === 'rewarded' ? 'bg-green-100 text-green-700' : 'bg-yellow-50 text-yellow-700'
                }`}>
                  {r.status === 'rewarded' ? `+${data.pointsPerReferral} pts` : 'En attente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comment ça marche */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">Comment ça marche ?</h2>
        <div className="space-y-4">
          {[
            { step: '1', title: 'Partagez votre lien', desc: 'Envoyez votre lien unique à vos amis, collègues et proches.' },
            { step: '2', title: "Vos filleuls s'inscrivent", desc: "Ils créent leur compte en utilisant votre lien de parrainage." },
            { step: '3', title: "Gagnez des points", desc: `Vous recevez ${data?.pointsPerReferral ?? 50} points de fidélité dès que votre filleul s'inscrit à une formation.` },
          ].map(s => (
            <div key={s.step} className="flex gap-4">
              <div className="w-8 h-8 rounded-full ibig-gradient flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {s.step}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
