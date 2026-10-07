'use client'

import { useState } from 'react'
import { Link2, Check, Share2 } from 'lucide-react'

export default function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)

  const url = () => (typeof window !== 'undefined' ? window.location.href : '')

  async function nativeShare() {
    if (navigator.share) {
      try { await navigator.share({ title, url: url() }) } catch {}
    } else {
      copy()
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const btn = 'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition-colors'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(title)}`}
        onClick={e => { e.currentTarget.href = `https://wa.me/?text=${encodeURIComponent(`${title} ${url()}`)}` }}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btn} bg-[#25D366] text-white hover:bg-[#1fb857]`}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.9 9.9 0 0 0 12.04 2Zm5.8 14.13c-.24.68-1.42 1.3-1.95 1.35-.5.05-.97.23-3.27-.68-2.77-1.09-4.52-3.92-4.66-4.1-.13-.18-1.1-1.47-1.1-2.8 0-1.33.7-1.99.95-2.26.24-.27.53-.34.71-.34h.51c.16 0 .38-.06.6.46.24.55.8 1.89.87 2.03.07.14.11.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.35-.41.47-.14.14-.28.28-.12.55.16.27.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.2 1.36.27.14.43.12.59-.07.16-.18.68-.8.86-1.07.18-.27.36-.23.6-.14.25.09 1.58.75 1.85.88.27.14.45.2.52.32.07.11.07.66-.17 1.34Z"/></svg>
        WhatsApp
      </a>
      <button onClick={copy} className={`${btn} bg-gray-100 text-gray-700 hover:bg-gray-200`}>
        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4" />}
        {copied ? 'Lien copié' : 'Copier le lien'}
      </button>
      <button onClick={nativeShare} className={`${btn} bg-gray-100 text-gray-700 hover:bg-gray-200 sm:hidden`} aria-label="Partager">
        <Share2 className="w-4 h-4" />
      </button>
    </div>
  )
}
