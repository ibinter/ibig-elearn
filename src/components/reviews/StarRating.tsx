'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface Props {
  value: number
  onChange?: (v: number) => void
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
}

const sizes = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-7 h-7' }

export default function StarRating({ value, onChange, size = 'md', readonly = false }: Props) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value
  const star = (n: number) => (
    <Star aria-hidden="true" className={`${sizes[size]} transition-colors ${n <= active ? 'fill-[#FFA500] text-[#FFA500]' : 'fill-transparent text-gray-300'}`} />
  )

  // Affichage seul : une image annoncée « 4 sur 5 étoiles » (et non 5 boutons inactifs)
  if (readonly) {
    return (
      <div className="flex items-center gap-0.5" role="img" aria-label={`${Math.round(value * 10) / 10} sur 5 étoiles`}>
        {[1, 2, 3, 4, 5].map(n => <span key={n}>{star(n)}</span>)}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Note">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} étoile${n > 1 ? 's' : ''} sur 5`}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="cursor-pointer hover:scale-110 transition-transform"
        >
          {star(n)}
        </button>
      ))}
    </div>
  )
}
