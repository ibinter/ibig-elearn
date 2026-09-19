import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
import LessonsEditor from './LessonsEditor'

interface Props { params: Promise<{ id: string }> }

export default async function FormationLeconsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, instructor_id')
    .eq('id', id)
    .single()

  if (!course) notFound()

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isOwner = course.instructor_id === user.id
  const isAdmin = ['admin', 'coordinateur'].includes(profile?.role ?? '')
  if (!isOwner && !isAdmin) redirect('/formateur/formations')

  const { data: modules } = await supabase
    .from('modules')
    .select('*, lessons(id, title, type, video_url, content, duration_minutes, position, is_free_preview, is_published)')
    .eq('course_id', id)
    .order('position')

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/formateur/formations" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Formation</p>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#0B3D91]" /> {course.title}
          </h1>
        </div>
        <div className="ml-auto flex gap-2">
          <Link href={`/formateur/formations/${id}/modifier`}
            className="text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            Modifier la formation
          </Link>
          <Link href={`/formateur/formations/${id}/stats`}
            className="text-sm text-[#0B3D91] border border-[#0B3D91] px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
            Statistiques
          </Link>
        </div>
      </div>

      <LessonsEditor courseId={id} initialModules={modules ?? []} />
    </div>
  )
}
