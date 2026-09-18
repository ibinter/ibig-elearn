// Pays utilisant le FCFA (XOF/XAF)
const FCFA_COUNTRIES = new Set([
  'CI', 'SN', 'ML', 'BF', 'GN', 'NE', 'TG', 'BJ', // XOF
  'CM', 'CF', 'CG', 'GA', 'GQ', 'TD', // XAF
  'CD', 'MR', 'MG', 'KM', 'GW', 'CV', 'ST', // autres Afrique subsaharienne
  'GH', 'NG', 'SL', 'LR', 'GM', // Anglophone WAfrica → on affiche quand même XOF
])

const EUR_COUNTRIES = new Set([
  'FR', 'BE', 'CH', 'LU', 'MC', 'MA', 'TN', 'DZ', // Francophonie Europe/Maghreb
])

export type Currency = 'XOF' | 'EUR' | 'USD'

export function getCurrencyFromCountryCode(cc: string | null | undefined): Currency {
  if (!cc) return 'XOF'
  const upper = cc.toUpperCase()
  if (FCFA_COUNTRIES.has(upper)) return 'XOF'
  if (EUR_COUNTRIES.has(upper)) return 'EUR'
  return 'USD'
}

export function formatPrice(amount: number, currency: Currency): string {
  if (currency === 'XOF') return `${amount.toLocaleString('fr-FR')} FCFA`
  if (currency === 'EUR') return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function getPriceForCurrency(
  price_xof: number,
  price_eur: number | null,
  price_usd: number | null,
  currency: Currency
): number {
  if (currency === 'EUR') return price_eur ?? Math.round(price_xof / 655)
  if (currency === 'USD') return price_usd ?? Math.round(price_xof / 600)
  return price_xof
}
