import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function staff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return ['admin', 'coordinateur'].includes(data?.role ?? '') ? user : null
}

/** Référentiel de compétences : création / modification / suppression (équipe IBIG). */
export async function POST(req: NextRequest) {
  if (!(await staff())) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const b = await req.json().catch(() => ({}))
  const admin = createAdminClient()

  if (b.action === 'delete') {
    await admin.from('skills').delete().eq('id', String(b.id))
    return NextResponse.json({ ok: true })
  }
  const name = String(b.name ?? '').trim().slice(0, 120)
  const category = String(b.category ?? '').trim().slice(0, 60) || null
  if (!name) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
  const { error } = b.id
    ? await admin.from('skills').update({ name, category }).eq('id', String(b.id))
    : await admin.from('skills').insert({ name, category })
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'Cette compétence existe déjà.' : error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
