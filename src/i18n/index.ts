import fr from './fr'
import en from './en'
import type { Translations } from './fr'
import { cookies } from 'next/headers'

export type Locale = 'fr' | 'en'
export type { Translations }

const dict: Record<Locale, Translations> = { fr, en }

export function getTranslations(locale: Locale): Translations {
  return dict[locale] ?? fr
}

// Server-side: read locale from cookie
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value
  return (locale === 'en' ? 'en' : 'fr') as Locale
}

// Server-side: get translations directly
export async function getT(): Promise<Translations> {
  const locale = await getLocale()
  return getTranslations(locale)
}
