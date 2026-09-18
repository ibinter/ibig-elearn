import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import CourseEditor from '@/components/formateur/CourseEditor'

export default async function EditerFormationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['formateur', 'admin', 'coordinateur'].includes(profile?.role ?? '')) redirect('/tableau-de-bord')

  const { data: course } = await supabase
    .from('courses')
    .select('*, modules(id, title, position, lessons(id, title, type, video_url, content, position, is_free_preview))')
    .eq('slug', slug)
    .single()

  if (!course) notFound()
  if (course.instructor_id !== user.id && !['admin', 'coordinateur'].includes(profile?.role ?? ''))
    redirect('/formateur')

  const { data: categories } = await supabase.from('categories').select('id, name').order('name')

  // Trier modules et leçons par position
  const sortedCourse = {
    ...course,
    modules: (course.modules ?? [])
      .sort((a: any, b: any) => a.position - b.position)
      .map((m: any) => ({
        ...m,
        lessons: (m.lessons ?? []).sort((a: any, b: any) => a.position - b.position),
      })),
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Éditer — {course.title}</h1>
      <CourseEditor categories={categories ?? []} initialCourse={sortedCourse} />
    </div>
  )
}
