'use client'

import { useLocale } from '@/i18n/client'
import type { Locale } from '@/i18n/index'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
      {(['fr', 'en'] as Locale[]).map(l => (
        <button
          key={l}
          onClick={() => { if (l !== locale) setLocale(l) }}
          className={`px-2 py-1 rounded-md text-xs font-semibold transition-all ${
            locale === l
              ? 'bg-white text-[#0B3D91] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {l === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN'}
        </button>
      ))}
    </div>
  )
}
