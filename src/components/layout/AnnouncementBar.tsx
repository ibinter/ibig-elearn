'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Zap } from 'lucide-react'

const MESSAGES = [
  { text: '🎓 Nouvelle formation disponible : Intelligence Artificielle & Automatisation des PME africaines', link: '/catalogue' },
  { text: '🌍 IBIG E-LEARNING est maintenant disponible dans 12 pays d\'Afrique francophone', link: '/a-propos' },
  { text: '🏆 Rejoignez la communauté des professionnels certifiés IBIG E-LEARNING !', link: '/inscription' },
  { text: '📱 Mobile Money accepté : Orange Money, MTN, Wave, Moov — payez dans votre monnaie locale', link: '/catalogue' },
]

export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  // Duplicate for seamless loop
  const combined = [...MESSAGES, ...MESSAGES, ...MESSAGES]

  return (
    <div className="bg-gradient-to-r from-[#0B3D91] via-[#1a56cc] to-[#0B3D91] text-white h-9 flex items-center w-full"
      style={{ contain: 'layout style' }}>
      {/* Scrolling text — positioned container clips overflow without affecting page layout */}
      <div className="flex-1 min-w-0 overflow-hidden relative h-full">
        <div
          className="absolute inset-0 flex items-center animate-announcement"
          style={{ width: 'max-content', willChange: 'transform' }}
        >
          {combined.map((msg, i) => (
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
