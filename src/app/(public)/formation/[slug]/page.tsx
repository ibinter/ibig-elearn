import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Star, Users, Clock, BookOpen, CheckCircle, Play, Award, ChevronDown, Lock } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { Course } from '@/types'
import EnrollButton from './EnrollButton'
import PriceDisplay from '@/components/ui/PriceDisplay'
import ReviewsList from '@/components/reviews/ReviewsList'
import ReviewForm from '@/components/reviews/ReviewForm'
import StarRating from '@/components/reviews/StarRating'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('title, short_description, thumbnail_url, instructor:profiles(full_name), category:categories(name)')
    .eq('slug', slug)
    .single()
  if (!data) return { title: 'Formation introuvable' }

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ibig-elearning.com'
  const url = `${BASE_URL}/formation/${slug}`
  const description = data.short_description ?? `Formation professionnelle certifiante en ${(data.category as any)?.name ?? 'développement professionnel'} — IBIG E-LEARNING`

  return {
    title: data.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: data.title,
      description,
      url,
      type: 'article',
      siteName: 'IBIG E-LEARNING',
      locale: 'fr_FR',
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description,
    },
  }
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

  let myReview = null
  if (user && isEnrolled) {
    const { data } = await supabase.from('reviews').select('rating, comment').eq('user_id', user.id).eq('course_id', course.id).single()
    myReview = data
  }

  const c = course as Course
  const levelLabel: Record<string, string> = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' }
  const totalLessons = modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length ?? 0), 0) ?? 0

  const allLessons = modules?.flatMap((m: any) => m.lessons ?? []) ?? []
  const lessonTypes = [...new Set(allLessons.map((l: any) => l.type).filter(Boolean))]
  const formatLabels: Record<string, { label: string; icon: string }> = {
    video:  { label: 'Vidéo',    icon: '🎬' },
    audio:  { label: 'Audio',    icon: '🎧' },
    text:   { label: 'Texte',    icon: '📄' },
    texte:  { label: 'Texte',    icon: '📄' },
    quiz:   { label: 'Quiz',     icon: '📝' },
    pdf:    { label: 'PDF',      icon: '📑' },
    live:   { label: 'Live',     icon: '📡' },
  }

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ibig-elearning.com'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: c.title,
    description: c.short_description ?? c.title,
    url: `${BASE_URL}/formation/${c.slug}`,
    image: c.thumbnail_url ?? `${BASE_URL}/og-default.png`,
    provider: {
      '@type': 'Organization',
      name: 'IBIG E-LEARNING',
      sameAs: BASE_URL,
    },
    instructor: {
      '@type': 'Person',
      name: (c.instructor as any)?.full_name ?? 'IBIG Expert',
    },
    courseMode: 'online',
    educationalLevel: levelLabel[c.level] ?? c.level,
    inLanguage: c.language ?? 'fr',
    offers: c.price_xof > 0 ? {
      '@type': 'Offer',
      price: c.price_xof,
      priceCurrency: 'XOF',
      availability: 'https://schema.org/InStock',
      url: `${BASE_URL}/formation/${c.slug}`,
    } : {
      '@type': 'Offer',
      price: 0,
      priceCurrency: 'XOF',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: c.rating_count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: c.rating_average,
      reviewCount: c.rating_count,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  }

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Header bleu */}
      <div className="ibig-gradient text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            <Link href={`/catalogue?categorie=${(c.category as any)?.slug}`}
              className="text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors">
              {(c.category as any)?.name}
            </Link>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full">{levelLabel[c.level]}</span>
          </div>
          <h1 className="text-3xl font-bold mb-3">{c.title}</h1>
          <p className="text-blue-100 text-base leading-relaxed mb-5">{c.short_description}</p>
          <div className="flex flex-wrap gap-5 text-sm text-blue-100 justify-center">
            <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-[#FFA500] fill-[#FFA500]" /> <strong className="text-white">{c.rating_average.toFixed(1)}</strong> ({c.rating_count} avis)</span>
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> <strong className="text-white">{c.enrollment_count.toLocaleString('fr-FR')}</strong> apprenants</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> <strong className="text-white">{c.duration_hours}h</strong> de contenu</span>
            <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> <strong className="text-white">{totalLessons}</strong> leçons</span>
          </div>
          {lessonTypes.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mt-5">
              {lessonTypes.map((type: any) => {
                const fmt = formatLabels[type] ?? { label: type, icon: '📁' }
                return (
                  <span key={type} className="inline-flex items-center gap-1.5 text-xs bg-white/15 border border-white/20 px-3 py-1 rounded-full">
                    {fmt.icon} {fmt.label}
                  </span>
                )
              })}
            </div>
          )}
          <div className="mt-4 text-sm text-blue-200">
            Formateur : <Link href={`/formateur/${(c.instructor as any)?.id}`} className="text-white underline">{(c.instructor as any)?.full_name}</Link>
            {' · '} Mis à jour le {formatDate(c.updated_at)}
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

            {/* Description complète */}
            {c.description && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-900 text-lg mb-4">Description de la formation</h2>
                <div className="prose prose-sm prose-gray max-w-none text-gray-700 whitespace-pre-line">
                  {c.description}
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
                        {(mod.lessons ?? []).slice().sort((a: any, b: any) => a.position - b.position).map((lesson: any) => {
                          const isLocked = !isEnrolled && !lesson.is_free_preview
                          return (
                          <div key={lesson.id} className={`flex items-center gap-3 px-4 py-3 ${isLocked ? 'opacity-50' : ''}`}>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-gray-100">
                              {isLocked
                                ? <Lock className="w-3.5 h-3.5 text-gray-400" />
                                : lesson.type === 'video'
                                  ? <Play className="w-3.5 h-3.5 text-gray-500" />
                                  : <BookOpen className="w-3.5 h-3.5 text-gray-500" />
                              }
                            </div>
                            <span className={`text-sm flex-1 ${isLocked ? 'text-gray-400' : 'text-gray-700'}`}>{lesson.title}</span>
                            {lesson.is_free_preview && !isEnrolled && (
                              <span className="text-xs text-green-600 font-medium">Aperçu gratuit</span>
                            )}
                            {lesson.video_duration_seconds && !isLocked && (
                              <span className="text-xs text-gray-400">{Math.ceil(lesson.video_duration_seconds / 60)} min</span>
                            )}
                          </div>
                          )
                        })}
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
                <div className="w-14 h-14 rounded-full bg-[#0B3D91] flex items-center justify-center text-white text-xl font-bold flex-shrink-0 overflow-hidden">
                  {(c.instructor as any)?.avatar_url
                    ? <img src={(c.instructor as any).avatar_url} alt="" className="w-full h-full object-cover" />
                    : (c.instructor as any)?.full_name?.charAt(0)
                  }
                </div>
                <div>
                  <Link href={`/formateur/${(c.instructor as any)?.id}`} className="font-bold text-gray-900 hover:text-[#0B3D91] transition-colors">{(c.instructor as any)?.full_name}</Link>
                  {(c.instructor as any)?.bio && <p className="text-gray-500 text-sm mt-1">{(c.instructor as any).bio}</p>}
                </div>
              </div>
            </div>

            {/* Avis apprenants */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-gray-900 text-lg">Avis des apprenants</h2>
                {(c as any).rating_avg > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRating value={Math.round((c as any).rating_avg)} readonly size="sm" />
                    <span className="text-sm font-bold text-gray-900">{Number((c as any).rating_avg).toFixed(1)}</span>
                    <span className="text-sm text-gray-400">({(c as any).review_count ?? 0} avis)</span>
                  </div>
                )}
              </div>

              {/* Formulaire si inscrit */}
              {isEnrolled && (
                <div className="mb-8 p-5 bg-gray-50 rounded-xl border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    {myReview ? 'Modifier votre avis' : 'Donnez votre avis'}
                  </h3>
                  <ReviewForm courseId={course.id} existingReview={myReview ?? undefined} />
                </div>
              )}

              <ReviewsList courseId={course.id} ratingAvg={(c as any).rating_avg ?? 0} reviewCount={(c as any).review_count ?? 0} />
            </div>
          </div>

          {/* Sticky card inscription */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {c.thumbnail_url && (
                  <div className="aspect-video bg-gray-100">
                    <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-baseline gap-2 mb-4">
                    <PriceDisplay price_xof={c.price_xof} price_eur={c.price_eur} price_usd={c.price_usd} className="text-3xl font-bold text-[#0B3D91]" />
                  </div>

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
