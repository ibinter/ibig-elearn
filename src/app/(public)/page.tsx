import Link from 'next/link'
import { ArrowRight, Users, BookOpen, Award, Shield, Smartphone, Globe, CheckCircle, TrendingUp, Star, Zap, Target, BarChart3, Clock, BadgeCheck, Flame } from 'lucide-react'
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
  return {
    courses: courses ?? 0,
    enrollments: enrollments ?? 0,
    certificates: certificates ?? 0,
    instructors: instructors ?? 0,
  }
}

async function getTopInstructors() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, bio, country')
    .eq('role', 'formateur')
    .limit(4)
  return data ?? []
}

async function getPublishedTestimonials() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_published', true)
    .order('position')
    .limit(9)
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

const SUCCESS_STATS = [
  { value: '94%', label: 'taux de satisfaction', icon: Star, color: 'text-yellow-500' },
  { value: '3×', label: 'gain de productivité moyen', icon: TrendingUp, color: 'text-green-500' },
  { value: '72h', label: 'délai moyen pour décrocher une promo', icon: Clock, color: 'text-blue-500' },
  { value: '12', label: 'pays d\'Afrique couverts', icon: Globe, color: 'text-purple-500' },
]

export default async function HomePage() {
  const [featuredCourses, categories, stats, instructors, testimonials] = await Promise.all([
    getFeaturedCourses(),
    getTopCategories(),
    getStats(),
    getTopInstructors(),
    getPublishedTestimonials(),
  ])

  const allTestimonials = (testimonials.length > 0
    ? testimonials.map((t: any) => ({ ...t, initials: t.author_name?.slice(0, 2).toUpperCase() }))
    : FALLBACK_TESTIMONIALS) as any[]

  return (
    <div className="overflow-x-hidden">

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#040e24]">
        {/* Background layers */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B3D91] via-[#0c2d6b] to-[#040e24]" />
          <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-[#FFA500]/10 blur-[120px] -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[100px] translate-y-1/2 -translate-x-1/4" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-0 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left col */}
            <div>
              {/* Live ticker */}
              <div className="mb-6">
                <LiveTicker />
              </div>

              <div className="mb-3">
                <span className="text-[#FFA500] text-sm font-bold uppercase tracking-widest">
                  #1 Plateforme eLearning en Afrique francophone
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] text-white mb-6">
                Formez-vous.<br />
                <span className="relative inline-block">
                  <span className="text-[#FFA500]">Certifiez-vous.</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                    <path d="M2 8 Q75 2 150 8 Q225 14 298 8" stroke="#FFA500" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5"/>
                  </svg>
                </span><br />
                Évoluez.
              </h1>

              <p className="text-blue-200 text-lg leading-relaxed mb-10 max-w-lg">
                Des formations <strong className="text-white">professionnelles certifiantes</strong> adaptées
                au marché africain. Payez en francs CFA, apprenez à votre rythme, obtenez un certificat
                <strong className="text-white"> vérifiable et reconnu</strong>.
              </p>

              <HeroCTA />

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 mt-10">
                {[
                  { icon: BadgeCheck, text: 'Certificats vérifiables', color: 'text-green-400' },
                  { icon: Smartphone, text: 'Mobile Money', color: 'text-yellow-400' },
                  { icon: Globe, text: '18 devises', color: 'text-blue-400' },
                  { icon: Zap, text: 'Accès immédiat', color: 'text-orange-400' },
                ].map(({ icon: Icon, text, color }) => (
                  <div key={text} className="flex items-center gap-1.5 text-sm text-blue-100">
                    <Icon className={`w-4 h-4 ${color}`} />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right col — floating cards */}
            <div className="hidden lg:block relative h-[540px]">
              {/* Main card */}
              <div className="absolute top-16 left-8 right-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-[#FFA500] flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Certificat obtenu 🎉</p>
                    <p className="text-blue-300 text-xs">Management Stratégique</p>
                  </div>
                  <div className="ml-auto text-xs text-green-400 font-semibold bg-green-400/15 px-2 py-1 rounded-full">
                    Félicitations !
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Formations', value: stats.courses > 0 ? stats.courses + '+' : '184+', icon: BookOpen },
                    { label: 'Apprenants', value: stats.enrollments > 100 ? (stats.enrollments / 1000).toFixed(1) + 'k+' : '2.4k+', icon: Users },
                    { label: 'Certifiés', value: stats.certificates > 100 ? stats.certificates + '+' : '1.2k+', icon: Award },
                    { label: 'Pays', value: '12', icon: Globe },
                  ].map(s => (
                    <div key={s.label} className="bg-white/10 rounded-2xl p-3 text-center">
                      <s.icon className="w-5 h-5 text-[#FFA500] mx-auto mb-1.5" />
                      <p className="text-white font-bold text-lg">{s.value}</p>
                      <p className="text-blue-300 text-[10px]">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating mini cards */}
              <div className="absolute bottom-20 left-4 bg-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 max-w-[220px]">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Progression ce mois</p>
                  <p className="font-bold text-gray-900">+34 nouvelles inscriptions</p>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 bg-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 max-w-[210px]">
                <div className="text-2xl">⭐</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Note moyenne 4.8/5</p>
                  <div className="flex gap-0.5 mt-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`h-1.5 w-6 rounded-full ${i <= 4 ? 'bg-[#FFA500]' : 'bg-gray-200'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-blue-300 opacity-60">
          <span className="text-xs uppercase tracking-widest">Découvrir</span>
          <div className="w-5 h-8 border-2 border-current rounded-full flex justify-center pt-1.5">
            <div className="w-1 h-1.5 bg-current rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ═══════════════════ STATS BAND ═══════════════════ */}
      <section className="bg-white border-y border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { end: stats.courses > 0 ? stats.courses : 184, suffix: '+', label: 'Formations certifiantes', icon: BookOpen, color: 'bg-blue-50 text-[#0B3D91]' },
              { end: stats.enrollments > 0 ? stats.enrollments : 2400, suffix: '+', label: 'Apprenants inscrits', icon: Users, color: 'bg-green-50 text-green-600' },
              { end: stats.certificates > 0 ? stats.certificates : 1200, suffix: '+', label: 'Certificats délivrés', icon: Award, color: 'bg-orange-50 text-orange-600' },
              { end: 12, suffix: ' pays', label: 'Afrique francophone', icon: Globe, color: 'bg-purple-50 text-purple-600' },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.color} mb-1`}>
                  <s.icon className="w-6 h-6" />
                </div>
                <div className="text-3xl font-black text-gray-900">
                  <CountUp end={s.end} suffix={s.suffix} />
                </div>
                <p className="text-sm text-gray-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ CATÉGORIES ═══════════════════ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-[#0B3D91] text-sm font-bold uppercase tracking-widest mb-3 block">Nos domaines</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Explorez 25+ domaines professionnels</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Tous les secteurs porteurs du marché africain, couverts par nos experts</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.map(cat => (
              <Link key={cat.slug} href={`/catalogue?categorie=${cat.slug}`}
                className="group relative flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-gray-100 hover:border-[#0B3D91]/30 hover:shadow-lg hover:-translate-y-1.5 transition-all text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0B3D91]/0 to-[#0B3D91]/0 group-hover:from-[#0B3D91]/5 group-hover:to-blue-50/50 transition-all" />
                <span className="text-3xl relative z-10">{CATEGORY_ICONS[cat.slug] ?? '📚'}</span>
                <span className="font-semibold text-xs leading-tight text-gray-700 group-hover:text-[#0B3D91] transition-colors relative z-10">{cat.name}</span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/catalogue" className="inline-flex items-center gap-2 bg-[#0B3D91] text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-900 transition-colors">
              Voir les 25+ domaines <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FORMATIONS VEDETTES ═══════════════════ */}
      {featuredCourses.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="text-[#0B3D91] text-sm font-bold uppercase tracking-widest mb-2 block">Top formations</span>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Les plus populaires</h2>
                <p className="text-gray-500">Plébiscitées par nos apprenants à travers toute l'Afrique</p>
              </div>
              <Link href="/catalogue?featured=true" className="hidden sm:flex items-center gap-1 text-[#0B3D91] font-semibold hover:underline text-sm flex-shrink-0">
                Voir tout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
            <div className="text-center mt-8 sm:hidden">
              <Link href="/catalogue" className="inline-flex items-center gap-2 text-[#0B3D91] font-semibold text-sm">
                Voir toutes les formations <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════ RECOMMANDÉS ═══════════════════ */}
      <section className="py-8 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RecommendedCourses title="Formations populaires" />
        </div>
      </section>

      {/* ═══════════════════ COMMENT ÇA MARCHE ═══════════════════ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-[#0B3D91] text-sm font-bold uppercase tracking-widest mb-3 block">Simple & rapide</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Commencez en 3 étapes</h2>
            <p className="text-gray-500 max-w-xl mx-auto">De l'inscription à la certification, tout se passe en ligne, depuis votre téléphone</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: BookOpen,
                title: 'Choisissez votre formation',
                desc: 'Parcourez nos 184 formations certifiantes. Filtrez par domaine, niveau, durée et budget. Lisez les avis des apprenants.',
                color: 'from-blue-500 to-[#0B3D91]',
                light: 'bg-blue-50 text-[#0B3D91]',
                badge: 'Gratuit',
              },
              {
                step: '02',
                icon: CheckCircle,
                title: 'Payez en toute sécurité',
                desc: 'Orange Money, MTN Mobile Money, Wave, carte bancaire ou virement. 18 devises africaines acceptées. Garantie 7 jours.',
                color: 'from-orange-400 to-orange-600',
                light: 'bg-orange-50 text-orange-600',
                badge: 'Sécurisé',
              },
              {
                step: '03',
                icon: Award,
                title: 'Obtenez votre certificat',
                desc: 'Apprenez à votre rythme, sur mobile ou desktop. Réussissez l\'évaluation et téléchargez votre certificat vérifiable en PDF.',
                color: 'from-green-400 to-teal-600',
                light: 'bg-green-50 text-green-600',
                badge: 'Vérifiable',
              },
            ].map((item) => (
              <div key={item.step} className="relative bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 group overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-3xl bg-gradient-to-br ${item.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${item.light} flex items-center justify-center`}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${item.color} text-white`}>
                    {item.badge}
                  </span>
                </div>
                <div className="text-5xl font-black text-gray-100 mb-2">{item.step}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ CHIFFRES DU SUCCÈS ═══════════════════ */}
      <section className="py-20 bg-gradient-to-br from-[#0B3D91] to-[#040e24] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FFA500]/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-[#FFA500] text-sm font-bold uppercase tracking-widest mb-3 block">Impact réel</span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Des résultats concrets pour vos apprenants</h2>
            <p className="text-blue-200 max-w-xl mx-auto">Chaque formation IBIG E-LEARN est conçue pour transformer votre carrière et générer un ROI immédiat</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {SUCCESS_STATS.map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-6 text-center hover:bg-white/15 transition-colors">
                <s.icon className={`w-8 h-8 ${s.color} mx-auto mb-3`} />
                <div className="text-4xl font-black text-white mb-2">{s.value}</div>
                <p className="text-blue-200 text-sm">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Features grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Award, title: 'Certifications vérifiables', desc: 'QR code unique, vérifiable par tout employeur ou partenaire en temps réel.', color: 'text-yellow-400' },
              { icon: Smartphone, title: 'Mobile-first & hors-ligne', desc: 'Apprenez sur 3G. Téléchargez les cours pour les zones à faible connectivité.', color: 'text-green-400' },
              { icon: Globe, title: '18 devises africaines', desc: 'XOF, XAF, GNF, MAD, NGN, KES… Payez dans votre monnaie locale.', color: 'text-blue-400' },
              { icon: Users, title: 'Formateurs experts africains', desc: 'Praticiens reconnus, ancrés dans la réalité des marchés africains.', color: 'text-purple-400' },
              { icon: Shield, title: 'Paiements 100% sécurisés', desc: 'CinetPay SSL. Garantie satisfait ou remboursé 7 jours sans conditions.', color: 'text-red-400' },
              { icon: Target, title: 'Accès à vie au contenu', desc: 'Payez une fois, accédez pour toujours. Mises à jour incluses gratuitement.', color: 'text-orange-400' },
            ].map(item => (
              <div key={item.title} className="flex gap-4 bg-white/8 border border-white/10 rounded-2xl p-5 hover:bg-white/12 transition-colors group">
                <div className="flex-shrink-0">
                  <item.icon className={`w-6 h-6 ${item.color} mt-0.5`} />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1 text-sm">{item.title}</h3>
                  <p className="text-blue-200 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ TÉMOIGNAGES ═══════════════════ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-[#0B3D91] text-sm font-bold uppercase tracking-widest mb-3 block">Témoignages</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Ils ont transformé leur carrière</h2>
            <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-[#FFA500] fill-[#FFA500]" />)}
              </div>
              <span className="font-bold text-gray-900">4.8/5</span>
              <span>· Plus de 1 200 avis vérifiés</span>
            </div>
          </div>
          <TestimonialsCarousel testimonials={allTestimonials} />
        </div>
      </section>

      {/* ═══════════════════ PAYS — MARQUEE ═══════════════════ */}
      <section className="py-10 bg-[#0B3D91] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <p className="text-center text-blue-200 text-sm font-semibold uppercase tracking-widest">
            🌍 Disponible dans 12 pays d'Afrique francophone
          </p>
        </div>
        <CountriesMarquee />
      </section>

      {/* ═══════════════════ FORMATEURS ═══════════════════ */}
      {instructors.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-[#0B3D91] text-sm font-bold uppercase tracking-widest mb-3 block">Nos experts</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Apprenez des meilleurs</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Des praticiens reconnus dans leurs domaines, ancrés dans les réalités africaines</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {instructors.map((f: any) => (
                <Link key={f.id} href={`/formateur/${f.id}`}
                  className="group relative bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0B3D91]/0 to-[#0B3D91]/0 group-hover:from-blue-50 group-hover:to-white transition-all" />
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-[#0B3D91]/10 flex items-center justify-center text-[#0B3D91] font-bold text-2xl mx-auto mb-4 overflow-hidden ring-4 ring-gray-100 group-hover:ring-[#0B3D91]/20 transition-all">
                      {f.avatar_url
                        ? <img src={f.avatar_url} alt={f.full_name} className="w-full h-full object-cover" />
                        : f.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <p className="font-bold text-gray-900 group-hover:text-[#0B3D91] transition-colors">{f.full_name}</p>
                    {f.country && <p className="text-xs text-gray-400 mt-0.5 flex items-center justify-center gap-1"><Globe className="w-3 h-3" />{f.country}</p>}
                    {f.bio && <p className="text-xs text-gray-500 mt-3 line-clamp-2 leading-relaxed">{f.bio}</p>}
                    <div className="mt-4 inline-flex items-center gap-1 text-xs text-[#0B3D91] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Voir le profil <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/catalogue" className="inline-flex items-center gap-2 text-[#0B3D91] font-semibold hover:underline text-sm">
                Découvrir toutes nos formations <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════ CTA FINAL ═══════════════════ */}
      <section className="py-24 bg-gradient-to-br from-[#040e24] via-[#0B3D91] to-[#1558c0] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#FFA500]/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#FFA500]/20 border border-[#FFA500]/30 text-[#FFA500] rounded-full px-4 py-2 text-sm font-bold mb-8">
            <Flame className="w-4 h-4" />
            <span>{stats.courses > 0 ? stats.courses : 184}+ formations disponibles · Rejoignez {stats.enrollments > 0 ? stats.enrollments.toLocaleString('fr-FR') : '2 400'}+ apprenants</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-black mb-6 leading-tight">
            Votre carrière ne peut pas<br />
            <span className="text-[#FFA500]">attendre demain.</span>
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Des professionnels de toute l'Afrique se forment <strong className="text-white">dès aujourd'hui</strong> sur IBIG E-LEARN.
            Inscription gratuite, paiement Mobile Money, certificat en quelques semaines.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link href="/inscription"
              className="group flex items-center justify-center gap-2 bg-[#FFA500] hover:bg-orange-400 text-black font-black px-10 py-5 rounded-2xl transition-all text-base shadow-2xl shadow-orange-500/40 hover:scale-105">
              Créer mon compte gratuitement <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/catalogue"
              className="flex items-center justify-center gap-2 bg-white/10 border border-white/30 hover:bg-white/20 text-white font-semibold px-10 py-5 rounded-2xl transition-all text-base hover:scale-105">
              Explorer le catalogue
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-blue-300 text-sm">
            {[
              { icon: CheckCircle, text: 'Inscription 100% gratuite' },
              { icon: Shield, text: 'Paiement Mobile Money sécurisé' },
              { icon: BadgeCheck, text: 'Certificat vérifiable' },
              { icon: Zap, text: 'Accès immédiat après paiement' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">
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
