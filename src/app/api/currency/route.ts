import { NextRequest, NextResponse } from 'next/server'
import { getCurrencyFromCountryCode } from '@/lib/currency'

export async function GET(req: NextRequest) {
  // Vercel injecte le pays via le header x-vercel-ip-country
  const country = req.headers.get('x-vercel-ip-country') ?? req.headers.get('cf-ipcountry')
  const currency = getCurrencyFromCountryCode(country)
  return NextResponse.json({ currency, country: country ?? 'unknown' })
}
