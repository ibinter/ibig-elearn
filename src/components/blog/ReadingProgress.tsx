'use client'

import { useEffect, useState } from 'react'

/** Fine barre de progression de lecture sous l'en-tête. */
export default function ReadingProgress() {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const el = document.getElementById('article-content')
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = el.offsetHeight - window.innerHeight * 0.6
      const done = Math.min(Math.max(-rect.top + window.innerHeight * 0.2, 0), Math.max(total, 1))
      setPct(Math.round((done / Math.max(total, 1)) * 100))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[3px] pointer-events-none" aria-hidden="true">
      <div className="h-full bg-[#FFA500] transition-[width] duration-150 ease-out" style={{ width: `${pct}%` }} />
    </div>
  )
}
