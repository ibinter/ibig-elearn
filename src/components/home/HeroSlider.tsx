'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, Star, Users, Clock, Award, BookOpen, BadgeCheck, Smartphone, Globe, Zap, Sparkles, TrendingUp } from 'lucide-react'

const HERO_PHOTOS = ['students', 'learner', 'about', 'team']

interface SlideData {
  id: string
  badge?: string
  title: string
  titleHighlight?: string
  subtitle: string
  description: string
  cta1Label: string
  cta1Href: string
  cta2Label?: string
  cta2Href?: string
  gradient: string
  accentColor: string
  accentBg: string
  thumbnail?: string
  thumbnailAlt?: string
  stats?: { icon: any; value: string; label: string }[]
  tag?: string
  slug?: string
  rating?: number
  enrollments?: number
  duration?: number
}

interface HeroSliderProps {
  featuredCourses: any[]
  totalEnrollments: number
}

const SLIDE_DURATION = 6000

const STATIC_SLIDES: SlideData[] = [
  {
    id: 'brand',
    badge: '#1 Plateforme eLearning en Afrique francophone',
    title: 'Bienvenue sur',
    titleHighlight: 'IBIG E-LEARNING',
    subtitle: '',
    description: 'Formations certifiantes adaptées au marché africain — payez en Mobile Money, apprenez à votre rythme, obtenez un certificat reconnu dans 14 pays.',
    cta1Label: 'Explorer les formations',
    cta1Href: '/catalogue',
    cta2Label: 'Commencer gratuitement',
    cta2Href: '/inscription',
    gradient: 'linear-gradient(135deg, #020b1a 0%, #051530 35%, #0B3D91 70%, #020b1a 100%)',
    accentColor: '#FFA500',
    accentBg: 'rgba(255,165,0,0.15)',
  },
]

