'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { formatPrice } from './utils'

export type Currency =
  | 'XOF' | 'XAF' | 'GNF' | 'CDF' | 'MAD' | 'DZD' | 'TND'
  | 'NGN' | 'GHS' | 'KES' | 'ZAR' | 'EGP' | 'ETB' | 'RWF' | 'MGA' | 'MUR'
  | 'EUR' | 'USD'

// Units of target currency per 1 XOF (approx rates Sept 2026)
const RATES: Record<Currency, number> = {
  XOF: 1,
  XAF: 1,          // même zone FCFA, parité 1:1
  GNF: 13.5,       // Franc guinéen
  CDF: 3.6,        // Franc congolais (RDC)
  MAD: 0.0163,     // Dirham marocain  (1 MAD ≈ 61 XOF)
  DZD: 0.178,      // Dinar algérien   (1 DZD ≈ 5.6 XOF)
  TND: 0.0042,     // Dinar tunisien   (1 TND ≈ 238 XOF)
  NGN: 2.62,       // Naira nigérian   (1 USD ≈ 1600 NGN)
  GHS: 0.026,      // Cedi ghanéen     (1 GHS ≈ 38 XOF)
  KES: 0.21,       // Shilling kényan  (1 KES ≈ 4.8 XOF)
  ZAR: 0.030,      // Rand sud-africain(1 ZAR ≈ 33 XOF)
  EGP: 0.083,      // Livre égyptienne (1 EGP ≈ 12 XOF)
  ETB: 0.094,      // Birr éthiopien   (1 ETB ≈ 10.6 XOF)
  RWF: 1.83,       // Franc rwandais   (1 RWF ≈ 0.55 XOF)
  MGA: 5.9,        // Ariary malgache  (1 MGA ≈ 0.17 XOF)
  MUR: 0.073,      // Roupie mauricienne(1 MUR ≈ 13.7 XOF)
  EUR: 0.001525,   // Taux fixe officiel FCFA
  USD: 0.001639,   // Taux approx
}

interface CurrencyContextType {
  currency: Currency
  setCurrency: (c: Currency) => void
  displayPrice: (course: { price_xof: number; price_eur?: number | null; price_usd?: number | null }) => string
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'XOF',
  setCurrency: () => {},
  displayPrice: (c) => formatPrice(c.price_xof, 'XOF'),
})

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('XOF')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ibig_currency') as Currency
      if (saved && saved in RATES) setCurrencyState(saved)
    } catch {}
  }, [])

  const setCurrency = (c: Currency) => {
    setCurrencyState(c)
    try { localStorage.setItem('ibig_currency', c) } catch {}
  }

  const displayPrice = (course: { price_xof: number; price_eur?: number | null; price_usd?: number | null }) => {
    // Use stored values for EUR/USD (more accurate)
    if (currency === 'EUR' && course.price_eur) return formatPrice(course.price_eur, 'EUR')
    if (currency === 'USD' && course.price_usd) return formatPrice(course.price_usd, 'USD')
    // Compute dynamically for all other currencies
    const converted = Math.round(course.price_xof * RATES[currency])
    return formatPrice(converted, currency)
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, displayPrice }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)
