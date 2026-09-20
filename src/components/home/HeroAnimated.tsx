'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Play, X } from 'lucide-react'

const TICKERS = [
  { name: 'Aminata D.', country: '🇸🇳', action: 'vient de terminer', course: 'Management de Projet' },
  { name: 'Kofi A.', country: '🇨🇮', action: 'a obtenu son certificat', course: 'Comptabilité SYSCOHADA' },
  { name: 'Moussa T.', country: '🇲🇱', action: 'a commencé', course: 'Marketing Digital' },
  { name: 'Awa B.', country: '🇧🇫', action: 'a terminé', course: 'Leadership & Management' },
  { name: 'Jean-Paul N.', country: '🇨🇲', action: 'a obtenu son certificat', course: 'Fiscalité des Entreprises' },
  { name: 'Fatoumata K.', country: '🇬🇳', action: 'a commencé', course: 'Excel Avancé & Data' },
  { name: 'Ibrahim C.', country: '🇹🇬', action: 'a terminé', course: 'Gestion RH' },
  { name: 'Mariam O.', country: '🇸🇳', action: 'a obtenu son certificat', course: 'Gestion de Projet PMO' },
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
      }, 500)
    }, 4500)
    return () => clearInterval(interval)
  }, [])

  const t = TICKERS[idx]
  return (
    <div className={`inline-flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm text-white transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)' }}>
      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
      <span className="font-semibold text-white/90">{t.country} {t.name}</span>
      <span className="text-blue-300/70">{t.action}</span>
      <span className="font-bold text-[#FFA500] hidden sm:inline truncate max-w-[180px]">{t.course}</span>
    </div>
  )
}

export function HeroCTA() {
  const [videoOpen, setVideoOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/catalogue"
          className="group relative flex items-center justify-center gap-2.5 font-black text-black px-8 py-4 rounded-2xl transition-all text-base hover:scale-105 overflow-hidden"
          style={{ background: 'linear-gradient(90deg, #FFA500, #FFD700)', boxShadow: '0 10px 30px rgba(255,165,0,0.35)' }}>
          <span className="relative z-10 flex items-center gap-2.5">
            Explorer le catalogue
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
          {/* Shimmer on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', backgroundSize: '200% 100%' }} />
        </Link>

        <button
          onClick={() => setVideoOpen(true)}
          className="flex items-center justify-center gap-3 font-semibold text-white px-8 py-4 rounded-2xl transition-all text-base hover:scale-105"
          style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </span>
          Voir la démo
        </button>
      </div>

      {/* Video modal */}
      {videoOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setVideoOpen(false)}
        >
          <div className="relative w-full max-w-3xl" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setVideoOpen(false)}
              className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors flex items-center gap-2 text-sm">
              <X className="w-5 h-5" /> Fermer
            </button>
            <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                className="w-full h-full"
                allow="autoplay; fullscreen"
                title="IBIG E-LEARN — Présentation"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
