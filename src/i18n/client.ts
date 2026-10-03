'use client'

import { useState, useEffect } from 'react'
import fr from './fr'
import en from './en'
import type { Translations, Locale } from './index'

export function useLocale(): { locale: Locale; t: Translations; setLocale: (l: Locale) => void } {
  const [locale, setLocaleState] = useState<Locale>('fr')

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/)
    if (match?.[1] === 'en') setLocaleState('en')
  }, [])

  function setLocale(l: Locale) {
    document.cookie = `locale=${l};path=/;max-age=31536000;samesite=lax`
    setLocaleState(l)
    window.location.reload()
  }

  const t = locale === 'en' ? en : fr
  return { locale, t, setLocale }
}
