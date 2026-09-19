'use client'

import { useEffect, useState } from 'react'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'

interface Testimonial {
  id: string
  author_name: string
  author_role: string
  author_country?: string
  content: string
  rating: number
  initials?: string
  color?: string
  avatar_url?: string
}

interface Props {
  testimonials: Testimonial[]
}

export default function TestimonialsCarousel({ testimonials }: Props) {
  const [idx, setIdx] = useState(0)
  const [animating, setAnimating] = useState(false)

  const total = testimonials.length
  const visible = 3
  const pages = Math.ceil(total / visible)

  useEffect(() => {
    if (pages <= 1) return
    const timer = setInterval(() => go(1), 6000)
    return () => clearInterval(timer)
  }, [pages, idx])

  function go(dir: 1 | -1) {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      setIdx(i => (i + dir + pages) % pages)
      setAnimating(false)
    }, 300)
  }

  const start = idx * visible
  const slice = testimonials.slice(start, start + visible)

  return (
    <div className="relative">
      <div className={`grid sm:grid-cols-3 gap-6 transition-opacity duration-300 ${animating ? 'opacity-0' : 'opacity-100'}`}>
        {slice.map((t) => (
          <div key={t.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
            {/* Stars */}
            <div className="flex gap-0.5 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < t.rating ? 'text-[#FFA500] fill-[#FFA500]' : 'text-gray-200 fill-gray-200'}`} />
              ))}
            </div>
            <p className="text-gray-600 text-sm leading-relaxed flex-1 mb-5 italic">&ldquo;{t.content}&rdquo;</p>
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              {t.avatar_url ? (
                <img src={t.avatar_url} alt={t.author_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className={`w-10 h-10 rounded-full ${t.color ?? 'bg-[#0B3D91]'} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                  {t.initials || t.author_name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900 text-sm">{t.author_name}</p>
                <p className="text-gray-400 text-xs">{t.author_role}{t.author_country ? ` · ${t.author_country}` : ''}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button onClick={() => go(-1)}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-[#0B3D91] hover:text-white hover:border-[#0B3D91] transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-2">
            {Array.from({ length: pages }).map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`h-2 rounded-full transition-all ${i === idx ? 'bg-[#0B3D91] w-6' : 'bg-gray-200 w-2'}`} />
            ))}
          </div>
          <button onClick={() => go(1)}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-[#0B3D91] hover:text-white hover:border-[#0B3D91] transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
