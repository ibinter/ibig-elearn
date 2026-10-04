import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AssignmentGrader from './AssignmentGrader'
import Link from 'next/link'
import { ArrowLeft, ClipboardCheck } from 'lucide-react'

interface PageProps {
  params: Promise<{ courseId: string }>
  searchParams: Promise<{ status?: string }>
}

export default async function DeviorsFormateur({ params, searchParams }: PageProps) {
  const { courseId } = await params
  const { status = 'submitted' } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // Vérifier que c'est bien le formateur de ce cours
  const { data: course } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .eq('instructor_id', user.id)
    .single()
  if (!course) redirect('/formateur/dashboard')

  // Charger les soumissions avec les infos apprenant
  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select(`
      *,
      profiles:user_id (full_name, avatar_url, email),
      assignments:assignment_id (title, instructions, max_score, passing_score),
      lessons:lesson_id (title)
    `)
    .eq('course_id', courseId)
    .eq('status', status)
    .order('submitted_at', { ascending: false })

  const counts = await Promise.all(
    ['submitted','reviewing','graded','rejected'].map(async s => {
      const { count } = await supabase
        .from('assignment_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', courseId)
        .eq('status', s)
      return { status: s, count: count ?? 0 }
    })
  )

  const tabs = [
    { key: 'submitted', label: 'À corriger', color: 'text-yellow-400' },
    { key: 'reviewing', label: 'En révision', color: 'text-blue-400' },
    { key: 'graded',    label: 'Notés', color: 'text-green-400' },
    { key: 'rejected',  label: 'À refaire', color: 'text-red-400' },
  ]

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/formateur/dashboard" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-[#FFA500]" />
              <h1 className="text-white font-bold text-xl">Correction des devoirs</h1>
            </div>
            <p className="text-gray-400 text-sm mt-0.5">{course.title}</p>
          </div>
        </div>

        {/* Tabs statut */}
        <div className="flex gap-1 mb-6 bg-gray-900 rounded-xl p-1">
          {tabs.map(tab => {
            const c = counts.find(x => x.status === tab.key)
            return (
              <Link
                key={tab.key}
                href={`?status=${tab.key}`}
                className={`flex-1 text-center py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors ${
                  status === tab.key
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.label}
                {(c?.count ?? 0) > 0 && (
                  <span className={`ml-1.5 text-xs font-bold ${tab.color}`}>
                    {c?.count}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Liste des soumissions */}
        {!submissions?.length ? (
          <div className="text-center py-20 text-gray-500">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun devoir dans cette catégorie</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub: any) => (
              <AssignmentGrader
                key={sub.id}
                submission={sub}
                courseId={courseId}
                graderId={user.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
