'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Zap } from 'lucide-react'

const MESSAGES = [
  { text: '🎓 Nouvelle formation disponible : IA & Automatisation des PME africaines', link: '/catalogue' },
  { text: '🌍 IBIG E-LEARNING — 14 pays d\'Afrique francophone', link: '/a-propos' },
  { text: '🏆 Rejoignez la communauté des professionnels certifiés IBIG !', link: '/inscription' },
  { text: '📱 Orange Money · MTN · Wave · Moov acceptés', link: '/catalogue' },
]

export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false)
  const [msgIndex, setMsgIndex] = useState(0)

  if (dismissed) return null

  return (
    <div className="bg-gradient-to-r from-[#0B3D91] via-[#1a56cc] to-[#0B3D91] text-white h-9 flex items-center w-full overflow-hidden">

      {/* MOBILE : message statique rotatif (pas d'animation CSS wide) */}
      <div className="flex sm:hidden flex-1 min-w-0 items-center px-3">
        <Zap className="w-3 h-3 text-[#FFA500] flex-shrink-0 mr-2" />
        <Link href={MESSAGES[msgIndex].link}
          onClick={() => setMsgIndex(i => (i + 1) % MESSAGES.length)}
          className="text-[12px] font-medium truncate hover:text-[#FFA500] transition-colors">
          {MESSAGES[msgIndex].text}
        </Link>
      </div>

      {/* DESKTOP : défilement CSS — isolé du layout grâce à overflow:hidden sur le parent */}
      <div className="hidden sm:flex flex-1 min-w-0 overflow-hidden relative h-full"
        style={{ contain: 'layout style' }}>
        <div
          className="absolute inset-0 flex items-center animate-announcement"
          style={{ width: 'max-content', willChange: 'transform' }}
        >
          {[...MESSAGES, ...MESSAGES, ...MESSAGES].map((msg, i) => (
            <Link key={i} href={msg.link}
              className="inline-flex items-center gap-2 pr-16 text-[13px] font-medium hover:text-[#FFA500] transition-colors flex-shrink-0 whitespace-nowrap">
              <Zap className="w-3.5 h-3.5 text-[#FFA500] flex-shrink-0" />
              {msg.text}
            </Link>
          ))}
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 px-3 h-full flex items-center text-white/70 hover:text-white transition-colors border-l border-white/20 bg-[#0B3D91]"
        title="Fermer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
