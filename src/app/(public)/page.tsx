import Link from 'next/link'
import { ArrowRight, Users, BookOpen, Award, Shield, Smartphone, Globe, CheckCircle, Play, TrendingUp, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Course, Category } from '@/types'
import CourseCard from '@/components/ui/CourseCard'
import RecommendedCourses from '@/components/ui/RecommendedCourses'
import CountUp from '@/components/ui/CountUp'

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
    .limit(6)
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

const TESTIMONIALS = [
  {
    name: 'Kouassi Ange-Brice',
    role: 'Directeur Commercial, Côte d\'Ivoire',
    text: 'IBIG E-LEARN m\'a permis de me certifier en marketing digital sans quitter Abidjan. La qualité des formateurs et les cas pratiques africains font toute la différence.',
    rating: 5,
    initials: 'KA',
    color: 'bg-blue-600',
  },
  {
    name: 'Fatou Diallo',
    role: 'Responsable RH, Sénégal',
    text: 'J\'ai obtenu ma certification GRH en 3 mois tout en travaillant à temps plein. Le paiement en Orange Money et le contenu téléchargeable m\'ont énormément facilité la vie.',
    rating: 5,
    initials: 'FD',
    color: 'bg-green-600',
  },
  {
    name: 'Moussa Traoré',
    role: 'Entrepreneur, Mali',
    text: 'La formation en comptabilité SYSCOHADA est exactement ce qu\'il me fallait pour gérer ma PME. Les formateurs connaissent les réalités du marché africain.',
    rating: 5,
    initials: 'MT',
    color: 'bg-orange-600',
  },
]

