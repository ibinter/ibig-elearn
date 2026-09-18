import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-')
    + '-' + Math.random().toString(36).slice(2, 6)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['formateur', 'admin', 'coordinateur'].includes(profile?.role ?? ''))
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const body = await req.json()
  const { title, description, short_description, category_id, level, price_xof, thumbnail_url, objectives, requirements, tags } = body

  if (!title || !description) return NextResponse.json({ error: 'Titre et description requis' }, { status: 400 })

  const { data, error } = await supabase
    .from('courses')
    .insert({
      title,
      slug: slugify(title),
      description,
      short_description: short_description ?? '',
      category_id: category_id || null,
      level: level ?? 'debutant',
      price_xof: price_xof ?? 0,
      thumbnail_url: thumbnail_url || null,
      instructor_id: user.id,
      objectives: objectives ?? [],
      requirements: requirements ?? [],
      tags: tags ?? [],
      is_published: false,
    })
    .select('id, slug')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const { error } = await supabase
    .from('courses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('instructor_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
