import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Clock, Target, CheckCircle, Lock, ChevronRight, Star, Award, Play } from 'lucide-react'
import type { Metadata } from 'next'
import PriceDisplay from '@/components/ui/PriceDisplay'
import EnrollPathButton from './EnrollPathButton'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('learning_paths').select('title, short_description').eq('slug', slug).single()
  if (!data) return { title: 'Parcours introuvable' }
  return { title: `${data.title} — Parcours IBIG E-LEARN`, description: data.short_description ?? undefined }
}

const levelLabel: Record<string, string> = {
  debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé', tous_niveaux: 'Tous niveaux'
}

export default async function ParcoursDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: path } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!path) notFound()

  const { data: pathCourses } = await supabase
    .from('learning_path_courses')
    .select('*, course:courses(id, title, slug, short_description, thumbnail_url, price_xof, level, duration_hours, total_lessons, rating_avg, enrollment_count, instructor:profiles(full_name))')
    .eq('path_id', path.id)
    .order('position')

  const { data: { user } } = await supabase.auth.getUser()

  let enrolledCourseIds = new Set<string>()
  let pathEnrolled = false
  if (user) {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', user.id)
    enrolledCourseIds = new Set((enrollments ?? []).map(e => e.course_id))

    const { data: pe } = await supabase
      .from('learning_path_enrollments')
      .select('id')
      .eq('path_id', path.id)
      .eq('user_id', user.id)
      .single()
    pathEnrolled = !!pe
  }

  const courses = (pathCourses ?? []).map(pc => pc.course).filter(Boolean)
  const totalCourses = courses.length
  const completedCourses = courses.filter(c => c && enrolledCourseIds.has(c.id)).length
  const totalPrice = courses.reduce((s, c) => s + ((c as any)?.price_xof ?? 0), 0)
  const freeCount = courses.filter(c => (c as any)?.price_xof === 0).length

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/parcours" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0B3D91] mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Tous les parcours
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-8 mb-12">
        {/* Thumbnail */}
        {path.thumbnail_url && (
          <div className="lg:w-80 flex-shrink-0 rounded-2xl overflow-hidden aspect-video lg:aspect-auto">
            <img src={path.thumbnail_url} alt={path.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex-1">
          {path.is_featured && (
            <span className="inline-block bg-[#FFA500] text-black text-xs font-bold px-3 py-1 rounded-full mb-3">
              Recommandé par IBIG
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">{path.title}</h1>
          {path.short_description && (
            <p className="text-lg text-gray-600 mb-5 leading-relaxed">{path.short_description}</p>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
            <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
              <BookOpen className="w-4 h-4 text-[#0B3D91]" /> {totalCourses} formation{totalCourses > 1 ? 's' : ''}
            </span>
            {path.estimated_hours > 0 && (
              <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
                <Clock className="w-4 h-4 text-[#0B3D91]" /> {path.estimated_hours}h de contenu
              </span>
            )}
            <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
              <Target className="w-4 h-4 text-[#0B3D91]" /> {levelLabel[path.level ?? 'tous_niveaux']}
            </span>
            <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
              <Award className="w-4 h-4 text-[#0B3D91]" /> Certificat de parcours
            </span>
          </div>

          {/* Progress if enrolled */}
          {pathEnrolled && totalCourses > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#0B3D91]">Votre progression</span>
                <span className="text-sm font-bold text-[#0B3D91]">{completedCourses}/{totalCourses} formations</span>
              </div>
              <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full ibig-gradient rounded-full transition-all"
                  style={{ width: `${Math.round((completedCourses / totalCourses) * 100)}%` }} />
              </div>
              <p className="text-xs text-blue-600 mt-1.5">{Math.round((completedCourses / totalCourses) * 100)}% complété</p>
            </div>
          )}

          {/* CTA */}
          {!pathEnrolled ? (
            <div className="flex flex-col sm:flex-row gap-3 items-start flex-wrap">
              <Link href={courses[0] ? `/formation/${(courses[0] as any).slug}` : '/catalogue'}
                className="ibig-gradient text-white font-bold px-8 py-3.5 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2">
                <Play className="w-5 h-5" /> Commencer le parcours
              </Link>
              <EnrollPathButton pathId={path.id} pathSlug={path.slug} />
              <div className="text-sm text-gray-500 flex items-center gap-1 w-full sm:w-auto">
                {freeCount === totalCourses ? (
                  <span className="text-green-600 font-semibold">Entièrement gratuit</span>
                ) : (
                  <>
                    Prix total :{' '}
                    <span className="font-bold text-gray-900">{totalPrice.toLocaleString('fr')} XOF</span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <Link href={courses.find(c => c && !enrolledCourseIds.has((c as any).id))
              ? `/formation/${(courses.find(c => c && !enrolledCourseIds.has((c as any).id)) as any).slug}`
              : '/tableau-de-bord'}
              className="ibig-gradient text-white font-bold px-8 py-3.5 rounded-xl hover:opacity-90 transition-opacity inline-flex items-center gap-2">
              <Play className="w-5 h-5" /> Continuer le parcours
            </Link>
          )}
        </div>
      </div>

      {/* Description complète */}
      {path.description && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">À propos de ce parcours</h2>
          <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: path.description }} />
        </div>
      )}

      {/* Programme — liste des formations */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Programme du parcours</h2>
        <p className="text-gray-500 text-sm">Suivez les formations dans l'ordre pour une progression optimale.</p>

        {courses.map((course: any, i) => {
          const isEnrolled = enrolledCourseIds.has(course.id)
          const isNext = !isEnrolled && i === completedCourses

          return (
            <div key={course.id}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${isNext ? 'border-[#0B3D91]' : 'border-gray-100'}`}>
              <div className="flex gap-4 p-5">
                {/* Step indicator */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5 ${
                  isEnrolled ? 'bg-green-100 text-green-700' : isNext ? 'ibig-gradient text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {isEnrolled ? <CheckCircle className="w-5 h-5" /> : isNext ? (i + 1) : <Lock className="w-4 h-4" />}
                </div>

                {/* Course thumbnail */}
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {course.thumbnail_url
                    ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full ibig-gradient flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white/50" />
                      </div>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Étape {i + 1}</p>
                      <h3 className="font-bold text-gray-900 text-sm leading-snug">{course.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">par {course.instructor?.full_name}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {course.price_xof === 0 ? (
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Gratuit</span>
                      ) : (
                        <PriceDisplay price_xof={course.price_xof} className="text-sm font-bold text-[#0B3D91]" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    {course.rating_avg > 0 && (
                      <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {Number(course.rating_avg).toFixed(1)}</span>
                    )}
                    <span>{course.duration_hours}h</span>
                    <span>{course.total_lessons} leçons</span>
                    {isEnrolled && <span className="text-green-600 font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Complété</span>}
                    {isNext && <span className="text-[#0B3D91] font-semibold">Recommandé maintenant</span>}
                  </div>
                </div>

                {/* CTA */}
                <Link href={`/formation/${course.slug}`}
                  className={`flex-shrink-0 flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-colors self-center ${
                    isEnrolled
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : isNext
                      ? 'ibig-gradient text-white hover:opacity-90'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}>
                  {isEnrolled ? 'Reprendre' : 'Voir'} <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
