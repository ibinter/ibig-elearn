import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BUNNY_API_KEY = process.env.BUNNY_STREAM_API_KEY
const LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['formateur', 'coordinateur', 'admin'].includes(profile?.role ?? ''))
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  if (!BUNNY_API_KEY || !LIBRARY_ID)
    return NextResponse.json({ error: 'Bunny Stream non configuré' }, { status: 503 })

  const { title } = await req.json()

  // 1. Créer le video entry dans la librairie Bunny
  const createRes = await fetch(`https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`, {
    method: 'POST',
    headers: {
      AccessKey: BUNNY_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: title ?? 'Nouvelle vidéo' }),
  })

  if (!createRes.ok) {
    const err = await createRes.text()
    console.error('[bunny] create video error:', err)
    return NextResponse.json({ error: 'Erreur Bunny Stream' }, { status: 502 })
  }

  const video = await createRes.json()

  // 2. Retourner le GUID + l'URL d'upload + l'URL embed
  return NextResponse.json({
    videoGuid: video.guid,
    libraryId: LIBRARY_ID,
    uploadUrl: `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${video.guid}`,
    embedUrl: `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${video.guid}`,
    // Format court pour stocker en DB
    videoUrl: `bunny:${LIBRARY_ID}/${video.guid}`,
  })
}
