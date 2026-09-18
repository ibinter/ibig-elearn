'use client'
import { useState } from 'react'
import { Tag, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface CouponResult {
  valid: boolean; couponId: string; discount: number; finalAmount: number; message: string; discountType: string; discountValue: number
}

interface Props {
  courseId: string
  amount: number
  onApply: (result: CouponResult | null) => void
}

export default function CouponInput({ courseId, amount, onApply }: Props) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CouponResult | null>(null)
  const [error, setError] = useState('')

  async function validate() {
    if (!code.trim()) return
    setLoading(true); setError(''); setResult(null)
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim(), courseId, amount }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok && data.valid) { setResult(data); onApply(data) }
    else { setError(data.error ?? 'Code invalide'); onApply(null) }
  }

  function remove() { setResult(null); setCode(''); setError(''); onApply(null) }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && validate()}
            placeholder="Code promo"
            disabled={!!result}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91] disabled:bg-gray-50 font-mono"
          />
        </div>
        {result
          ? <button onClick={remove} className="px-4 py-2.5 border border-red-200 text-red-500 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors">Retirer</button>
          : <button onClick={validate} disabled={loading || !code.trim()}
              className="px-4 py-2.5 bg-[#0B3D91] text-white text-sm font-medium rounded-xl hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Appliquer
            </button>}
      </div>
      {result && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-xl">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{result.message} — Nouveau total : <strong>{result.finalAmount.toLocaleString()} FCFA</strong></span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">
          <XCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}
    </div>
  )
}
