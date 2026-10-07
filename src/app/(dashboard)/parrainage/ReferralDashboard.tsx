'use client'

import { useState } from 'react'
import { Gift, Copy, Check, Users, Star, TrendingUp, Share2 } from 'lucide-react'

interface Props {
  profile: { full_name: string; referral_code: string; xp_points: number }
  referrals: { id: string; status: string; converted_at: string | null; created_at: string; referred: { full_name: string; avatar_url: string | null; created_at: string } }[]
  stats: { total: number; converted: number; xpEarned: number }
  appUrl: string
}

export default function ReferralDashboard({ profile, referrals, stats, appUrl }: Props) {
  const [copied, setCopied] = useState(false)

  const referralLink = `${appUrl}/inscription?ref=${profile.referral_code}`

  const copy = async () => {
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const share = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Rejoins IBIG E-LEARN',
        text: `${profile.full_name} t'invite à rejoindre IBIG E-LEARN — la plateforme panafricaine de formation. Utilise mon lien pour t'inscrire et recevoir un bonus !`,
        url: referralLink,
      })
    } else {
      copy()
    }
  }

  const statusLabel: Record<string, { label: string; color: string }> = {
    pending:   { label: 'En attente',   color: 'bg-yellow-100 text-yellow-700' },
    converted: { label: 'Converti',     color: 'bg-blue-100 text-blue-700' },
    rewarded:  { label: '✓ Récompensé', color: 'bg-green-100 text-green-700' },
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-[#FFA500]/10 flex items-center justify-center">
          <Gift className="w-5 h-5 text-[#FFA500]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programme de parrainage</h1>
          <p className="text-sm text-gray-500">Invitez vos proches et gagnez des XP ensemble</p>
        </div>
      </div>

      {/* Comment ça marche */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Share2, step: '1', title: 'Partagez votre lien', desc: 'Envoyez votre lien unique à vos amis et collègues' },
          { icon: Users, step: '2', title: 'Ils s\'inscrivent', desc: 'Votre filleul reçoit +50 XP en s\'inscrivant avec votre code' },
          { icon: Star, step: '3', title: 'Ils achètent', desc: 'Au premier achat : +200 XP pour vous, +100 XP pour votre filleul' },
        ].map(s => (
          <div key={s.step} className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
            <div className="w-10 h-10 bg-[#0B3D91]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <s.icon className="w-5 h-5 text-[#0B3D91]" />
            </div>
            <div className="text-xs font-bold text-[#FFA500] mb-1">Étape {s.step}</div>
            <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
            <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Lien de parrainage */}
      <div className="bg-gradient-to-r from-[#0B3D91] to-[#1a5cbf] rounded-2xl p-6 text-white">
        <p className="text-blue-200 text-sm mb-2">Votre lien de parrainage</p>
        <div className="flex gap-2">
          <div className="flex-1 bg-white/10 rounded-xl px-4 py-3 font-mono text-sm truncate">
            {referralLink}
          </div>
          <button onClick={copy}
            className="flex-shrink-0 flex items-center gap-2 bg-white text-[#0B3D91] font-semibold text-sm px-4 py-3 rounded-xl hover:bg-blue-50 transition-colors">
            {copied ? <><Check className="w-4 h-4" /> Copié</> : <><Copy className="w-4 h-4" /> Copier</>}
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <span className="text-blue-200 text-sm">Code : </span>
          <span className="font-mono font-bold tracking-widest">{profile.referral_code}</span>
        </div>
        <button onClick={share}
          className="mt-4 flex items-center gap-2 bg-[#FFA500] hover:bg-[#e6940] text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors">
          <Share2 className="w-4 h-4" /> Partager via WhatsApp / SMS
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Filleuls invités', value: stats.total, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Achats validés', value: stats.converted, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
          { label: 'XP gagnés', value: `+${stats.xpEarned}`, icon: Star, color: 'text-[#FFA500] bg-yellow-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Liste filleuls */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Mes filleuls ({referrals.length})</h2>
        </div>
        {referrals.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Vous n'avez pas encore de filleuls</p>
            <p className="text-xs text-gray-400 mt-1">Partagez votre lien pour commencer</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {referrals.map(r => {
              const referred = r.referred as any
              const initials = (referred.full_name ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
              const s = statusLabel[r.status] ?? statusLabel.pending
              return (
                <div key={r.id} className="flex items-center gap-3 px-6 py-4">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0B3D91] to-[#FFA500] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {referred.avatar_url ? <img src={referred.avatar_url} className="w-full h-full rounded-full object-cover" alt="" /> : initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{referred.full_name}</p>
                    <p className="text-xs text-gray-400">Inscrit le {new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
