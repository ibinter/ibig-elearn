'use client'

import { Crown, TrendingUp, TrendingDown, Minus, Trophy, Flame, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const DIVISION_CONFIG: Record<string, { emoji: string; color: string; bg: string; border: string; next?: string; prev?: string }> = {
  Bronze:  { emoji: '🥉', color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-300', next: 'Argent' },
  Argent:  { emoji: '🥈', color: 'text-gray-500',   bg: 'bg-gray-50',    border: 'border-gray-300',  next: 'Or',      prev: 'Bronze' },
  Or:      { emoji: '🥇', color: 'text-yellow-600', bg: 'bg-yellow-50',  border: 'border-yellow-400',next: 'Diamant', prev: 'Argent' },
  Diamant: { emoji: '💎', color: 'text-blue-500',   bg: 'bg-blue-50',    border: 'border-blue-400',  next: 'Élite',   prev: 'Or' },
  Élite:   { emoji: '👑', color: 'text-purple-600', bg: 'bg-purple-50',  border: 'border-purple-400',prev: 'Diamant' },
}

interface Participant {
  id: string
  xp_gained: number
  rank: number | null
  profiles: {
    id: string
    full_name: string
    avatar_url: string | null
    xp_level: string
    league_division: string
  }
}

interface Props {
  currentUserId: string
  division: string
  weekStart: string
  weekEnd: string
  participants: Participant[]
  league: { id: string; division: string; week_start: string; week_end: string } | null
}

function daysLeft(weekEnd: string) {
  const end = new Date(weekEnd)
  const now = new Date()
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function LeagueBoard({
  currentUserId, division, weekStart, weekEnd, participants, league
}: Props) {
  const cfg = DIVISION_CONFIG[division] ?? DIVISION_CONFIG['Bronze']
  const total = participants.length
  const myPos = participants.findIndex(p => p.profiles.id === currentUserId)
  const days = daysLeft(weekEnd)

  const PROMOTE_N = 5
  const RELEGATE_N = 5

  return (
    <div className="space-y-6">
      {/* En-tête division */}
      <div className={cn('rounded-2xl border-2 p-6', cfg.bg, cfg.border)}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">Votre ligue</p>
            <h1 className={cn('text-3xl font-black', cfg.color)}>
              {cfg.emoji} Division {division}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {formatDate(weekStart)} — {formatDate(weekEnd)} · {days} jour{days !== 1 ? 's' : ''} restant{days !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Participants</p>
            <p className="text-2xl font-bold text-gray-800">{total}/30</p>
          </div>
        </div>

        {/* Règles */}
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          {cfg.next && (
            <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
              <TrendingUp className="w-3 h-3" />
              Top {PROMOTE_N} → {cfg.next}
            </div>
          )}
          {cfg.prev && total >= 10 && (
            <div className="flex items-center gap-1 bg-red-100 text-red-600 px-2.5 py-1 rounded-full font-medium">
              <TrendingDown className="w-3 h-3" />
              Bottom {RELEGATE_N} → {cfg.prev}
            </div>
          )}
          <div className="flex items-center gap-1 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
            <Info className="w-3 h-3" />
            XP gagné cette semaine compte
          </div>
        </div>
      </div>

      {/* Classement */}
      {!league ? (
        <div className="text-center py-12 text-gray-400">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Ligue en cours de création…</p>
          <p className="text-sm mt-1">Revenez dans quelques instants.</p>
        </div>
      ) : participants.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Flame className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Soyez le premier à gagner des XP !</p>
        </div>
      ) : (
        <div className="space-y-2">
          {participants.map((p, i) => {
            const isMe = p.profiles.id === currentUserId
            const pos = i + 1
            const isPromo = pos <= PROMOTE_N && cfg.next
            const isRel = pos > total - RELEGATE_N && cfg.prev && total >= 10
            const initials = (p.profiles.full_name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

            return (
              <div
                key={p.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
                  isMe
                    ? 'bg-[#0B3D91]/10 border-[#0B3D91]/40 shadow-sm'
                    : 'bg-white border-gray-100 hover:border-gray-200',
                  isPromo && !isMe && 'border-l-4 border-l-green-400',
                  isRel && !isMe && 'border-l-4 border-l-red-400',
                  isMe && isPromo && 'border-l-4 border-l-green-500',
                  isMe && isRel && 'border-l-4 border-l-red-500',
                )}
              >
                {/* Rang */}
                <div className={cn(
                  'w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full text-sm font-bold',
                  pos === 1 ? 'bg-yellow-400 text-black' :
                  pos === 2 ? 'bg-gray-300 text-gray-700' :
                  pos === 3 ? 'bg-amber-600 text-white' :
                  'bg-gray-100 text-gray-500'
                )}>
                  {pos === 1 ? <Crown className="w-4 h-4" /> : pos}
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 flex-shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-[#0B3D91] to-[#FFA500] flex items-center justify-center text-white text-xs font-bold">
                  {p.profiles.avatar_url
                    ? <img src={p.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    : initials
                  }
                </div>

                {/* Nom + niveau */}
                <div className="flex-1 min-w-0">
                  <p className={cn('font-semibold text-sm truncate', isMe && 'text-[#0B3D91]')}>
                    {p.profiles.full_name ?? 'Apprenant'}
                    {isMe && <span className="ml-1.5 text-xs font-normal text-[#0B3D91]/70">(vous)</span>}
                  </p>
                  <p className="text-xs text-gray-400">{p.profiles.xp_level}</p>
                </div>

                {/* XP semaine */}
                <div className="text-right flex-shrink-0">
                  <p className={cn('font-bold text-sm', isMe ? 'text-[#0B3D91]' : 'text-gray-800')}>
                    +{p.xp_gained.toLocaleString('fr-FR')} XP
                  </p>
                  {isPromo && (
                    <div className="flex items-center justify-end gap-0.5 text-[10px] text-green-600 font-semibold mt-0.5">
                      <TrendingUp className="w-2.5 h-2.5" /> Promotion
                    </div>
                  )}
                  {isRel && !isPromo && (
                    <div className="flex items-center justify-end gap-0.5 text-[10px] text-red-500 font-semibold mt-0.5">
                      <TrendingDown className="w-2.5 h-2.5" /> Relégation
                    </div>
                  )}
                  {!isPromo && !isRel && (
                    <div className="flex items-center justify-end gap-0.5 text-[10px] text-gray-400 mt-0.5">
                      <Minus className="w-2.5 h-2.5" /> Maintien
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Ma position si pas dans le top visible */}
      {myPos > 9 && (
        <div className="text-center text-sm text-gray-500 py-2">
          Vous êtes {myPos + 1}e sur {total}
        </div>
      )}
    </div>
  )
}
