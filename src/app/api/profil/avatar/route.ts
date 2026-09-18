import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

  if (file.size > 2 * 1024 * 1024)
    return NextResponse.json({ error: 'Fichier trop grand (max 2 Mo)' }, { status: 400 })

  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type))
    return NextResponse.json({ error: 'Format invalide (JPG, PNG, WebP ou GIF)' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/avatar.${ext}`

  const bytes = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`

  await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id)

  return NextResponse.json({ url: avatarUrl })
}
