'use client'

import { usePathname } from 'next/navigation'

// Photo de fond propre à chaque page d'authentification
const PHOTOS: Record<string, { desktop: string; mobile: string }> = {
  '/connexion': { desktop: '/images/bg/learner.webp', mobile: '/images/bg/learner-m.webp' },
  '/inscription': { desktop: '/images/bg/students.webp', mobile: '/images/bg/students-m.webp' },
}
const DEFAULT = { desktop: '/images/auth-bg.webp', mobile: '/images/auth-bg-mobile.webp' }

export default function AuthBackground() {
  const pathname = usePathname()
  const photo = PHOTOS[pathname] ?? DEFAULT
  return (
    <picture key={photo.desktop}>
      <source media="(max-width: 767px)" srcSet={photo.mobile} />
      <img src={photo.desktop} alt="" className="w-full h-full object-cover object-center scale-105" fetchPriority="high" />
    </picture>
  )
}
