import { languageInfo } from '@/lib/languages'

type Props = { language: string | null | undefined; variant?: 'light' | 'dark' | 'overlay'; className?: string }

/** Langue d'enseignement d'une formation (drapeau + libellé), traduite automatiquement en anglais. */
export default function CourseLanguageBadge({ language, variant = 'light', className = '' }: Props) {
  const l = languageInfo(language)
  const styles = {
    light: 'bg-gray-100 text-gray-700 border-gray-200',
    dark: 'bg-white/10 text-white/90 border-white/20',
    overlay: 'bg-white/95 text-gray-800 border-white shadow-sm',
  }[variant]
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${styles} ${className}`}
      title={`Formation dispensée en ${l.label.toLowerCase()}`}>
      <span aria-hidden="true">{l.flag}</span>
      {l.label}
    </span>
  )
}
