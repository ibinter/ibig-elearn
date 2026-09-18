'use client'
import { useEffect, useState } from 'react'
import type { Currency } from '@/lib/currency'
import { formatPrice, getPriceForCurrency } from '@/lib/currency'

interface Props {
  price_xof: number
  price_eur?: number | null
  price_usd?: number | null
  className?: string
  showFree?: boolean
}

export default function PriceDisplay({ price_xof, price_eur, price_usd, className = '', showFree = true }: Props) {
  const [currency, setCurrency] = useState<Currency>('XOF')

  useEffect(() => {
    const stored = sessionStorage.getItem('ibig_currency') as Currency | null
    if (stored) { setCurrency(stored); return }
    fetch('/api/currency')
      .then(r => r.json())
      .then(d => {
        if (d.currency) {
          setCurrency(d.currency)
          sessionStorage.setItem('ibig_currency', d.currency)
        }
      })
      .catch(() => {})
  }, [])

  if (price_xof === 0) {
    return showFree ? <span className={className || 'text-green-600 font-bold'}>Gratuit</span> : null
  }

  const amount = getPriceForCurrency(price_xof, price_eur ?? null, price_usd ?? null, currency)
  return <span className={className}>{formatPrice(amount, currency)}</span>
}
