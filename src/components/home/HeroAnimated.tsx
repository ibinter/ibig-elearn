'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Play } from 'lucide-react'

const TICKERS = [
  { name: 'Aminata D.', country: '🇸🇳', action: 'vient de terminer', course: 'Management de Projet' },
  { name: 'Kofi A.', country: '🇨🇮', action: 'vient d\'obtenir son certificat', course: 'Comptabilité SYSCOHADA' },
  { name: 'Moussa T.', country: '🇲🇱', action: 'a commencé', course: 'Marketing Digital' },
  { name: 'Awa B.', country: '🇧🇫', action: 'vient de terminer', course: 'Leadership & Management' },
  { name: 'Jean-Paul N.', country: '🇨🇲', action: 'vient d\'obtenir son certificat', course: 'Fiscalité des Entreprises' },
  { name: 'Fatoumata K.', country: '🇬🇳', action: 'a commencé', course: 'Excel Avancé & Data' },
  { name: 'Ibrahim C.', country: '🇹🇬', action: 'vient de terminer', course: 'Gestion des Ressources Humaines' },
]

export function LiveTicker() {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % TICKERS.length)
        setVisible(true)
      }, 400)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const t = TICKERS[idx]
  return (
    <div className={`inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-2 text-sm text-white transition-opacity duration-400 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
      <span className="font-medium">{t.country} {t.name}</span>
      <span className="text-blue-200">{t.action}</span>
      <span className="font-semibold text-[#FFA500] hidden sm:inline truncate max-w-[160px]">{t.course}</span>
    </div>
  )
}

export function HeroCTA() {
  const [videoOpen, setVideoOpen] = useState(false)
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/catalogue"
          className="group flex items-center justify-center gap-2 bg-[#FFA500] hover:bg-orange-400 text-black font-bold px-8 py-4 rounded-2xl transition-all text-base shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105">
          Explorer le catalogue <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
        <button
          onClick={() => setVideoOpen(true)}
          className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-2xl transition-all text-base hover:scale-105">
          <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </span>
          Voir la démo
        </button>
      </div>

      {videoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setVideoOpen(false)}>
          <div className="w-full max-w-3xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
              className="w-full h-full"
              allow="autoplay; fullscreen"
              title="IBIG E-LEARN — Présentation"
            />
          </div>
          <button className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
            onClick={() => setVideoOpen(false)}>✕</button>
        </div>
      )}
    </>
  )
}
