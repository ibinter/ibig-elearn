// Notifie IBIG PARTNER d'une vente confirmée
export async function reportSaleToPartners(params: {
  partnerCode: string
  externalRef: string
  amount: number
  currency: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
}) {
  const apiKey = process.env.PARTNER_SALE_API_KEY
  const baseUrl = process.env.IBIG_PARTNERS_URL ?? 'https://ibigpartners.com'

  if (!apiKey) return

  try {
    await fetch(`${baseUrl}/api/partners/report-sale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-partner-api-key': apiKey,
      },
      body: JSON.stringify({
        partnerCode: params.partnerCode,
        productSlug: 'ibig-elearn',
        externalRef: params.externalRef,
        amount: params.amount,
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        customerPhone: params.customerPhone,
      }),
    })
  } catch (e) {
    console.error('[referral] report-sale error:', e)
  }
}
