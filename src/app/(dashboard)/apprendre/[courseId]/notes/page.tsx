import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import NotesPrintView from './NotesPrintView'

export default async function NotesPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()
  if (!enrollment) redirect(`/formation`)

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, thumbnail_url, profiles!courses_instructor_id_fkey(full_name)')
    .eq('id', courseId)
    .single()
  if (!course) notFound()

  // Toutes les notes non vides, avec info module + leçon
  const { data: notes } = await supabase
    .from('lesson_notes')
    .select(`
      content, updated_at,
      lesson:lessons(
        id, title, type, position,
        module:modules(id, title, position)
      )
    `)
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .neq('content', '')
    .order('updated_at', { ascending: true })

  // Regrouper par module
  const byModule: Record<string, { moduleTitle: string; modulePos: number; lessons: { title: string; content: string; updatedAt: string }[] }> = {}

  for (const note of (notes ?? [])) {
    const lesson = note.lesson as any
    const mod = lesson?.module
    if (!mod) continue
    const key = mod.id
    if (!byModule[key]) {
      byModule[key] = { moduleTitle: mod.title, modulePos: mod.position, lessons: [] }
    }
    byModule[key].lessons.push({
      title: lesson.title,
      content: note.content,
      updatedAt: note.updated_at,
    })
  }

  const modules = Object.values(byModule).sort((a, b) => a.modulePos - b.modulePos)

  return (
    <NotesPrintView
      courseTitle={(course as any).title}
      instructorName={(course as any).profiles?.full_name ?? ''}
      thumbnailUrl={(course as any).thumbnail_url}
      modules={modules}
      noteCount={notes?.length ?? 0}
      courseId={courseId}
    />
  )
}
