/**
 * Vérification serveur d'une transaction CinetPay.
 * Le webhook ne doit JAMAIS se fier au corps de la notification : il interroge l'API CinetPay
 * pour connaître le statut réel et le montant effectivement payé.
 */
export type CinetPayCheck = { accepted: boolean; amount: number | null; currency: string | null; raw: unknown }

export async function checkCinetPayTransaction(transactionId: string): Promise<CinetPayCheck> {
  const res = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: transactionId,
    }),
    cache: 'no-store',
  })
  const json = await res.json().catch(() => null) as { code?: string; data?: { status?: string; amount?: string | number; currency?: string } } | null
  const status = json?.data?.status
  return {
    accepted: json?.code === '00' && status === 'ACCEPTED',
    amount: json?.data?.amount != null ? Number(json.data.amount) : null,
    currency: json?.data?.currency ?? null,
    raw: json,
  }
}
