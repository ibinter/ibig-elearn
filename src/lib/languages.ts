/** Langues d'enseignement des formations (valeur stockée = code ISO). */
export const COURSE_LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'Anglais', flag: '🇬🇧' },
  { code: 'ar', label: 'Arabe', flag: '🇸🇦' },
  { code: 'pt', label: 'Portugais', flag: '🇵🇹' },
  { code: 'wo', label: 'Wolof', flag: '🇸🇳' },
  { code: 'dyu', label: 'Dioula', flag: '🇨🇮' },
] as const

const LEGACY: Record<string, string> = {
  français: 'fr', francais: 'fr', french: 'fr', anglais: 'en', english: 'en', arabe: 'ar', arabic: 'ar',
  portugais: 'pt', portuguese: 'pt', wolof: 'wo', dioula: 'dyu',
}

/** Normalise une valeur de langue (code ou ancien libellé) en code. */
export function languageCode(value: string | null | undefined): string {
  const v = (value ?? 'fr').trim().toLowerCase()
  return COURSE_LANGUAGES.some(l => l.code === v) ? v : LEGACY[v] ?? 'fr'
}

export function languageInfo(value: string | null | undefined) {
  const code = languageCode(value)
  return COURSE_LANGUAGES.find(l => l.code === code) ?? COURSE_LANGUAGES[0]
}
