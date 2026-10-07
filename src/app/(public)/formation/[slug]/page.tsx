import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Star, Users, Clock, BookOpen, CheckCircle, Play, Award, ChevronDown, Lock, Globe, Zap, Shield, TrendingUp, FileText, Headphones, Video, Code, ClipboardList } from 'lucide-react'
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
  const levelColor: Record<string, string> = {
    debutant: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    intermediaire: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    avance: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  }
  const totalLessons = modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length ?? 0), 0) ?? 0

  const allLessons = modules?.flatMap((m: any) => m.lessons ?? []) ?? []
  const lessonTypes = [...new Set(allLessons.map((l: any) => l.type).filter(Boolean))]
  const formatLabels: Record<string, { label: string; icon: string }> = {
    video:      { label: 'Vidéo',    icon: '🎬' },
    audio:      { label: 'Audio',    icon: '🎧' },
    text:       { label: 'Texte',    icon: '📄' },
    texte:      { label: 'Texte',    icon: '📄' },
    quiz:       { label: 'Quiz',     icon: '📝' },
    pdf:        { label: 'PDF',      icon: '📑' },
    live:       { label: 'Live',     icon: '📡' },
    document:   { label: 'Document', icon: '📄' },
    image:      { label: 'Image',    icon: '🖼️' },
    assignment: { label: 'Devoir',   icon: '✏️' },
    final_exam: { label: 'Examen',   icon: '🏆' },
    code:       { label: 'Code',     icon: '💻' },
  }

  const lessonIcon = (type: string) => {
    switch (type) {
      case 'video':      return <Video className="w-3.5 h-3.5" />
      case 'audio':      return <Headphones className="w-3.5 h-3.5" />
      case 'quiz':       return <ClipboardList className="w-3.5 h-3.5" />
      case 'assignment': return <FileText className="w-3.5 h-3.5" />
      case 'final_exam': return <Award className="w-3.5 h-3.5" />
      case 'code':       return <Code className="w-3.5 h-3.5" />
      default:           return <BookOpen className="w-3.5 h-3.5" />
    }
  }

  const lessonIconColor = (type: string) => {
    switch (type) {
      case 'video':      return 'bg-blue-100 text-blue-600'
      case 'audio':      return 'bg-purple-100 text-purple-600'
      case 'quiz':       return 'bg-amber-100 text-amber-600'
      case 'assignment': return 'bg-green-100 text-green-600'
      case 'final_exam': return 'bg-rose-100 text-rose-600'
      case 'code':       return 'bg-slate-100 text-slate-600'
      default:           return 'bg-gray-100 text-gray-500'
    }
  }

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ibig-elearning.com'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: c.title,
    description: c.short_description ?? c.title,
    url: `${BASE_URL}/formation/${c.slug}`,
    image: c.thumbnail_url ?? `${BASE_URL}/og-default.png`,
    provider: { '@type': 'Organization', name: 'IBIG E-LEARNING', sameAs: BASE_URL },
    instructor: { '@type': 'Person', name: (c.instructor as any)?.full_name ?? 'IBIG Expert' },
    courseMode: 'online',
    educationalLevel: levelLabel[c.level] ?? c.level,
    inLanguage: c.language ?? 'fr',
    offers: c.price_xof > 0
      ? { '@type': 'Offer', price: c.price_xof, priceCurrency: 'XOF', availability: 'https://schema.org/InStock', url: `${BASE_URL}/formation/${c.slug}` }
      : { '@type': 'Offer', price: 0, priceCurrency: 'XOF', availability: 'https://schema.org/InStock' },
    aggregateRating: c.rating_count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: c.rating_average,
      reviewCount: c.rating_count,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ═══════════════════════════════════════════
          HERO — gradient profond avec thumbnail
      ═══════════════════════════════════════════ */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0B1E4B 0%, #0B3D91 50%, #1565C0 100%)' }}>
        {/* Motif décoratif */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
        <div className="hidden sm:block absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="hidden sm:block absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
            {/* Texte gauche */}
            <div className="lg:col-span-2">
              {/* Breadcrumbs */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <Link href="/catalogue" className="text-blue-300 hover:text-white text-xs transition-colors">Catalogue</Link>
                {(c.category as any)?.name && (<>
                <span className="text-blue-400/60">›</span>
                <Link href={`/catalogue?categorie=${(c.category as any)?.slug}`}
                  className="text-blue-300 hover:text-white text-xs transition-colors">
                  {(c.category as any)?.name}
                </Link>
                </>)}
                <span className="text-blue-400/60">›</span>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${levelColor[c.level] ?? 'bg-white/10 text-white/70 border-white/20'}`}>
                  {levelLabel[c.level]}
                </span>
              </div>

              {/* Titre */}
              <h1 className="text-[26px] sm:text-3xl lg:text-4xl break-words font-extrabold text-white leading-tight mb-4 tracking-tight">
                {c.title}
              </h1>

              {/* Sous-titre */}
              {c.short_description && (
                <p className="text-blue-100/90 text-base lg:text-lg leading-relaxed mb-6 max-w-xl">
                  {c.short_description}
                </p>
              )}

              {/* Étoiles + stats inline */}
              <div className="flex flex-wrap gap-x-6 gap-y-3 mb-6">
                {c.rating_average > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-400 text-lg">{c.rating_average.toFixed(1)}</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-4 h-4 ${s <= Math.round(c.rating_average) ? 'text-amber-400 fill-amber-400' : 'text-amber-400/30'}`} />
                      ))}
                    </div>
                    <span className="text-blue-200 text-sm">({c.rating_count} avis)</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-blue-200 text-sm">
                  <Users className="w-4 h-4 text-blue-300" />
                  <strong className="text-white">{c.enrollment_count.toLocaleString('fr-FR')}</strong> apprenants
                </div>
                <div className="flex items-center gap-1.5 text-blue-200 text-sm">
                  <Clock className="w-4 h-4 text-blue-300" />
                  <strong className="text-white">{c.duration_hours}h</strong> de contenu
                </div>
                <div className="flex items-center gap-1.5 text-blue-200 text-sm">
                  <BookOpen className="w-4 h-4 text-blue-300" />
                  <strong className="text-white">{totalLessons}</strong> leçons
                </div>
              </div>

              {/* Formats */}
              {lessonTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {lessonTypes.map((type: any) => {
                    const fmt = formatLabels[type] ?? { label: type, icon: '📁' }
                    return (
                      <span key={type} className="inline-flex items-center gap-1.5 text-xs bg-white/10 border border-white/20 text-white/80 px-3 py-1.5 rounded-full backdrop-blur-sm">
                        {fmt.icon} {fmt.label}
                      </span>
                    )
                  })}
                </div>
              )}

              {/* Formateur + date */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
                  {(c.instructor as any)?.avatar_url
                    ? <img src={(c.instructor as any).avatar_url} alt="" className="w-full h-full object-cover" />
                    : (c.instructor as any)?.full_name?.charAt(0)
                  }
                </div>
                <div className="text-sm text-blue-200">
                  Par <Link href={`/formateur/${(c.instructor as any)?.id}`} className="text-white font-semibold hover:text-amber-300 transition-colors">{(c.instructor as any)?.full_name}</Link>
                  <span className="mx-2 text-blue-400">·</span>
                  Mis à jour le {formatDate(c.updated_at)}
                  <span className="mx-2 text-blue-400">·</span>
                  <Globe className="w-3.5 h-3.5 inline mr-1" />Français
                </div>
              </div>
            </div>

            {/* Thumbnail droite (desktop) */}
            {c.thumbnail_url && (
              <div className="hidden lg:block lg:col-span-1">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                  <img src={c.thumbnail_url} alt={c.title} className="w-full aspect-video object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          BODY — grille 2/3 + 1/3
      ═══════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ── COLONNE PRINCIPALE ── */}
          <div className="lg:col-span-2 space-y-7">

            {/* Ce que vous apprendrez */}
            {c.objectives && c.objectives.length > 0 && (
              <div className="rounded-2xl overflow-hidden border border-emerald-100 shadow-sm">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-4 sm:px-6 py-4 border-b border-emerald-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="font-bold text-gray-900 text-lg">Ce que vous apprendrez</h2>
                  </div>
                </div>
                <div className="bg-white px-4 sm:px-6 py-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {c.objectives.map((obj, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-emerald-50/50 transition-colors">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle className="w-3.5 h-3.5 text-white fill-white" />
                        </div>
                        <span className="text-sm text-gray-700 leading-snug">{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {c.description && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/70">
                  <h2 className="font-bold text-gray-900 text-lg">Description de la formation</h2>
                </div>
                <div className="px-4 sm:px-6 py-5">
                  <div className="prose prose-sm prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                    {c.description}
                  </div>
                </div>
              </div>
            )}

            {/* Programme */}
            {modules && modules.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/70">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-bold text-gray-900 text-lg">Programme de la formation</h2>
                    <div className="flex gap-2">
                      <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full border border-blue-100">{modules.length} modules</span>
                      <span className="text-xs bg-purple-50 text-purple-700 font-semibold px-2.5 py-1 rounded-full border border-purple-100">{totalLessons} leçons</span>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {(modules as any[]).map((mod, modIndex) => (
                    <details key={mod.id} className="group">
                      <summary className="flex items-center justify-between gap-2 px-4 sm:px-6 py-4 cursor-pointer hover:bg-gray-50/80 transition-colors list-none select-none">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-lg bg-[#0B3D91]/10 text-[#0B3D91] flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {modIndex + 1}
                          </div>
                          <span className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{mod.title}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                          <span className="text-xs text-gray-400 hidden sm:block">{mod.lessons?.length ?? 0} leçon{(mod.lessons?.length ?? 0) > 1 ? 's' : ''}</span>
                          <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform duration-200" />
                        </div>
                      </summary>
                      <div className="bg-gray-50/40 border-t border-gray-100">
                        {(mod.lessons ?? []).slice().sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)).map((lesson: any, li: number) => {
                          const isLocked = !isEnrolled && !lesson.is_free_preview
                          const isFreePreview = lesson.is_free_preview && !isEnrolled
                          const href = isEnrolled
                            ? `/apprendre/${course.id}/${lesson.id}`
                            : isFreePreview ? `/apprendre/${course.id}/${lesson.id}` : null
                          const Wrapper = href ? Link : 'div' as any
                          return (
                            <Wrapper key={lesson.id} href={href ?? undefined} className={`flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-gray-100/70 last:border-0 ${isLocked ? 'opacity-60 cursor-default' : 'hover:bg-white/60 cursor-pointer'} transition-colors`}>
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isLocked ? 'bg-gray-100 text-gray-400' : lessonIconColor(lesson.type)}`}>
                                {isLocked ? <Lock className="w-3.5 h-3.5" /> : lessonIcon(lesson.type)}
                              </div>
                              <span className={`text-sm flex-1 min-w-0 leading-snug ${isLocked ? 'text-gray-400' : 'text-gray-700'}`}>{lesson.title}</span>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {isFreePreview && (
                                  <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                                    <Play className="w-2.5 h-2.5" /> <span className="hidden sm:inline">Aperçu gratuit</span><span className="sm:hidden">Aperçu</span>
                                  </span>
                                )}
                                {lesson.video_duration_seconds && !isLocked && (
                                  <span className="text-xs text-gray-400">{Math.ceil(lesson.video_duration_seconds / 60)} min</span>
                                )}
                              </div>
                            </Wrapper>
                          )
                        })}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Formateur */}
            <div id="formateur" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/70">
                <h2 className="font-bold text-gray-900 text-lg">Votre formateur</h2>
              </div>
              <div className="px-4 sm:px-6 py-5">
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0B3D91] to-[#1565C0] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 overflow-hidden shadow-lg">
                    {(c.instructor as any)?.avatar_url
                      ? <img src={(c.instructor as any).avatar_url} alt="" className="w-full h-full object-cover" />
                      : (c.instructor as any)?.full_name?.charAt(0)
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/formateur/${(c.instructor as any)?.id}`}
                      className="font-bold text-gray-900 text-lg hover:text-[#0B3D91] transition-colors block">
                      {(c.instructor as any)?.full_name}
                    </Link>
                    <p className="text-sm text-[#0B3D91] font-medium mt-0.5 mb-2">Expert certifié — IBIG E-LEARNING</p>
                    {(c.instructor as any)?.bio && (
                      <p className="text-gray-500 text-sm leading-relaxed">{(c.instructor as any).bio}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Avis apprenants */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/70">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900 text-lg">Avis des apprenants</h2>
                  {c.rating_average > 0 && (
                    <div className="flex items-center gap-2">
                      <StarRating value={Math.round(c.rating_average)} readonly size="sm" />
                      <span className="text-sm font-bold text-gray-900">{Number(c.rating_average).toFixed(1)}</span>
                      <span className="text-sm text-gray-400">({c.rating_count ?? 0} avis)</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="px-4 sm:px-6 py-5">
                {isEnrolled && (
                  <div className="mb-6 p-5 bg-blue-50 rounded-xl border border-blue-100">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      {myReview ? 'Modifier votre avis' : 'Donnez votre avis'}
                    </h3>
                    <ReviewForm courseId={course.id} existingReview={myReview ?? undefined} />
                  </div>
                )}
                <ReviewsList courseId={course.id} ratingAvg={c.rating_average ?? 0} reviewCount={c.rating_count ?? 0} />
              </div>
            </div>
          </div>

          {/* ── SIDEBAR STICKY ── */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <div className="lg:sticky lg:top-24">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

                {/* Thumbnail */}
                {c.thumbnail_url && (
                  <div className="relative aspect-video bg-gray-900 overflow-hidden">
                    <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover opacity-90" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        c.level === 'debutant' ? 'bg-emerald-500 text-white' :
                        c.level === 'intermediaire' ? 'bg-amber-500 text-white' :
                        'bg-rose-500 text-white'
                      }`}>{levelLabel[c.level]}</span>
                    </div>
                  </div>
                )}

                <div className="p-5">
                  {/* Prix */}
                  <div className="flex items-baseline gap-2 mb-1">
                    <PriceDisplay price_xof={c.price_xof} price_eur={c.price_eur} price_usd={c.price_usd} className="text-3xl font-extrabold text-[#0B3D91]" />
                  </div>
                  {c.price_xof > 0 && (
                    <p className="text-xs text-gray-400 mb-4">Accès illimité · Paiement unique</p>
                  )}

                  <EnrollButton courseId={c.id} courseSlug={c.slug} isEnrolled={isEnrolled} isFree={c.price_xof === 0} isLoggedIn={!!user} />

                  {/* Garantie */}
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Satisfait ou remboursé — 7 jours</span>
                  </div>

                  {/* Séparateur */}
                  <div className="my-5 border-t border-gray-100" />

                  {/* Ce que vous obtenez */}
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Cette formation inclut</h3>
                  <div className="space-y-2.5">
                    {[
                      { icon: Clock,     text: `${c.duration_hours} heures de contenu`, color: 'text-blue-500' },
                      { icon: BookOpen,  text: `${totalLessons} leçons`,                color: 'text-purple-500' },
                      { icon: Award,     text: 'Certificat de réussite vérifiable',      color: 'text-amber-500' },
                      { icon: Zap,       text: 'Accès à vie au contenu',                color: 'text-emerald-500' },
                      { icon: Globe,     text: 'Accessible depuis toute l\'Afrique',     color: 'text-teal-500' },
                    ].map(item => (
                      <div key={item.text} className="flex items-center gap-3 text-sm text-gray-700">
                        <item.icon className={`w-4 h-4 flex-shrink-0 ${item.color}`} />
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Partage / lien */}
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <p className="text-center text-xs text-gray-400">Vous avez des questions ?</p>
                    <Link href="/contact" className="mt-2 block text-center text-xs text-[#0B3D91] font-semibold hover:underline">
                      Contacter IBIG Academy →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Badge confiance */}
              <div className="mt-4 rounded-xl bg-gradient-to-r from-[#0B3D91]/5 to-blue-50 border border-blue-100 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#0B3D91] flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-900">Formation certifiante</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Recevez un certificat numérique vérifiable à la completion de la formation — reconnu par les employeurs africains.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
