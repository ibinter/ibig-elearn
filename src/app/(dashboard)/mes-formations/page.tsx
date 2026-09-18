import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, Play, Clock, CheckCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function MesFormationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, course:courses(id, title, slug, thumbnail_url, duration_hours, instructor:profiles(full_name))')
    .eq('user_id', user!.id)
    .order('last_accessed_at', { ascending: false, nullsFirst: false })

  // Récupérer la dernière leçon en cours pour chaque formation
  const courseIds = enrollments?.map(e => e.course?.id).filter(Boolean) ?? []
  const { data: lastLessons } = courseIds.length
    ? await supabase
        .from('lesson_progress')
        .select('course_id, lesson_id, updated_at')
        .eq('user_id', user!.id)
        .in('course_id', courseIds)
        .eq('is_completed', false)
        .order('updated_at', { ascending: false })
    : { data: [] }

  const lastLessonByCourse: Record<string, string> = {}
  for (const lp of lastLessons ?? []) {
    if (!lastLessonByCourse[lp.course_id]) lastLessonByCourse[lp.course_id] = lp.lesson_id
  }

  const enriched = enrollments?.map(e => ({
    ...e,
    last_lesson_id: lastLessonByCourse[e.course?.id] ?? null,
  })) ?? []

  const active = enriched.filter(e => e.status === 'active')
  const completed = enriched.filter(e => e.status === 'completed')

  const CourseRow = ({ e }: { e: any }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col sm:flex-row">
      <div className="sm:w-36 aspect-video sm:aspect-auto bg-gray-100 flex-shrink-0">
        {e.course?.thumbnail_url ? (
          <img src={e.course.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full ibig-gradient flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-white/50" />
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1">{e.course?.title}</h3>
          <p className="text-xs text-gray-400 mb-2">par {e.course?.instructor?.full_name}</p>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-xs">
              <div className="h-1.5 rounded-full bg-[#0B3D91]" style={{ width: `${e.progress_percent}%` }} />
            </div>
            <span className="text-xs text-gray-500 font-medium">{e.progress_percent}%</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {e.course?.duration_hours}h</span>
            <span>Inscrit le {formatDate(e.enrolled_at)}</span>
          </div>
        </div>
        <div className="flex-shrink-0">
          {e.status === 'completed' ? (
            <span className="flex items-center gap-1.5 text-green-600 text-xs font-semibold bg-green-50 px-3 py-2 rounded-lg">
              <CheckCircle className="w-4 h-4" /> Terminé
            </span>
          ) : (
            <Link href={e.last_lesson_id
                ? `/cours/${e.course?.slug}/${e.last_lesson_id}`
                : `/formation/${e.course?.slug}`}
              className="flex items-center gap-1.5 ibig-gradient text-white text-xs font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
              <Play className="w-3.5 h-3.5" /> {e.progress_percent > 0 ? 'Reprendre' : 'Commencer'}
            </Link>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Mes formations</h1>
        <p className="text-gray-500">{enrollments?.length ?? 0} formation{(enrollments?.length ?? 0) > 1 ? 's' : ''}</p>
      </div>

      {active.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-gray-700 mb-4">En cours ({active.length})</h2>
          <div className="space-y-3">
            {active.map((e: any) => <CourseRow key={e.id} e={e} />)}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 mb-4">Terminées ({completed.length})</h2>
          <div className="space-y-3">
            {completed.map(e => <CourseRow key={e.id} e={e} />)}
          </div>
        </div>
      )}

      {(enrollments?.length ?? 0) === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <BookOpen className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h3 className="font-bold text-gray-900 mb-2">Vous n&apos;êtes inscrit à aucune formation</h3>
          <p className="text-gray-400 text-sm mb-6">Explorez notre catalogue et commencez votre apprentissage.</p>
          <Link href="/catalogue" className="ibig-gradient text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 inline-block">
            Découvrir les formations
          </Link>
        </div>
      )}
    </div>
  )
}
