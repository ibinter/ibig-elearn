import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

const BUNNY_API_KEY = process.env.BUNNY_STREAM_API_KEY
const LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID

// Génère un token d'upload signé (valide 1h) pour que le client uploade directement sur Bunny
// sans exposer la clé API principale.
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['formateur', 'coordinateur', 'admin'].includes(profile?.role ?? ''))
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  if (!BUNNY_API_KEY || !LIBRARY_ID)
    return NextResponse.json({ error: 'Bunny Stream non configuré' }, { status: 503 })

  const videoGuid = req.nextUrl.searchParams.get('guid')
  if (!videoGuid) return NextResponse.json({ error: 'GUID manquant' }, { status: 400 })

  const expirationTime = Math.floor(Date.now() / 1000) + 3600 // 1h
  const hashString = `${LIBRARY_ID}${BUNNY_API_KEY}${expirationTime}${videoGuid}`
  const authSignature = createHash('sha256').update(hashString).digest('hex')

  return NextResponse.json({
    uploadUrl: `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoGuid}`,
    authorizationSignature: authSignature,
    authorizationExpire: expirationTime,
    videoId: videoGuid,
    libraryId: LIBRARY_ID,
  })
}
