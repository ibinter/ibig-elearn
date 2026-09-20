import Link from 'next/link'
import { ArrowRight, Users, BookOpen, Award, Shield, Smartphone, Globe, CheckCircle, TrendingUp, Star, Zap, Target, BarChart3, Clock, BadgeCheck, Flame, Play, ChevronRight, MapPin, Sparkles, Trophy, Rocket } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Course, Category } from '@/types'
import CourseCard from '@/components/ui/CourseCard'
import RecommendedCourses from '@/components/ui/RecommendedCourses'
import CountUp from '@/components/ui/CountUp'
import { LiveTicker, HeroCTA } from '@/components/home/HeroAnimated'
import CountriesMarquee from '@/components/home/CountriesMarquee'
import TestimonialsCarousel from '@/components/home/TestimonialsCarousel'

async function getFeaturedCourses(): Promise<Course[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('*, instructor:profiles(full_name, avatar_url), category:categories(name, slug), price_eur, price_usd')
    .eq('is_published', true)
    .eq('is_featured', true)
    .order('enrollment_count', { ascending: false })
    .limit(6)
  return (data as Course[]) ?? []
}

async function getTopCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('*').order('position').limit(8)
  return (data as Category[]) ?? []
}

async function getStats() {
  const supabase = await createClient()
  const [{ count: courses }, { count: enrollments }, { count: certificates }, { count: instructors }] = await Promise.all([
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }),
    supabase.from('certificates').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'formateur'),
  ])
  return { courses: courses ?? 0, enrollments: enrollments ?? 0, certificates: certificates ?? 0, instructors: instructors ?? 0 }
}

async function getTopInstructors() {
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('id, full_name, avatar_url, bio, country').eq('role', 'formateur').limit(4)
  return data ?? []
}

async function getPublishedTestimonials() {
  const supabase = await createClient()
  const { data } = await supabase.from('testimonials').select('*').eq('is_published', true).order('position').limit(9)
  return data ?? []
}

const CATEGORY_ICONS: Record<string, string> = {
  'informatique-et-technologie': '💻',
  'management-et-leadership': '🎯',
  'comptabilite-et-finance': '📊',
  'commercial-et-marketing': '📈',
  'gestion-des-ressources-humaines': '👥',
  'entrepreneuriat-et-business': '🚀',
  'btp-et-construction': '🏗️',
  'immobilier': '🏠',
  'ia-et-digitalisation': '🤖',
  'sante-et-pharmacie': '🏥',
  'droit-et-juridique': '⚖️',
  'agriculture-et-agroalimentaire': '🌱',
  'banque-et-assurance': '🏦',
  'logistique-et-supply-chain': '🚚',
  'infographie-et-design': '🎨',
  'developpement-personnel': '✨',
  'education-et-formation': '🎓',
  'communication-et-medias': '📡',
  'tourisme-et-hotellerie': '✈️',
  'mines-energie-et-petrole': '⛏️',
  'qhse-et-environnement': '🌿',
  'creation-de-contenu': '🎬',
  'direction-et-administration': '🏛️',
}

const FALLBACK_TESTIMONIALS = [
  { id: '1', author_name: 'Kouassi Ange-Brice', author_role: 'Directeur Commercial', author_country: "Côte d'Ivoire", content: "IBIG E-LEARN m'a permis de me certifier en marketing digital sans quitter Abidjan. La qualité des formateurs et les cas pratiques africains font toute la différence.", rating: 5, color: 'bg-blue-600' },
  { id: '2', author_name: 'Fatou Diallo', author_role: 'Responsable RH', author_country: 'Sénégal', content: "J'ai obtenu ma certification GRH en 3 mois tout en travaillant à temps plein. Le paiement en Orange Money et le contenu téléchargeable m'ont énormément facilité la vie.", rating: 5, color: 'bg-green-600' },
  { id: '3', author_name: 'Moussa Traoré', author_role: 'Entrepreneur', author_country: 'Mali', content: "La formation en comptabilité SYSCOHADA est exactement ce qu'il me fallait pour gérer ma PME. Les formateurs connaissent les réalités du marché africain.", rating: 5, color: 'bg-orange-600' },
  { id: '4', author_name: 'Aminata Koné', author_role: 'Chef de Projet IT', author_country: 'Guinée', content: "La certification PMP adaptée au contexte africain m'a ouvert des portes insoupçonnées. Formation de très haute qualité, je recommande vivement.", rating: 5, color: 'bg-purple-600' },
  { id: '5', author_name: 'Jean-Paul Ngoma', author_role: 'DAF PME', author_country: 'Cameroun', content: "Excellent rapport qualité-prix. Les modules de fiscalité camerounaise sont précis et pratiques. Mon équipe et moi suivons plusieurs formations en parallèle.", rating: 5, color: 'bg-red-600' },
  { id: '6', author_name: 'Awa Sow', author_role: 'Consultante RH', author_country: 'Sénégal', content: "Les formateurs sont de vrais praticiens, pas des théoriciens. Ils comprennent les enjeux RH en Afrique de l'Ouest. Mes clients apprécient mon évolution.", rating: 5, color: 'bg-teal-600' },
]

