import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Star, Users, Clock, BookOpen, CheckCircle, Play, Award, ChevronDown } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { Course } from '@/types'
import EnrollButton from './EnrollButton'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('courses').select('title, short_description').eq('slug', slug).single()
  if (!data) return { title: 'Formation introuvable' }
  return { title: data.title, description: data.short_description }
}

export default async function FormationPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('*, instructor:profiles(id, full_name, bio, avatar_url), category:categories(name, slug)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!course) notFound()

  const { data: modules } = await supabase
    .from('modules')
    .select('*, lessons(id, title, type, video_duration_seconds, is_free_preview)')
    .eq('course_id', course.id)
    .order('position')

  const { data: { user } } = await supabase.auth.getUser()

  let isEnrolled = false
  if (user) {
    const { data: enroll } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .single()
    isEnrolled = !!enroll
  }

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, user:profiles(full_name)')
    .eq('course_id', course.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const c = course as Course
  const levelLabel: Record<string, string> = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' }
  const totalLessons = modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length ?? 0), 0) ?? 0

  return (
    <div>
      {/* Header bleu */}
      <div className="ibig-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 mb-4">
                <Link href={`/catalogue?categorie=${(c.category as any)?.slug}`}
                  className="text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors">
                  {(c.category as any)?.name}
                </Link>
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full">{levelLabel[c.level]}</span>
              </div>
              <h1 className="text-3xl font-bold mb-3">{c.title}</h1>
              <p className="text-blue-100 text-base leading-relaxed mb-5">{c.short_description}</p>
              <div className="flex flex-wrap gap-5 text-sm text-blue-100">
                <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-[#FFA500] fill-[#FFA500]" /> <strong className="text-white">{c.rating_average.toFixed(1)}</strong> ({c.rating_count} avis)</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> <strong className="text-white">{c.enrollment_count.toLocaleString('fr-FR')}</strong> apprenants</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> <strong className="text-white">{c.duration_hours}h</strong> de contenu</span>
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> <strong className="text-white">{totalLessons}</strong> leçons</span>
              </div>
              <div className="mt-4 text-sm text-blue-200">
                Formateur : <Link href="#formateur" className="text-white underline">{(c.instructor as any)?.full_name}</Link>
                {' · '} Mis à jour le {formatDate(c.updated_at)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Objectifs */}
            {c.objectives && c.objectives.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-900 text-lg mb-4">Ce que vous apprendrez</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {c.objectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{obj}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Programme */}
            {modules && modules.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-900 text-lg mb-1">Programme de la formation</h2>
                <p className="text-gray-400 text-sm mb-5">{modules.length} modules · {totalLessons} leçons</p>
                <div className="space-y-3">
                  {(modules as any[]).map(mod => (
                    <details key={mod.id} className="group border border-gray-100 rounded-xl overflow-hidden">
                      <summary className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <span className="font-semibold text-gray-900 text-sm">{mod.title}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">{mod.lessons?.length ?? 0} leçons</span>
                          <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
                        </div>
                      </summary>
                      <div className="divide-y divide-gray-50">
                        {(mod.lessons ?? []).map((lesson: any) => (
                          <div key={lesson.id} className="flex items-center gap-3 px-4 py-3">
                            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              {lesson.type === 'video' ? <Play className="w-3.5 h-3.5 text-gray-500" /> : <BookOpen className="w-3.5 h-3.5 text-gray-500" />}
                            </div>
                            <span className="text-sm text-gray-700 flex-1">{lesson.title}</span>
                            {lesson.is_free_preview && <span className="text-xs text-green-600 font-medium">Aperçu gratuit</span>}
                            {lesson.video_duration_seconds && (
                              <span className="text-xs text-gray-400">{Math.ceil(lesson.video_duration_seconds / 60)} min</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Formateur */}
            <div id="formateur" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-4">Votre formateur</h2>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-[#0B3D91] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {(c.instructor as any)?.full_name?.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{(c.instructor as any)?.full_name}</p>
                  {(c.instructor as any)?.bio && <p className="text-gray-500 text-sm mt-1">{(c.instructor as any).bio}</p>}
                </div>
              </div>
            </div>

            {/* Avis */}
            {reviews && reviews.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-900 text-lg mb-4">Avis des apprenants</h2>
                <div className="space-y-4">
                  {(reviews as any[]).map(rev => (
                    <div key={rev.id} className="border-b border-gray-50 pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-[#0B3D91] text-white flex items-center justify-center text-xs font-bold">
                          {rev.user?.full_name?.charAt(0)}
                        </div>
                        <span className="font-semibold text-sm text-gray-900">{rev.user?.full_name}</span>
                        <div className="flex gap-0.5 ml-auto">
                          {Array.from({length: 5}).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'text-[#FFA500] fill-[#FFA500]' : 'text-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                      {rev.comment && <p className="text-sm text-gray-600">{rev.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky card inscription */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {c.thumbnail_url && (
                  <div className="aspect-video bg-gray-100">
                    <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-bold text-[#0B3D91]">{formatPrice(c.price_xof)}</span>
                  </div>
                  {c.price_eur && <p className="text-sm text-gray-400 mb-4">≈ {formatPrice(c.price_eur, 'EUR')} · {formatPrice(c.price_usd ?? 0, 'USD')}</p>}

                  <EnrollButton courseId={c.id} courseSlug={c.slug} isEnrolled={isEnrolled} isFree={c.price_xof === 0} isLoggedIn={!!user} />

                  <div className="mt-5 space-y-2.5 text-sm text-gray-600">
                    {[
                      { icon: Clock, text: `${c.duration_hours} heures de contenu` },
                      { icon: BookOpen, text: `${totalLessons} leçons` },
                      { icon: Award, text: 'Certificat de réussite vérifiable' },
                      { icon: CheckCircle, text: 'Accès à vie au contenu' },
                    ].map(item => (
                      <div key={item.text} className="flex items-center gap-2.5">
                        <item.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        {item.text}
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-xs text-gray-400 mt-4">Satisfait ou remboursé — 7 jours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
