import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { toolKey } from '@/lib/lti'

/** Clés publiques de l'outil (JWKS), déclarées dans la plateforme LTI. */
export async function GET() {
  const key = await toolKey(createAdminClient())
  return NextResponse.json({ keys: [key.public_jwk] }, { headers: { 'Cache-Control': 'public, max-age=3600' } })
}
