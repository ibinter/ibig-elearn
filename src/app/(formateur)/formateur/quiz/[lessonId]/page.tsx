import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
import QuizEditor from './QuizEditor'

interface PageProps {
  params: Promise<{ lessonId: string }>
}

export default async function QuizEditorPage({ params }: PageProps) {
  const { lessonId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['formateur', 'admin', 'coordinateur'].includes(profile?.role ?? '')) redirect('/tableau-de-bord')

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title, quiz_passing_score, modules(course_id, courses(id, title, instructor_id))')
    .eq('id', lessonId)
    .single()

  if (!lesson) notFound()

  const course = (lesson.modules as any)?.courses
  if (!course) notFound()

  if (profile?.role === 'formateur' && course.instructor_id !== user.id) redirect('/formateur')

  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('position')

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/formateur" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Retour au dashboard
        </Link>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0B3D91]/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#0B3D91]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Éditeur de quiz</h1>
            <p className="text-gray-500 text-sm">{lesson.title} · {course.title}</p>
          </div>
        </div>
      </div>

      <QuizEditor
        lessonId={lessonId}
        courseId={course.id}
        initialQuestions={(questions ?? []) as any[]}
        initialPassingScore={lesson.quiz_passing_score ?? 70}
      />
    </div>
  )
}