export default function HeroSlider({ featuredCourses, totalEnrollments }: HeroSliderProps) {
  const courseSlides: SlideData[] = featuredCourses.slice(0, 4).map((course, i) => {
    const gradients = [
      'linear-gradient(135deg, #0a0f1e 0%, #0d2137 40%, #0B3D91 100%)',
      'linear-gradient(135deg, #0f0a1e 0%, #1a0d37 40%, #4B0082 100%)',
      'linear-gradient(135deg, #0a1a0f 0%, #0d3020 40%, #1B5E20 100%)',
      'linear-gradient(135deg, #1a0a0a 0%, #37100d 40%, #7B1D1D 100%)',
    ]
    const accents = ['#FFA500', '#A78BFA', '#34D399', '#F87171']
    const accentBgs = ['rgba(255,165,0,0.15)', 'rgba(167,139,250,0.15)', 'rgba(52,211,153,0.15)', 'rgba(248,113,113,0.15)']
    return {
      id: course.id,
      tag: (course.category as any)?.name,
      badge: '✨ Formation à la une',
      title: course.title,
      titleHighlight: '',
      subtitle: '',
      description: course.short_description ?? '',
      cta1Label: 'Voir la formation',
      cta1Href: `/formation/${course.slug}`,
      cta2Label: 'Tout le catalogue',
      cta2Href: '/catalogue',
      gradient: gradients[i % gradients.length],
      accentColor: accents[i % accents.length],
      accentBg: accentBgs[i % accentBgs.length],
      thumbnail: course.thumbnail_url,
      thumbnailAlt: course.title,
      rating: course.rating_average,
      enrollments: course.enrollment_count,
      duration: course.duration_hours,
      slug: course.slug,
    }
  })

  const allSlides = [STATIC_SLIDES[0], ...courseSlides]

  const [current, setCurrent] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback((index: number) => {
    if (transitioning) return
    setTransitioning(true)
    setTimeout(() => {
      setCurrent(index)
      setProgress(0)
      setTransitioning(false)
    }, 400)
  }, [transitioning])

  const next = useCallback(() => goTo((current + 1) % allSlides.length), [current, allSlides.length, goTo])
  const prev = useCallback(() => goTo((current - 1 + allSlides.length) % allSlides.length), [current, allSlides.length, goTo])

  // Auto-advance
  useEffect(() => {
    if (isHovered) return
    intervalRef.current = setInterval(next, SLIDE_DURATION)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isHovered, next])

  // Progress bar
  useEffect(() => {
    if (isHovered) return
    setProgress(0)
    const step = 100 / (SLIDE_DURATION / 50)
    progressRef.current = setInterval(() => {
      setProgress(p => Math.min(p + step, 100))
    }, 50)
    return () => { if (progressRef.current) clearInterval(progressRef.current) }
  }, [current, isHovered])

  const slide = allSlides[current]
  const isBrand = slide.id === 'brand'

  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: '580px', background: slide.gradient, transition: 'background 0.8s ease' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Photos de fond (fondu enchaîné) ── */}
      {HERO_PHOTOS.map((p, i) => (
        <picture key={p} aria-hidden="true">
          <source media="(max-width: 767px)" srcSet={`/images/bg/${p}-m.webp`} />
          <img src={`/images/bg/${p}.webp`} alt="" loading={i === 0 ? 'eager' : 'lazy'}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-luminosity"
            style={{ opacity: current % HERO_PHOTOS.length === i ? 0.3 : 0, transition: 'opacity 1s ease' }} />
        </picture>
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-[#020b1a]/70 via-transparent to-transparent pointer-events-none" />

      {/* ── Orbs décoratifs ── */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${slide.accentColor}55, transparent)`, transition: 'background 1s ease' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-10 blur-[80px] pointer-events-none"
        style={{ background: `radial-gradient(circle, #4f8ef7, transparent)` }} />

      {/* ── Grid pattern ── */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#ffffff 1px,transparent 1px),linear-gradient(90deg,#ffffff 1px,transparent 1px)', backgroundSize: '80px 80px' }} />

      {/* ── Content ── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center" style={{ minHeight: '580px' }}>
        <div className={`grid w-full gap-8 lg:gap-12 items-center py-12 lg:py-8 ${isBrand ? 'lg:grid-cols-2' : 'lg:grid-cols-2'}`}>

          {/* ══ COLONNE GAUCHE ══ */}
          <div className={`transition-all duration-500 ${transitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>

            {/* Badge */}
            {slide.badge && (
              <div className="mb-5">
                <span className="inline-flex items-center gap-2 border rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
                  style={{ background: slide.accentBg, borderColor: `${slide.accentColor}50`, color: slide.accentColor }}>
                  <Sparkles className="w-3.5 h-3.5" />
                  {slide.badge}
                </span>
              </div>
            )}

            {/* Tag catégorie */}
            {slide.tag && (
              <div className="mb-4">
                <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">{slide.tag}</span>
              </div>
            )}

            {/* Titre */}
            {isBrand ? (
              <h1 className="text-[2rem] sm:text-[2.5rem] lg:text-[3rem] xl:text-[3.5rem] font-black leading-[1.1] text-white mb-5 tracking-tight">
                {slide.title}<br />
                <span style={{ background: `linear-gradient(90deg, ${slide.accentColor}, #FFD700, ${slide.accentColor})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {slide.titleHighlight}
                </span>
              </h1>
            ) : (
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight mb-4 tracking-tight">
                {slide.title}
              </h2>
            )}

            {/* Description */}
            <p className="text-white/70 text-base lg:text-lg leading-relaxed mb-8 max-w-[520px]">
              {slide.description}
            </p>

            {/* Stats inline pour les formations */}
            {!isBrand && (slide.rating || slide.enrollments || slide.duration) && (
              <div className="flex flex-wrap gap-5 mb-8">
                {slide.rating && slide.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-4 h-4 ${s <= Math.round(slide.rating!) ? 'fill-current' : 'opacity-30'}`} style={{ color: slide.accentColor }} />
                      ))}
                    </div>
                    <span className="font-bold text-white text-sm">{slide.rating.toFixed(1)}</span>
                  </div>
                )}
                {slide.enrollments !== undefined && slide.enrollments > 0 && (
                  <div className="flex items-center gap-1.5 text-white/60 text-sm">
                    <Users className="w-4 h-4" style={{ color: slide.accentColor }} />
                    <span><strong className="text-white">{slide.enrollments}</strong> apprenants</span>
                  </div>
                )}
                {slide.duration && (
                  <div className="flex items-center gap-1.5 text-white/60 text-sm">
                    <Clock className="w-4 h-4" style={{ color: slide.accentColor }} />
                    <span><strong className="text-white">{slide.duration}h</strong> de contenu</span>
                  </div>
                )}
              </div>
            )}

            {/* Trust badges sur la slide brand */}
            {isBrand && (
              <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8">
                {[
                  { icon: BadgeCheck, text: 'Certificats vérifiables', color: '#4ade80' },
                  { icon: Smartphone, text: 'Mobile Money', color: '#fbbf24' },
                  { icon: Globe, text: '14 pays', color: '#60a5fa' },
                  { icon: Zap, text: 'Accès immédiat', color: '#fb923c' },
                ].map(({ icon: Icon, text, color }) => (
                  <div key={text} className="flex items-center gap-1.5 text-sm text-white/60">
                    <Icon className="w-4 h-4" style={{ color }} />
                    {text}
                  </div>
                ))}
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link href={slide.cta1Href}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                style={{ background: `linear-gradient(135deg, ${slide.accentColor}, #FFD700)`, color: '#000' }}>
                {slide.cta1Label}
                <ArrowRight className="w-4 h-4" />
              </Link>
              {slide.cta2Label && (
                <Link href={slide.cta2Href!}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm border border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all duration-200 backdrop-blur-sm">
                  {slide.cta2Label}
                </Link>
              )}
            </div>

            {/* Social proof brand slide */}
            {isBrand && (
              <div className="flex items-center gap-4 mt-10 pt-8 border-t border-white/10">
                <div className="flex -space-x-2">
                  {['🇨🇮','🇸🇳','🇨🇲','🇲🇱','🇧🇫'].map((flag, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0B3D91] to-[#1558c0] border-2 border-[#020b1a] flex items-center justify-center text-xs">{flag}</div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 mb-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-[#FFA500] text-[#FFA500]" />)}
                  </div>
                  <p className="text-xs text-white/50">
                    <strong className="text-white">{totalEnrollments > 0 ? `${totalEnrollments.toLocaleString('fr-FR')}+` : '2 400+'}</strong> apprenants nous font confiance
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ══ COLONNE DROITE ══ */}
          <div className={`hidden lg:flex justify-center lg:justify-end items-center transition-all duration-500 ${transitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            {isBrand ? (
              /* Dashboard mockup pour la slide brand */
              <div className="relative w-full max-w-[460px]">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10"
                  style={{ background: 'linear-gradient(135deg,rgba(11,61,145,0.5),rgba(4,14,36,0.85))', backdropFilter: 'blur(20px)' }}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-white font-bold text-sm">Mon tableau de bord</span>
                      </div>
                      <span className="text-xs text-blue-300/60">IBIG E-LEARNING</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {[
                        { label: 'Cours actifs', value: '3', icon: BookOpen, color: 'from-blue-500/20 to-blue-600/10', iconColor: '#60a5fa' },
                        { label: 'Complétés', value: '7', icon: Award, color: 'from-green-500/20 to-green-600/10', iconColor: '#4ade80' },
                        { label: 'Certificats', value: '5', icon: BadgeCheck, color: 'from-orange-500/20 to-orange-600/10', iconColor: '#fb923c' },
                      ].map(s => (
                        <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-3 border border-white/10 text-center`}>
                          <s.icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: s.iconColor }} />
                          <p className="text-white font-black text-xl">{s.value}</p>
                          <p className="text-blue-300/60 text-[10px] mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/8">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-white text-xs font-semibold">Management & Leadership</p>
                          <p className="text-blue-300/60 text-[10px]">Module 4 / 8 en cours</p>
                        </div>
                        <span className="text-xs font-black" style={{ color: slide.accentColor }}>68%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: '68%', background: `linear-gradient(90deg, ${slide.accentColor}, #FFD700)`, transition: 'background 0.8s ease' }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl p-3" style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)' }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(74,222,128,0.15)' }}>
                        <Award className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white text-xs font-bold">Certificat obtenu ! 🎉</p>
                        <p className="text-green-300/70 text-[10px]">Comptabilité SYSCOHADA — Décroché aujourd&apos;hui</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating cards */}
                <div className="absolute -top-5 -right-5 bg-white rounded-2xl shadow-2xl p-3.5 flex items-center gap-3 animate-float" style={{ maxWidth: '190px' }}>
                  <span className="text-2xl">⭐</span>
                  <div>
                    <p className="font-black text-gray-900 text-sm">4.7 / 5</p>
                    <p className="text-xs text-gray-400">Note moyenne</p>
                  </div>
                </div>
                <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-2xl p-3 flex items-center gap-3 animate-float-delay" style={{ maxWidth: '220px' }}>
                  <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-xs">+12 inscrits</p>
                    <p className="text-gray-400 text-[10px]">ces 2 dernières heures</p>
                  </div>
                </div>
              </div>
            ) : slide.thumbnail ? (
              /* Thumbnail formation */
              <div className="relative w-full max-w-[480px]">
                {/* Glow derrière l'image */}
                <div className="absolute inset-0 rounded-3xl blur-3xl opacity-40 scale-95"
                  style={{ background: slide.accentColor }} />
                <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-2 ring-white/10">
                  <img src={slide.thumbnail} alt={slide.thumbnailAlt ?? ''} className="w-full aspect-video object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  {/* Prix en overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-white/60 text-xs mb-1">Formation certifiante</p>
                        <p className="text-white font-black text-2xl">À partir de</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-3xl" style={{ color: slide.accentColor }}>
                          {/* prix depuis le catalogue */}
                          28 000 <span className="text-lg">FCFA</span>
                        </p>
                        <p className="text-white/50 text-xs">Paiement Mobile Money</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Badge catégorie */}
                {slide.tag && (
                  <div className="absolute -top-4 left-6">
                    <span className="px-3 py-1.5 rounded-full text-xs font-bold shadow-lg"
                      style={{ background: slide.accentColor, color: '#000' }}>
                      {slide.tag}
                    </span>
                  </div>
                )}
                {/* Badge IBIG */}
                <div className="absolute -bottom-4 right-6">
                  <div className="flex items-center gap-2 bg-white rounded-2xl shadow-xl px-4 py-2">
                    <BadgeCheck className="w-4 h-4 text-[#0B3D91]" />
                    <span className="text-xs font-bold text-gray-900">Certifiante</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ══ NAVIGATION BAS ══ */}
      <div className="absolute bottom-0 left-0 right-0">
        {/* Barre de progression */}
        <div className="h-0.5 bg-white/10">
          <div className="h-full transition-none"
            style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${slide.accentColor}, #FFD700)`, transition: isHovered ? 'none' : 'width 0.05s linear' }} />
        </div>

        {/* Dots + arrows */}
        <div className="flex items-center justify-between px-6 lg:px-12 py-5" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' }}>
          {/* Prev */}
          <button onClick={prev} className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white/50 hover:bg-white/10 transition-all duration-200">
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {allSlides.map((s, i) => (
              <button key={s.id} onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${i === current ? 'w-6 h-2' : 'w-2 h-2 hover:opacity-70'}`}
                style={{ background: i === current ? slide.accentColor : 'rgba(255,255,255,0.3)' }} />
            ))}
          </div>

          {/* Next */}
          <button onClick={next} className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white/50 hover:bg-white/10 transition-all duration-200">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Arrows latéraux (desktop) */}
      <button onClick={prev}
        className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full items-center justify-center text-white/70 hover:text-white hover:bg-white/10 border border-white/15 hover:border-white/40 transition-all duration-200 backdrop-blur-sm">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={next}
        className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full items-center justify-center text-white/70 hover:text-white hover:bg-white/10 border border-white/15 hover:border-white/40 transition-all duration-200 backdrop-blur-sm">
        <ChevronRight className="w-5 h-5" />
      </button>
    </section>
  )
}
