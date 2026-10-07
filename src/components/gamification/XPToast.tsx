'use client'

import { useEffect, useState } from 'react'
import { Zap, TrendingUp } from 'lucide-react'

interface XPToastProps {
  xp: number
  leveledUp?: boolean
  newLevel?: string
  streakBonus?: number
  onClose?: () => void
}

export default function XPToast({ xp, leveledUp, newLevel, streakBonus, onClose }: XPToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      onClose?.()
    }, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  if (!visible) return null

  return (
    <div className="fixed bottom-6 above-bottom-nav right-4 sm:right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <div className="flex items-center gap-3 bg-gray-900 border border-[#FFA500]/30 text-white px-4 py-3 rounded-2xl shadow-2xl animate-slide-up">
        <div className="w-9 h-9 rounded-xl bg-[#FFA500]/20 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-[#FFA500]" />
        </div>
        <div>
          <p className="font-bold text-sm">+{xp} XP</p>
          {streakBonus && streakBonus > 0 && (
            <p className="text-[10px] text-[#FFA500]">dont +{streakBonus} bonus streak 🔥</p>
          )}
        </div>
      </div>

      {leveledUp && newLevel && (
        <div className="flex items-center gap-3 bg-gradient-to-r from-[#0B3D91] to-purple-700 text-white px-4 py-3 rounded-2xl shadow-2xl animate-slide-up">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">Niveau supérieur !</p>
            <p className="text-blue-200 text-xs">{newLevel}</p>
          </div>
        </div>
      )}
    </div>
  )
}
