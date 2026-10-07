import crypto from 'crypto'

/**
 * GeniusPay — fournisseur de paiement prioritaire par défaut d'IBIG E-LEARNING
 * (Wave, Orange Money, MTN, Moov, cartes — page de paiement unifiée).
 */

type Checkout = {
  amountXof: number
  description: string
  customer: { name?: string | null; email?: string | null; phone?: string | null; country?: string | null }
  successUrl: string
  errorUrl: string
  metadata: Record<string, string>
}

export async function createGeniusPayCheckout(c: Checkout): Promise<{ ok: true; checkoutUrl: string; reference: string } | { ok: false; error: string }> {
  const res = await fetch('https://geniuspay.ci/api/v1/merchant/payments', {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.GENIUSPAY_API_KEY ?? '',
      'X-API-Secret': process.env.GENIUSPAY_API_SECRET ?? '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(c.amountXof),
      currency: 'XOF',
      description: c.description.slice(0, 120),
      customer: {
        name: c.customer.name ?? undefined,
        email: c.customer.email ?? undefined,
        phone: c.customer.phone ?? undefined,
        country: c.customer.country ?? 'CI',
      },
      success_url: c.successUrl,
      error_url: c.errorUrl,
      metadata: c.metadata,
    }),
  })
  const data = await res.json().catch(() => null) as { success?: boolean; data?: { checkout_url?: string; reference?: string }; error?: { message?: string } } | null
  if (!data?.success || !data.data?.checkout_url) return { ok: false, error: data?.error?.message ?? 'Réponse GeniusPay invalide' }
  return { ok: true, checkoutUrl: data.data.checkout_url, reference: data.data.reference ?? '' }
}

/**
 * Vérification de la signature d'un webhook GeniusPay :
 * HMAC-SHA256(timestamp + "." + corps brut, secret), anti-rejeu 5 minutes.
 * Refuse tout si le secret n'est pas configuré (jamais d'acceptation « par défaut »).
 */
export function verifyGeniusPaySignature(rawBody: string, signature: string, timestamp: string): { ok: boolean; reason?: string } {
  const secret = process.env.GENIUSPAY_WEBHOOK_SECRET
  if (!secret) return { ok: false, reason: 'GENIUSPAY_WEBHOOK_SECRET non configuré' }
  if (!signature || !timestamp) return { ok: false, reason: 'Signature absente' }
  const ts = Number.parseInt(timestamp, 10)
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return { ok: false, reason: 'Horodatage expiré' }
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return { ok: a.length === b.length && crypto.timingSafeEqual(a, b) }
}
