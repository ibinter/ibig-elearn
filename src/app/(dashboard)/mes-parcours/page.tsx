import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Target, BookOpen, ChevronRight, CheckCircle, Clock, Award } from 'lucide-react'

export default async function MesParcoursPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: enrollments } = await supabase
    .from('learning_path_enrollments')
    .select('*, path:learning_paths(id, title, slug, short_description, thumbnail_url, level, estimated_hours)')
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false })

  // Get enrolled courses for progress calculation
  const { data: courseEnrollments } = await supabase
    .from('enrollments')
    .select('course_id, progress_percent, is_completed')
    .eq('user_id', user.id)

  const enrolledSet = new Set((courseEnrollments ?? []).filter(e => e.is_completed).map(e => e.course_id))

  // For each path, get course count
  const pathIds = (enrollments ?? []).map(e => (e.path as any)?.id).filter(Boolean)
  let pathCourseCounts: Record<string, { total: number; completed: number }> = {}
  if (pathIds.length > 0) {
    const { data: pathCourses } = await supabase
      .from('learning_path_courses')
      .select('path_id, course_id')
      .in('path_id', pathIds)

    for (const pc of pathCourses ?? []) {
      if (!pathCourseCounts[pc.path_id]) pathCourseCounts[pc.path_id] = { total: 0, completed: 0 }
      pathCourseCounts[pc.path_id].total++
      if (enrolledSet.has(pc.course_id)) pathCourseCounts[pc.path_id].completed++
    }
  }

  const levelLabel: Record<string, string> = {
    debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé', tous_niveaux: 'Tous niveaux'
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-[#0B3D91]" /> Mes parcours
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{enrollments?.length ?? 0} parcours suivi{(enrollments?.length ?? 0) > 1 ? 's' : ''}</p>
        </div>
        <Link href="/parcours"
          className="text-sm text-[#0B3D91] font-semibold hover:underline flex items-center gap-1">
          Explorer les parcours <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {!enrollments || enrollments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 ibig-gradient rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Aucun parcours en cours</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Les parcours guidés vous permettent de progresser étape par étape vers l'expertise dans un domaine.
          </p>
          <Link href="/parcours"
            className="inline-flex items-center gap-2 ibig-gradient text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm">
            Découvrir les parcours <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {enrollments.map(enrollment => {
            const path = enrollment.path as any
            if (!path) return null
            const counts = pathCourseCounts[path.id] ?? { total: 0, completed: 0 }
            const progress = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0
            const isCompleted = counts.total > 0 && counts.completed >= counts.total

            return (
              <Link key={enrollment.id} href={`/parcours/${path.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex gap-4 p-5">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {path.thumbnail_url
                    ? <img src={path.thumbnail_url} alt={path.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full ibig-gradient flex items-center justify-center">
                        <Target className="w-7 h-7 text-white/60" />
                      </div>
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-[#0B3D91] transition-colors">{path.title}</h3>
                    {isCompleted && (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full flex-shrink-0">
                        <CheckCircle className="w-3 h-3" /> Terminé
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 mb-3">
                    <span><BookOpen className="w-3 h-3 inline mr-0.5" /> {counts.total} formations</span>
                    {path.estimated_hours > 0 && <span><Clock className="w-3 h-3 inline mr-0.5" /> {path.estimated_hours}h</span>}
                    <span>{levelLabel[path.level] ?? path.level}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">{counts.completed}/{counts.total} formations complétées</span>
                      <span className={`font-semibold ${isCompleted ? 'text-green-600' : 'text-[#0B3D91]'}`}>{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${isCompleted ? 'bg-green-500' : 'ibig-gradient'}`}
                        style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#0B3D91] flex-shrink-0 self-center transition-colors" />
              </Link>
            )
          })}
        </div>
      )}

      {/* CTA if some parcours completed */}
      {enrollments && enrollments.some(e => {
        const path = e.path as any
        const counts = pathCourseCounts[path?.id] ?? { total: 0, completed: 0 }
        return counts.total > 0 && counts.completed >= counts.total
      }) && (
        <div className="bg-gradient-to-r from-[#0B3D91] to-[#1a56c7] rounded-2xl p-6 text-white flex items-center gap-5">
          <Award className="w-12 h-12 text-[#FFA500] flex-shrink-0" />
          <div>
            <h3 className="font-bold text-lg mb-1">Félicitations !</h3>
            <p className="text-blue-100 text-sm">Vous avez complété un parcours. Votre certificat de parcours a été généré.</p>
          </div>
          <Link href="/mes-certificats" className="ml-auto bg-[#FFA500] text-black font-bold px-4 py-2 rounded-xl hover:bg-yellow-400 transition-colors text-sm flex-shrink-0">
            Voir mes certificats
          </Link>
        </div>
      )}
    </div>
  )
}
