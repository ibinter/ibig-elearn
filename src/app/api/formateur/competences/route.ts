import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canManageCourse } from '@/lib/scorm'

/** Remplace les compétences développées par une formation. */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const b = await req.json().catch(() => ({}))
  const courseId = String(b.courseId ?? '')
  const admin = createAdminClient()
  if (!courseId || !(await canManageCourse(admin, user.id, courseId))) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const items = ((b.skills ?? []) as { skillId: string; level: number }[])
    .filter(s => s && s.skillId).slice(0, 12)
    .map(s => ({ course_id: courseId, skill_id: String(s.skillId), level: Math.min(3, Math.max(1, Number(s.level) || 2)) }))

  await admin.from('course_skills').delete().eq('course_id', courseId)
  if (items.length) {
    const { error } = await admin.from('course_skills').insert(items)
    if (error) return NextResponse.json({ error: 'Compétence inconnue' }, { status: 400 })
  }
  return NextResponse.json({ ok: true, count: items.length })
}