const COUNTRIES = [
  { name: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { name: 'Sénégal', flag: '🇸🇳' },
  { name: 'Cameroun', flag: '🇨🇲' },
  { name: 'Mali', flag: '🇲🇱' },
  { name: 'Burkina Faso', flag: '🇧🇫' },
  { name: 'Guinée', flag: '🇬🇳' },
  { name: 'Congo', flag: '🇨🇬' },
  { name: 'Bénin', flag: '🇧🇯' },
  { name: 'Togo', flag: '🇹🇬' },
  { name: 'Niger', flag: '🇳🇪' },
  { name: 'Gabon', flag: '🇬🇦' },
  { name: 'RD Congo', flag: '🇨🇩' },
]

export default async function HomePage() {
  const [featuredCourses, categories, stats, instructors, testimonials] = await Promise.all([
    getFeaturedCourses(),
    getTopCategories(),
    getStats(),
    getTopInstructors(),
    getPublishedTestimonials(),
  ])

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B3D91] via-[#1558c0] to-[#0B3D91] text-white">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#FFA500] blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm mb-6">
                <span className="w-2 h-2 rounded-full bg-[#FFA500] animate-pulse" />
                Plateforme panafricaine de formation en ligne
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Formez-vous,<br />
                <span className="text-[#FFA500]">Certifiez-vous</span>,<br />
                Évoluez.
              </h1>
              <p className="text-blue-100 text-lg leading-relaxed mb-8 max-w-lg">
                Des formations professionnelles certifiantes adaptées au marché africain.
                Payez en francs CFA, apprenez à votre rythme, obtenez un certificat vérifiable.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/catalogue"
                  className="flex items-center justify-center gap-2 bg-[#FFA500] hover:bg-orange-500 text-black font-semibold px-8 py-4 rounded-xl transition-colors text-base">
                  Explorer le catalogue <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/inscription"
                  className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base">
                  Commencer gratuitement
                </Link>
              </div>
              <div className="flex flex-wrap gap-6 mt-10">
                {[
                  { icon: '✅', text: 'Certificats vérifiables' },
                  { icon: '📱', text: 'Mobile-first' },
                  { icon: '💳', text: 'Mobile Money accepté' },
                  { icon: '🌍', text: '18 devises africaines' },
                ].map(item => (
                  <div key={item.text} className="flex items-center gap-2 text-sm text-blue-100">
                    <span>{item.icon}</span> {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Stats grid */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                { label: 'Apprenants inscrits', value: stats.enrollments > 0 ? `${stats.enrollments.toLocaleString('fr-FR')}+` : '2 400+', icon: Users },
                { label: 'Formations disponibles', value: `${stats.courses}+`, icon: BookOpen },
                { label: 'Certificats délivrés', value: '1 200+', icon: Award },
                { label: 'Pays couverts', value: '12', icon: Globe },
              ].map(stat => (
                <div key={stat.label} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center">
                  <stat.icon className="w-8 h-8 text-[#FFA500] mx-auto mb-2" />
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-blue-200 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section className="bg-white border-b border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { end: stats.courses, suffix: '+', label: 'Formations', icon: BookOpen },
              { end: stats.enrollments > 0 ? stats.enrollments : 2400, suffix: '+', label: 'Apprenants', icon: Users },
              { end: stats.certificates > 0 ? stats.certificates : 1200, suffix: '+', label: 'Certificats délivrés', icon: Award },
              { end: 12, suffix: '', label: 'Pays couverts', icon: Globe },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3 justify-center">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <s.icon className="w-5 h-5 text-[#0B3D91]" />
                </div>
                <div className="text-left">
                  <div className="text-xl font-bold text-gray-900">
                    <CountUp end={s.end} suffix={s.suffix} />
                  </div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATÉGORIES ── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Explorez nos domaines</h2>
            <p className="text-gray-500 max-w-xl mx-auto">25 domaines couvrant les secteurs porteurs du marché africain</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.map(cat => (
              <Link key={cat.slug} href={`/catalogue?categorie=${cat.slug}`}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-gray-100 hover:border-[#0B3D91]/40 hover:shadow-md hover:-translate-y-1 transition-all text-center group">
                <span className="text-3xl">{CATEGORY_ICONS[cat.slug] ?? '📚'}</span>
                <span className="font-medium text-xs leading-tight text-gray-700 group-hover:text-[#0B3D91] transition-colors">{cat.name}</span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/catalogue" className="inline-flex items-center gap-2 text-[#0B3D91] font-semibold hover:underline text-sm">
              Voir les 25 domaines <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FORMATIONS VEDETTES ── */}
      {featuredCourses.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Formations vedettes</h2>
                <p className="text-gray-500">Les plus populaires de notre catalogue</p>
              </div>
              <Link href="/catalogue?featured=true" className="hidden sm:flex items-center gap-1 text-[#0B3D91] font-semibold hover:underline text-sm">
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

      {/* ── RECOMMANDÉS ── */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RecommendedCourses title="Formations populaires" />
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Comment ça marche ?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Commencez à vous former en 3 étapes simples</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 relative">
            <div className="hidden sm:block absolute top-10 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-[#0B3D91]/20 via-[#FFA500] to-[#0B3D91]/20" />
            {[
              {
                step: '01',
                icon: BookOpen,
                title: 'Choisissez votre formation',
                desc: 'Parcourez notre catalogue de 184 formations certifiantes. Filtrez par domaine, niveau et budget.',
                color: 'bg-blue-50 text-[#0B3D91]',
              },
              {
                step: '02',
                icon: CheckCircle,
                title: 'Inscrivez-vous & payez',
                desc: 'Payez en Mobile Money (Orange Money, MTN, Wave), carte bancaire ou virement. 18 devises disponibles.',
                color: 'bg-orange-50 text-orange-600',
              },
              {
                step: '03',
                icon: Award,
                title: 'Obtenez votre certificat',
                desc: 'Complétez les modules à votre rythme. Réussissez l\'évaluation et obtenez votre certificat vérifiable.',
                color: 'bg-green-50 text-green-600',
              },
            ].map((item, i) => (
              <div key={item.step} className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
                <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-5`}>
                  <item.icon className="w-8 h-8" />
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#0B3D91] text-white text-xs font-bold flex items-center justify-center">
                  {item.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POURQUOI IBIG ── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Pourquoi choisir IBIG E-LEARN ?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Une plateforme conçue pour et par les Africains</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Award, title: 'Certifications vérifiables', desc: 'Chaque certificat porte un code unique vérifiable par votre employeur ou partenaire via QR code.', color: 'text-[#0B3D91] bg-blue-50' },
              { icon: Smartphone, title: 'Mobile-first & hors-ligne', desc: 'Apprenez depuis votre téléphone sur 3G. Contenu téléchargeable pour les zones à faible connectivité.', color: 'text-green-600 bg-green-50' },
              { icon: Globe, title: '18 devises africaines', desc: 'XOF, XAF, GNF, MAD, NGN, KES et bien d\'autres. Paiement Mobile Money, carte et virement.', color: 'text-orange-600 bg-orange-50' },
              { icon: Users, title: 'Formateurs experts africains', desc: 'Praticiens reconnus dans leurs domaines, ancrés dans la réalité des marchés africains.', color: 'text-purple-600 bg-purple-50' },
              { icon: Shield, title: 'Paiements 100% sécurisés', desc: 'Transactions sécurisées via CinetPay. Garantie satisfait ou remboursé 7 jours sans conditions.', color: 'text-red-600 bg-red-50' },
              { icon: Play, title: 'Accès à vie au contenu', desc: "Payez une fois, accédez pour toujours. Mises à jour incluses. Reprenez là où vous vous étiez arrêté.", color: 'text-teal-600 bg-teal-50' },
            ].map(item => (
              <div key={item.title} className="flex gap-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ── */}
      {(testimonials.length > 0 || true) && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Ils nous font confiance</h2>
              <p className="text-gray-500">Des professionnels de toute l'Afrique témoignent</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {(testimonials.length > 0 ? testimonials : TESTIMONIALS.map((t: any) => ({
                id: t.name, author_name: t.name, author_role: t.role, content: t.text,
                rating: t.rating, initials: t.initials, color: t.color
              }))).map((t: any) => (
                <div key={t.id ?? t.author_name} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-[#FFA500] fill-[#FFA500]" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed flex-1 mb-5 italic">&ldquo;{t.content ?? t.text}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className={`w-10 h-10 rounded-full ${t.color ?? 'bg-blue-600'} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                      {t.initials || (t.author_name ?? '').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{t.author_name}</p>
                      <p className="text-gray-400 text-xs">{t.author_role}{t.author_country ? `, ${t.author_country}` : ''}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PAYS COUVERTS ── */}
      <section className="py-12 bg-[#0B3D91]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-blue-200 text-sm font-medium mb-6 uppercase tracking-wider">
            Disponible dans 12 pays d'Afrique francophone
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {COUNTRIES.map(c => (
              <div key={c.name} className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-white text-sm">
                <span className="text-lg">{c.flag}</span>
                <span>{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NOS FORMATEURS ── */}
      {instructors.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Nos formateurs experts</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Des praticiens reconnus ancrés dans les réalités africaines</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {instructors.map((f: any) => (
                <Link key={f.id} href={`/formateur/${f.id}`}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center hover:shadow-md hover:border-[#0B3D91]/20 transition-all group">
                  <div className="w-16 h-16 rounded-full bg-[#0B3D91]/10 flex items-center justify-center text-[#0B3D91] font-bold text-2xl mx-auto mb-3 overflow-hidden">
                    {f.avatar_url
                      ? <img src={f.avatar_url} alt={f.full_name} className="w-full h-full object-cover" />
                      : f.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <p className="font-bold text-gray-900 group-hover:text-[#0B3D91] transition-colors">{f.full_name}</p>
                  {f.country && <p className="text-xs text-gray-400 mt-0.5">{f.country}</p>}
                  {f.bio && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{f.bio}</p>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA FINAL ── */}
      <section className="py-20 bg-gradient-to-br from-[#0B3D91] to-[#1558c0] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm mb-6">
            <TrendingUp className="w-4 h-4 text-[#FFA500]" />
            <span>Plus de {stats.courses} formations disponibles maintenant</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Prêt à transformer votre carrière ?</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers de professionnels africains qui se forment chaque jour sur IBIG E-LEARN.
            Accès immédiat après paiement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/inscription"
              className="bg-[#FFA500] hover:bg-orange-500 text-black font-bold px-10 py-4 rounded-xl transition-colors text-base">
              Créer mon compte gratuitement
            </Link>
            <Link href="/catalogue"
              className="bg-white/10 border border-white/30 hover:bg-white/20 text-white font-semibold px-10 py-4 rounded-xl transition-colors text-base">
              Voir les formations
            </Link>
          </div>
          <p className="text-blue-300 text-sm mt-6">
            Inscription gratuite · Paiement Mobile Money · Certificat vérifiable
          </p>
        </div>
      </section>
    </div>
  )
}
