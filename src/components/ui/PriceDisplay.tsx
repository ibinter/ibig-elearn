'use client'
import { useCurrency } from '@/lib/currency-context'

interface Props {
  price_xof: number
  price_eur?: number | null
  price_usd?: number | null
  className?: string
  showFree?: boolean
}

export default function PriceDisplay({ price_xof, price_eur, price_usd, className = '', showFree = true }: Props) {
  const { displayPrice } = useCurrency()

  if (price_xof === 0) {
    return showFree ? <span className={className || 'text-green-600 font-bold'}>Gratuit</span> : null
  }

  return <span className={className}>{displayPrice({ price_xof, price_eur, price_usd })}</span>
}
