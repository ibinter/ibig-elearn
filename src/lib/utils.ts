import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number, currency: string = 'XOF'): string {
  const locales: Record<string, string> = {
    XOF: 'fr-CI', XAF: 'fr-CM', EUR: 'fr-FR', USD: 'en-US',
    CAD: 'fr-CA', MAD: 'fr-MA', GNF: 'fr-GN', CDF: 'fr-CD',
    DZD: 'fr-DZ', TND: 'fr-TN', NGN: 'en-NG', GHS: 'en-GH',
    KES: 'sw-KE', ZAR: 'en-ZA', EGP: 'ar-EG', ETB: 'am-ET',
    RWF: 'rw-RW', MGA: 'mg-MG', MUR: 'en-MU', SLL: 'en-SL',
  }
  const noDecimals = ['XOF','XAF','GNF','CDF','RWF','UGX','TZS','KES','NGN','ETB','SLL','MGA']
  return new Intl.NumberFormat(locales[currency] ?? 'fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: noDecimals.includes(currency) ? 0 : 2,
  }).format(amount)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function generateVerificationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'IBIG-'
  for (let i = 0; i < 12; i++) {
    if (i === 4 || i === 8) code += '-'
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`
  if (hours === 1) return '1 heure'
  return `${hours} heures`
}

export function formatDate(dateStr: string, locale = 'fr-FR'): string {
  return new Date(dateStr).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