export default async function HomePage() {
  const [featuredCourses, categories, stats, instructors, testimonials] = await Promise.all([
    getFeaturedCourses(), getTopCategories(), getStats(), getTopInstructors(), getPublishedTestimonials(),
  ])

  const allTestimonials = (testimonials.length > 0
    ? testimonials.map((t: any) => ({ ...t, initials: t.author_name?.slice(0, 2).toUpperCase() }))
    : FALLBACK_TESTIMONIALS) as any[]

  return (
    <div className="overflow-x-hidden">

      {/* ═══════════════════════════════════════════════
          HERO — CINÉMATIQUE
      ═══════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #020b1a 0%, #051530 30%, #071e45 60%, #020b1a 100%)' }}>

        {/* Orbs animés */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-20 blur-[100px] animate-float-slow"
          style={{ background: 'radial-gradient(circle, #0B3D91, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-15 blur-[80px] animate-float"
          style={{ background: 'radial-gradient(circle, #FFA500, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full opacity-10 blur-[60px] -translate-x-1/2 -translate-y-1/2"
          style={{ background: 'radial-gradient(circle, #4f8ef7, transparent)' }} />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '80px 80px' }} />

        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-0 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center min-h-screen lg:min-h-0 lg:py-20">

            {/* COL GAUCHE */}
            <div className="pt-8 lg:pt-0">
              <div className="mb-8 animate-fadeInUp">
                <LiveTicker />
              </div>

              {/* Badge */}
              <div className="mb-5 animate-fadeInUp-delay">
                <span className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FFA500]/20 to-[#FFA500]/5 border border-[#FFA500]/30 text-[#FFA500] rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em]">
                  <Sparkles className="w-3.5 h-3.5" />
                  #1 Plateforme eLearning en Afrique francophone
                </span>
              </div>

              {/* Titre massif */}
              <h1 className="text-[3rem] sm:text-[4rem] lg:text-[4.5rem] xl:text-[5.5rem] font-black leading-[1.0] text-white mb-6 tracking-tight animate-fadeInUp-delay">
                La plateforme<br />
                <span className="relative">
                  <span style={{ background: 'linear-gradient(90deg, #FFA500, #FFD700, #FFA500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    qui forme
                  </span>
                </span>{' '}
                l&apos;Afrique<br />
                <span className="text-white/90">de demain.</span>
              </h1>

              <p className="text-blue-200/80 text-base sm:text-lg leading-relaxed mb-10 max-w-[520px] animate-fadeInUp-delay2">
                Formations <strong className="text-white">certifiantes et professionnelles</strong> adaptées
                au marché africain — payez en Mobile Money, apprenez à votre rythme,
                obtenez un certificat <strong className="text-white">reconnu et vérifiable</strong> dans 12 pays.
              </p>

              <div className="animate-fadeInUp-delay2">
                <HeroCTA />
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-x-6 gap-y-3 mt-10 animate-fadeInUp-delay3">
                {[
                  { icon: BadgeCheck, text: 'Certificats vérifiables', color: 'text-green-400' },
                  { icon: Smartphone, text: 'Mobile Money', color: 'text-yellow-400' },
                  { icon: Globe, text: '12 pays', color: 'text-blue-400' },
                  { icon: Zap, text: 'Accès immédiat', color: 'text-orange-400' },
                ].map(({ icon: Icon, text, color }) => (
                  <div key={text} className="flex items-center gap-1.5 text-sm text-blue-200/70">
                    <Icon className={`w-4 h-4 ${color}`} />
                    {text}
                  </div>
                ))}
              </div>

              {/* Rating social proof */}
              <div className="flex items-center gap-4 mt-8 pt-8 border-t border-white/10 animate-fadeInUp-delay3">
                <div className="flex -space-x-2">
                  {['🇨🇮','🇸🇳','🇨🇲','🇲🇱','🇧🇫'].map((flag, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0B3D91] to-[#1558c0] border-2 border-[#020b1a] flex items-center justify-center text-xs">{flag}</div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 mb-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 text-[#FFA500] fill-[#FFA500]" />)}
                  </div>
                  <p className="text-xs text-blue-200/70"><strong className="text-white">{stats.enrollments > 0 ? stats.enrollments.toLocaleString('fr-FR') : '2 400'}+</strong> apprenants nous font confiance</p>
                </div>
              </div>
            </div>

            {/* COL DROITE — Dashboard mockup */}
            <div className="hidden lg:flex justify-end items-center animate-fadeInUp-delay">
              <div className="relative w-full max-w-[480px]">

                {/* Carte centrale principale */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10"
                  style={{ background: 'linear-gradient(135deg, rgba(11,61,145,0.4), rgba(4,14,36,0.8))', backdropFilter: 'blur(20px)' }}>
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-white font-bold text-sm">Tableau de bord</span>
                      </div>
                      <span className="text-xs text-blue-300/70">IBIG E-LEARN</span>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {[
                        { label: 'Formations', value: stats.courses > 0 ? `${stats.courses}+` : '184+', icon: BookOpen, color: 'from-blue-500/20 to-blue-600/10', iconColor: 'text-blue-400' },
                        { label: 'Apprenants', value: stats.enrollments > 1000 ? `${Math.floor(stats.enrollments/1000)}k+` : '2.4k+', icon: Users, color: 'from-green-500/20 to-green-600/10', iconColor: 'text-green-400' },
                        { label: 'Pays', value: '12', icon: Globe, color: 'from-orange-500/20 to-orange-600/10', iconColor: 'text-orange-400' },
                      ].map(s => (
                        <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-3 border border-white/10 text-center`}>
                          <s.icon className={`w-5 h-5 ${s.iconColor} mx-auto mb-1.5`} />
                          <p className="text-white font-black text-xl">{s.value}</p>
                          <p className="text-blue-300/70 text-[10px] mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/8">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-white text-xs font-semibold">Management Stratégique</p>
                          <p className="text-blue-300/60 text-[10px]">Module 4 / 8 en cours</p>
                        </div>
                        <span className="text-[#FFA500] text-xs font-black">68%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div className="h-2 rounded-full animate-shimmer" style={{ width: '68%', background: 'linear-gradient(90deg, #FFA500, #FFD700)' }} />
                      </div>
                    </div>

                    {/* Certificate earned */}
                    <div className="flex items-center gap-3 bg-gradient-to-r from-green-500/15 to-emerald-600/10 border border-green-500/25 rounded-2xl p-3">
                      <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Award className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-xs font-bold">Certificat obtenu ! 🎉</p>
                        <p className="text-green-300/70 text-[10px]">Comptabilité SYSCOHADA — Décroché aujourd&apos;hui</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating card — note */}
                <div className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 animate-float"
                  style={{ maxWidth: '200px' }}>
                  <div className="text-2xl">⭐</div>
                  <div>
                    <p className="font-black text-gray-900 text-sm">4.8/5</p>
                    <p className="text-xs text-gray-500">Note moyenne</p>
                  </div>
                </div>

                {/* Floating card — new enrollment */}
                <div className="absolute -bottom-5 -left-6 bg-white rounded-2xl shadow-2xl p-3.5 flex items-center gap-3 animate-float-delay"
                  style={{ maxWidth: '230px' }}>
                  <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-xs">+12 inscrits</p>
                    <p className="text-gray-400 text-[10px]">ces 2 dernières heures</p>
                  </div>
                </div>

                {/* Glow ring */}
                <div className="absolute inset-0 rounded-3xl animate-glow pointer-events-none" />
              </div>
            </div>

          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-blue-300/50">
          <div className="w-5 h-8 border-2 border-current rounded-full flex justify-center pt-1.5">
            <div className="w-1 h-1.5 bg-current rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          STATS BAND — CHIFFRES CLÉS
      ═══════════════════════════════════════════════ */}
      <section className="relative py-0 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100">
            {[
              { end: stats.courses > 0 ? stats.courses : 184, suffix: '+', label: 'Formations certifiantes', sub: 'disponibles maintenant', icon: BookOpen, color: 'text-[#0B3D91]', bg: 'bg-blue-50' },
              { end: stats.enrollments > 0 ? stats.enrollments : 2400, suffix: '+', label: 'Apprenants actifs', sub: 'à travers 12 pays', icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
              { end: stats.certificates > 0 ? stats.certificates : 1200, suffix: '+', label: 'Certificats délivrés', sub: 'vérifiables par QR code', icon: Award, color: 'text-orange-600', bg: 'bg-orange-50' },
              { end: 12, suffix: ' pays', label: 'Pays couverts', sub: 'Afrique francophone', icon: Globe, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center py-10 px-6 gap-3 group hover:bg-gray-50/50 transition-colors">
                <div className={`w-14 h-14 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center mb-1 group-hover:scale-110 transition-transform`}>
                  <s.icon className="w-7 h-7" />
                </div>
                <div className="text-4xl sm:text-5xl font-black text-gray-900">
                  <CountUp end={s.end} suffix={s.suffix} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900 text-sm">{s.label}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </section>

      {/* ═══════════════════════════════════════════════
          CATÉGORIES — GRILLE PREMIUM
      ═══════════════════════════════════════════════ */}
      <section className="py-24" style={{ background: 'linear-gradient(180deg, #f8faff 0%, #ffffff 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-[#0B3D91] text-xs font-bold uppercase tracking-widest mb-4 bg-blue-50 px-4 py-1.5 rounded-full">
              <Target className="w-3.5 h-3.5" /> Nos domaines
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 leading-tight">
              25+ domaines professionnels<br />
              <span style={{ background: 'linear-gradient(90deg, #0B3D91, #1a6cc4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                couverts par nos experts
              </span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">Tous les secteurs porteurs du marché africain, enseignés par des praticiens reconnus</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.map((cat, i) => (
              <Link key={cat.slug} href={`/catalogue?categorie=${cat.slug}`}
                className="group relative flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-[#0B3D91]/20 transition-all duration-300 text-center overflow-hidden">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                  style={{ background: `linear-gradient(135deg, hsl(${200 + i * 15}, 70%, 97%), white)` }} />
                <span className="text-3xl relative z-10 group-hover:scale-110 transition-transform duration-300">{CATEGORY_ICONS[cat.slug] ?? '📚'}</span>
                <span className="font-semibold text-[11px] leading-tight text-gray-700 group-hover:text-[#0B3D91] transition-colors relative z-10">{cat.name}</span>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/catalogue"
              className="inline-flex items-center gap-2 border-2 border-[#0B3D91] text-[#0B3D91] font-bold px-8 py-3.5 rounded-2xl hover:bg-[#0B3D91] hover:text-white transition-all group">
              Voir les 25+ domaines <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FORMATIONS VEDETTES
      ═══════════════════════════════════════════════ */}
      {featuredCourses.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="inline-flex items-center gap-2 text-orange-600 text-xs font-bold uppercase tracking-widest mb-3 bg-orange-50 px-4 py-1.5 rounded-full">
                  <Flame className="w-3.5 h-3.5" /> Top formations
                </span>
                <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-2">Les plus populaires</h2>
                <p className="text-gray-500">Plébiscitées par nos apprenants à travers toute l&apos;Afrique</p>
              </div>
              <Link href="/catalogue?featured=true" className="hidden sm:flex items-center gap-1.5 text-[#0B3D91] font-bold hover:underline text-sm flex-shrink-0 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                Voir tout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          RECOMMANDÉS
      ═══════════════════════════════════════════════ */}
      <section className="pb-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RecommendedCourses title="Formations populaires" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          COMMENT ÇA MARCHE — TIMELINE
      ═══════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #f8faff 0%, #eef3ff 50%, #f8faff 100%)' }}>
        {/* Decorative circles */}
        <div className="absolute top-20 -left-20 w-64 h-64 rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, #0B3D91, transparent)' }} />
        <div className="absolute bottom-20 -right-20 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #FFA500, transparent)' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-[#0B3D91] text-xs font-bold uppercase tracking-widest mb-4 bg-blue-100/70 px-4 py-1.5 rounded-full">
              <Rocket className="w-3.5 h-3.5" /> Simple & rapide
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">De zéro à certifié<br />en 3 étapes</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Depuis votre smartphone, en francs CFA, en quelques semaines</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-0 relative">
            {/* Connecting line */}
            <div className="hidden sm:block absolute top-16 left-[16.66%] right-[16.66%] h-0.5"
              style={{ background: 'linear-gradient(90deg, #0B3D91, #FFA500, #10b981)' }} />

            {[
              {
                step: '1', icon: BookOpen, title: 'Choisissez',
                desc: "Parcourez 184 formations certifiantes. Filtrez par domaine, niveau et budget. Lisez les avis d'autres professionnels africains.",
                gradient: 'from-[#0B3D91] to-blue-600',
                badge: 'Gratuit',
                badgeColor: 'bg-blue-100 text-[#0B3D91]',
                detail: '📍 Depuis Abidjan, Dakar, Douala, Bamako…',
              },
              {
                step: '2', icon: Smartphone, title: 'Payez',
                desc: 'Orange Money, MTN, Wave, carte bancaire. 12 devises africaines. Garantie satisfait ou remboursé 7 jours sans conditions.',
                gradient: 'from-[#FFA500] to-orange-500',
                badge: 'Sécurisé SSL',
                badgeColor: 'bg-orange-100 text-orange-700',
                detail: '💳 XOF, XAF, GNF, MAD, NGN et plus',
              },
              {
                step: '3', icon: Award, title: 'Certifiez-vous',
                desc: 'Apprenez à votre rythme sur mobile ou desktop. Réussissez l\'évaluation et téléchargez votre certificat PDF vérifiable.',
                gradient: 'from-emerald-500 to-teal-600',
                badge: 'Vérifiable QR',
                badgeColor: 'bg-green-100 text-green-700',
                detail: '🏆 Reconnu par les entreprises africaines',
              },
            ].map((item, i) => (
              <div key={i} className="relative flex flex-col items-center text-center px-4 sm:px-8">
                {/* Step circle */}
                <div className={`relative z-10 w-14 h-14 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-6 shadow-lg shadow-current/30`}>
                  <item.icon className="w-6 h-6 text-white" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-[10px] font-black text-gray-700">{item.step}</div>
                </div>

                <span className={`text-xs font-bold px-3 py-1 rounded-full mb-3 ${item.badgeColor}`}>{item.badge}</span>
                <h3 className="text-2xl font-black text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{item.desc}</p>
                <p className="text-xs text-gray-400 italic">{item.detail}</p>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <Link href="/inscription"
              className="group inline-flex items-center gap-3 font-black text-black px-10 py-5 rounded-2xl text-base shadow-2xl hover:scale-105 transition-all"
              style={{ background: 'linear-gradient(90deg, #FFA500, #FFD700)', boxShadow: '0 20px 40px rgba(255,165,0,0.3)' }}>
              Commencer maintenant — C&apos;est gratuit
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CHIFFRES DU SUCCÈS — IMPACT SECTION
      ═══════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg, #020b1a 0%, #071e45 50%, #020b1a 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-10 blur-[100px] rounded-full"
          style={{ background: 'radial-gradient(circle, #FFA500, transparent)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] opacity-10 blur-[80px] rounded-full"
          style={{ background: 'radial-gradient(circle, #0B3D91, transparent)' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-[#FFA500] text-xs font-bold uppercase tracking-widest mb-4 border border-[#FFA500]/30 bg-[#FFA500]/10 px-4 py-1.5 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" /> Impact réel
            </span>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
              Des résultats concrets<br />
              <span style={{ background: 'linear-gradient(90deg, #FFA500, #FFD700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                pour votre carrière
              </span>
            </h2>
            <p className="text-blue-200/70 max-w-xl mx-auto">Chaque formation est conçue pour transformer votre expertise et générer un ROI immédiat</p>
          </div>

          {/* Big impact stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {[
              { value: '94%', label: 'taux de satisfaction', sub: 'sur 1 200+ avis vérifiés', icon: Star, color: 'text-yellow-400', border: 'border-yellow-400/20' },
              { value: '3×', label: 'gain de productivité', sub: 'reporté par nos apprenants', icon: TrendingUp, color: 'text-green-400', border: 'border-green-400/20' },
              { value: '< 4h', label: 'pour voir un impact', sub: 'sur votre poste de travail', icon: Clock, color: 'text-blue-400', border: 'border-blue-400/20' },
              { value: '12', label: 'pays couverts', sub: 'Afrique francophone', icon: Globe, color: 'text-purple-400', border: 'border-purple-400/20' },
            ].map(s => (
              <div key={s.label} className={`relative rounded-3xl p-6 text-center border ${s.border} overflow-hidden hover:scale-105 transition-transform`}
                style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                <s.icon className={`w-8 h-8 ${s.color} mx-auto mb-3`} />
                <div className="text-4xl sm:text-5xl font-black text-white mb-1">{s.value}</div>
                <p className="font-semibold text-white/90 text-sm">{s.label}</p>
                <p className="text-blue-300/50 text-xs mt-1">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Features grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Award, title: 'Certifications vérifiables', desc: 'QR code unique, vérifiable par tout employeur ou partenaire en temps réel.', accent: 'text-yellow-400' },
              { icon: Smartphone, title: 'Mobile-first & hors-ligne', desc: 'Apprenez sur 3G. Téléchargez les cours pour les zones à faible connectivité.', accent: 'text-green-400' },
              { icon: Globe, title: '12 devises africaines', desc: 'XOF, XAF, GNF, MAD, NGN, KES… Payez dans votre monnaie locale.', accent: 'text-blue-400' },
              { icon: Users, title: 'Formateurs praticiens', desc: 'Experts reconnus, ancrés dans la réalité des marchés et entreprises africains.', accent: 'text-purple-400' },
              { icon: Shield, title: 'Garantie 7 jours', desc: 'Satisfait ou remboursé, sans condition. Votre investissement est protégé.', accent: 'text-red-400' },
              { icon: Target, title: 'Accès à vie', desc: 'Payez une fois, accédez pour toujours. Toutes les mises à jour incluses.', accent: 'text-orange-400' },
            ].map(item => (
              <div key={item.title} className="flex gap-4 rounded-2xl p-5 border border-white/8 hover:border-white/15 transition-colors group cursor-default"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}
                  style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <item.icon className={`w-5 h-5 ${item.accent}`} />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1 text-sm">{item.title}</h3>
                  <p className="text-blue-200/60 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TÉMOIGNAGES — SOCIAL PROOF MASSIF
      ═══════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-[#0B3D91] text-xs font-bold uppercase tracking-widest mb-4 bg-blue-50 px-4 py-1.5 rounded-full">
              <Trophy className="w-3.5 h-3.5" /> Témoignages
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
              Ils ont transformé<br />
              <span style={{ background: 'linear-gradient(90deg, #0B3D91, #1a6cc4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                leur carrière
              </span>
            </h2>
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-[#FFA500] fill-[#FFA500]" />)}
              </div>
              <span className="font-black text-gray-900 text-lg">4.8/5</span>
              <span>· Plus de 1 200 avis vérifiés</span>
            </div>
          </div>
          <TestimonialsCarousel testimonials={allTestimonials} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PAYS — MARQUEE BAND
      ═══════════════════════════════════════════════ */}
      <section className="relative py-10 overflow-hidden" style={{ background: 'linear-gradient(90deg, #0B3D91, #1a4faa, #0B3D91)' }}>
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="max-w-7xl mx-auto px-4 mb-4">
          <p className="text-center text-blue-200/80 text-sm font-bold uppercase tracking-widest">
            🌍 Disponible dans 12 pays d&apos;Afrique francophone
          </p>
        </div>
        <CountriesMarquee />
      </section>

      {/* ═══════════════════════════════════════════════
          FORMATEURS
      ═══════════════════════════════════════════════ */}
      {instructors.length > 0 && (
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 text-[#0B3D91] text-xs font-bold uppercase tracking-widest mb-4 bg-blue-50 px-4 py-1.5 rounded-full">
                <Users className="w-3.5 h-3.5" /> Nos experts
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">Apprenez des meilleurs</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Des praticiens reconnus dans leurs domaines, ancrés dans les réalités africaines</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {instructors.map((f: any) => (
                <Link key={f.id} href={`/formateur/${f.id}`}
                  className="group relative bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden">
                  {/* Background accent */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"
                    style={{ background: 'linear-gradient(135deg, #f0f4ff, white)' }} />

                  <div className="relative">
                    <div className="relative inline-block mb-5">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0B3D91] to-[#1a6cc4] flex items-center justify-center text-white font-black text-2xl mx-auto overflow-hidden ring-4 ring-white shadow-lg group-hover:ring-[#0B3D91]/20 transition-all">
                        {f.avatar_url
                          ? <img src={f.avatar_url} alt={f.full_name} className="w-full h-full object-cover" />
                          : f.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-400 border-2 border-white flex items-center justify-center">
                        <BadgeCheck className="w-3 h-3 text-white" />
                      </div>
                    </div>

                    <p className="font-black text-gray-900 group-hover:text-[#0B3D91] transition-colors text-lg">{f.full_name}</p>
                    {f.country && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                        <MapPin className="w-3 h-3" />{f.country}
                      </p>
                    )}
                    {f.bio && <p className="text-xs text-gray-500 mt-3 line-clamp-2 leading-relaxed">{f.bio}</p>}
                    <div className="mt-4 inline-flex items-center gap-1 text-xs text-[#0B3D91] font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 px-3 py-1.5 rounded-full">
                      Voir le profil <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          CTA FINAL — ULTRA IMPACTANT
      ═══════════════════════════════════════════════ */}
      <section className="relative py-28 overflow-hidden text-white" style={{ background: 'linear-gradient(135deg, #020b1a 0%, #0d2d6e 40%, #020b1a 100%)' }}>
        {/* Animated orbs */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-15 blur-[80px] animate-float-slow"
          style={{ background: 'radial-gradient(circle, #FFA500, transparent)' }} />
        <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full opacity-10 blur-[80px] animate-float"
          style={{ background: 'radial-gradient(circle, #4f8ef7, transparent)' }} />

        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Live counter */}
          <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold mb-10 border border-[#FFA500]/30"
            style={{ background: 'rgba(255,165,0,0.12)' }}>
            <span className="w-2 h-2 rounded-full bg-[#FFA500] animate-pulse" />
            <span className="text-[#FFA500]">{stats.courses > 0 ? stats.courses : 184}+ formations · {stats.enrollments > 0 ? stats.enrollments.toLocaleString('fr-FR') : '2 400'}+ apprenants actifs</span>
          </div>

          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-[1.05] tracking-tight">
            Votre carrière<br />
            ne peut pas attendre<br />
            <span style={{ background: 'linear-gradient(90deg, #FFA500, #FFD700, #FFA500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              demain.
            </span>
          </h2>

          <p className="text-blue-200/70 text-lg sm:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
            Des professionnels de toute l&apos;Afrique se forment <strong className="text-white">dès aujourd&apos;hui</strong>.
            Inscription gratuite, paiement Mobile Money, certificat en quelques semaines.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/inscription"
              className="group relative inline-flex items-center justify-center gap-3 font-black text-black px-10 py-5 rounded-2xl text-base transition-all hover:scale-105"
              style={{ background: 'linear-gradient(90deg, #FFA500, #FFD700)', boxShadow: '0 20px 50px rgba(255,165,0,0.4)' }}>
              <span>Créer mon compte — C&apos;est gratuit</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/catalogue"
              className="inline-flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 text-white font-bold px-10 py-5 rounded-2xl transition-all text-base hover:bg-white/5">
              Explorer le catalogue
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-blue-300/70 text-sm">
            {[
              { icon: CheckCircle, text: 'Inscription 100% gratuite' },
              { icon: Shield, text: 'Garantie 7 jours' },
              { icon: BadgeCheck, text: 'Certificat vérifiable' },
              { icon: Zap, text: 'Accès immédiat' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-green-400" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
