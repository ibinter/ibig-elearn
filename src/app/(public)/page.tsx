import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, Users, Award, Globe2, ArrowRight, Star, Play, Zap, Shield, Headphones, TrendingUp, CheckCircle, ChevronRight, Flame, Clock, BadgeCheck, Smartphone, Lock, BarChart3, MessageSquare, Sparkles } from 'lucide-react'
import CourseCard from '@/components/ui/CourseCard'
import HeroSlider from '@/components/home/HeroSlider'
import { getT } from '@/i18n'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: { absolute: 'IBIG E-LEARNING — Formation professionnelle en ligne en Afrique' },
  description: 'La plateforme de référence pour la formation professionnelle en ligne en Afrique francophone. Des formations certifiantes, payables en Mobile Money, dans 14 pays.',
  keywords: ['formation en ligne Afrique', 'e-learning Afrique francophone', 'formation professionnelle Côte d\'Ivoire', 'certification en ligne', 'IBIG E-LEARNING'],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'IBIG E-LEARNING — Formation professionnelle en ligne en Afrique',
    description: 'La plateforme de référence pour la formation professionnelle en ligne en Afrique francophone. Des formations certifiantes, payables en Mobile Money.',
    url: '/',
    images: [{ url: '/logo-full.webp', width: 1200, height: 630, alt: 'IBIG E-LEARNING' }],
  },
}

const ETAPES = [
  { num: '01', icon: BookOpen, title: 'Choisissez votre formation', desc: 'Parcourez notre catalogue de formations certifiantes adaptées au marché africain et trouvez celle qui correspond à votre objectif.' },
  { num: '02', icon: Smartphone, title: 'Payez en Mobile Money', desc: 'Orange Money, MTN, Wave, Moov ou carte bancaire — réglez en toute sécurité dans votre monnaie locale, sans frais cachés.' },
  { num: '03', icon: Play, title: 'Apprenez à votre rythme', desc: 'Accédez à vie à vos cours en vidéo, quiz interactifs et ressources PDF depuis votre téléphone ou ordinateur.' },
  { num: '04', icon: Award, title: 'Obtenez votre certificat', desc: 'Téléchargez votre certificat vérifiable avec QR code, reconnu par les entreprises partenaires dans 14 pays africains.' },
]

const AVANTAGES = [
  { icon: BadgeCheck, title: 'Certifications reconnues', desc: 'Chaque certificat porte un QR code unique vérifiable en ligne par les employeurs et partenaires IBIG dans 14 pays.', color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
  { icon: Smartphone, title: 'Mobile Money accepté', desc: 'Orange Money, MTN Mobile Money, Wave, Moov Money et carte bancaire. Payez comme vous voulez, en FCFA.', color: 'text-orange-500', bg: 'bg-orange-50 border-orange-100' },
  { icon: Zap, title: 'Accès immédiat', desc: 'Votre formation s\'ouvre dès la confirmation de paiement. Commencez dans les 2 minutes qui suivent.', color: 'text-yellow-500', bg: 'bg-yellow-50 border-yellow-100' },
  { icon: Headphones, title: 'Assistante SARA 24/7', desc: 'Notre IA pédagogique répond à toutes vos questions de cours à n\'importe quelle heure, en français.', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
  { icon: Globe2, title: 'Contenu 100% africain', desc: 'Des exemples, des cas pratiques et des formateurs issus du contexte africain — pour des compétences directement applicables.', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
  { icon: BarChart3, title: 'Suivi de progression', desc: 'Tableau de bord personnel, streaks quotidiens, points de fidélité et badges — restez motivé jusqu\'au certificat.', color: 'text-teal-600', bg: 'bg-teal-50 border-teal-100' },
]

const TEMOIGNAGES = [
  {
    nom: 'Aminata Koné', pays: 'Côte d\'Ivoire 🇨🇮', role: 'Directrice RH, PME Abidjan',
    text: 'J\'ai obtenu ma certification GRH en 3 mois tout en travaillant à temps plein. Les cours sont réellement adaptés à notre contexte africain — les exemples parlent de nos entreprises, pas de multinationales américaines.',
    note: 5, formation: 'Gestion des Ressources Humaines',
  },
  {
    nom: 'Moussa Diallo', pays: 'Sénégal 🇸🇳', role: 'Fondateur, startup Dakar',
    text: 'La formation Entrepreneuriat m\'a donné les outils concrets pour structurer mon business plan. En 6 mois, j\'avais levé mes premiers fonds. L\'assistante SARA est un vrai plus — disponible à 2h du matin quand j\'avais des questions.',
    note: 5, formation: 'Entrepreneuriat & Business',
  },
  {
    nom: 'Fatoumata Bah', pays: 'Guinée 🇬🇳', role: 'Chef comptable',
    text: 'Le paiement en Mobile Money a tout changé pour moi. J\'ai pu m\'inscrire sans carte bancaire. La formation SYSCOHADA est la meilleure que j\'ai trouvée en ligne — mes collègues m\'ont déjà demandé le lien.',
    note: 5, formation: 'Comptabilité SYSCOHADA',
  },
  {
    nom: 'Kofi Mensah', pays: 'Ghana 🇬🇭', role: 'Marketing Manager',
    text: 'J\'étais sceptique au départ, mais la qualité des vidéos et des formateurs m\'a convaincu dès le premier module. J\'ai mis mes nouvelles compétences en pratique immédiatement et j\'ai été promu 4 mois après.',
    note: 5, formation: 'Marketing Digital pour PME Africaines',
  },
]

const DOMAINES_PHARES = [
  { emoji: '📊', nom: 'Comptabilité & Finance', nb: 3, slug: 'finance' },
  { emoji: '📱', nom: 'Marketing Digital', nb: 2, slug: 'marketing' },
  { emoji: '🤖', nom: 'Intelligence Artificielle', nb: 2, slug: 'ia' },
  { emoji: '👥', nom: 'Management & RH', nb: 2, slug: 'management' },
  { emoji: '💼', nom: 'Entrepreneuriat', nb: 1, slug: 'entrepreneuriat' },
  { emoji: '🛒', nom: 'E-Commerce', nb: 1, slug: 'ecommerce' },
]

const PAYS = ['🇨🇮 Côte d\'Ivoire', '🇸🇳 Sénégal', '🇨🇲 Cameroun', '🇲🇱 Mali', '🇧🇫 Burkina Faso', '🇬🇳 Guinée', '🇹🇬 Togo', '🇧🇯 Bénin', '🇨🇩 RD Congo', '🇨🇬 Congo-Brazzaville', '🇲🇦 Maroc', '🇬🇦 Gabon', '🇳🇪 Niger', '🇹🇩 Tchad']

export default async function AccueilPage() {
  const t = await getT()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userProfile = null
  let userEnrollments: any[] = []
  if (user) {
    const [{ data: profile }, { data: enrolls }] = await Promise.all([
      supabase.from('profiles').select('full_name, streak_days, total_points').eq('id', user.id).single(),
      supabase.from('enrollments')
        .select('progress_percent, course:courses(id, title, slug, thumbnail_url)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('last_accessed_at', { ascending: false, nullsFirst: false })
        .limit(3),
    ])
    userProfile = profile
    userEnrollments = enrolls ?? []
  }

  const [
    { data: featuredCourses },
    { data: categories },
    { count: totalCourses },
    { count: totalUsers },
    { count: totalCerts },
  ] = await Promise.all([
    supabase.from('courses')
      .select('*, instructor:profiles(full_name, avatar_url), category:categories(name, slug)')
      .eq('is_published', true)
      .eq('is_featured', true)
      .order('enrollment_count', { ascending: false })
      .limit(8),
    supabase.from('categories')
      .select('id, name, slug, icon, description')
      .order('name')
      .limit(12),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('certificates').select('*', { count: 'exact', head: true }),
  ])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'IBIG E-LEARNING',
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo-full.webp` },
        description: 'La plateforme de référence pour la formation professionnelle en ligne en Afrique francophone.',
        address: { '@type': 'PostalAddress', addressLocality: 'Abidjan', addressCountry: 'CI' },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'IBIG E-LEARNING',
        inLanguage: 'fr',
        publisher: { '@id': `${SITE_URL}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/recherche?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ══ HERO SLIDER ══ */}
      <HeroSlider featuredCourses={featuredCourses ?? []} totalEnrollments={totalUsers ?? 0} />

      {/* ══ BANDEAU REPRISE (connectés) ══ */}
      {user && (
        <div className="bg-[#0B3D91] text-white border-b border-blue-800">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="font-semibold text-sm">{t.home.hello}, {userProfile?.full_name?.split(' ')[0] ?? 'Apprenant'} 👋</span>
              {(userProfile as any)?.streak_days > 0 && (
                <span className="text-xs bg-orange-500/20 border border-orange-400/30 rounded-full px-2 py-0.5 text-orange-300 flex items-center gap-1">
                  <Flame className="w-3 h-3" />{(userProfile as any).streak_days} jours
                </span>
              )}
            </div>
            {userEnrollments.length > 0 ? (
              <div className="flex flex-wrap gap-2 flex-1">
                {userEnrollments.slice(0, 3).map((e: any) => (
                  <Link key={(e.course as any)?.id} href={`/formation/${(e.course as any)?.slug}`}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-1.5 transition-colors text-xs">
                    <span className="truncate max-w-[110px]">{(e.course as any)?.title}</span>
                    <span className="text-[#FFA500] font-bold flex-shrink-0">{e.progress_percent ?? 0}%</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-blue-200 text-sm flex-1">{t.home.noFormationInProgress}</p>
            )}
            <Link href="/tableau-de-bord"
              className="flex-shrink-0 flex items-center gap-1.5 bg-[#FFA500] hover:bg-orange-400 text-black font-bold px-4 py-2 rounded-lg transition-colors text-xs">
              {t.home.mySpace} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ══ BANDE STATS ══ */}
      <div className="bg-[#0B3D91] text-white">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { value: `${totalCourses ?? 10}+`, label: t.home.statsAvailable, icon: BookOpen, sub: t.home.statsIn8 },
            { value: `${totalUsers ?? 200}+`, label: t.home.statsActive, icon: Users, sub: t.home.statsIn12 },
            { value: totalCerts && totalCerts > 0 ? `${totalCerts}+` : 'QR certifié', label: t.home.statsCertsDelivered, icon: Award, sub: t.home.statsVerifiable },
            { value: '14', label: t.home.statsCountriesCovered, icon: Globe2, sub: t.home.statsFrancophone },
          ].map(s => (
            <div key={s.label} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <s.icon className="w-5 h-5 text-[#FFA500]" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-sm font-semibold text-white/90">{s.label}</p>
                <p className="text-xs text-blue-300">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ DOMAINES ══ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[#FFA500] font-bold text-sm uppercase tracking-widest mb-1">{t.home.categoriesTitle}</p>
              <h2 className="text-2xl lg:text-3xl font-black text-gray-900">{t.home.domainsTitle}</h2>
              <p className="text-gray-500 mt-1">{t.home.domainsSubtitle}</p>
            </div>
            <Link href="/catalogue" className="hidden sm:flex items-center gap-1.5 text-[#0B3D91] font-semibold text-sm hover:underline">
              {t.home.seeAll} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
            {(categories ?? []).slice(0, 11).map((cat: any) => (
              <Link key={cat.id} href={`/catalogue?categorie=${cat.slug}`}
                className="group flex flex-col items-center gap-2.5 bg-white border border-gray-200 rounded-2xl p-4 hover:border-[#0B3D91] hover:shadow-md transition-all duration-200">
                <span className="text-3xl">{cat.icon}</span>
                <p className="text-xs font-semibold text-gray-700 text-center leading-snug group-hover:text-[#0B3D91] transition-colors">{cat.name}</p>
              </Link>
            ))}
            <Link href="/catalogue"
              className="flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#0B3D91] to-blue-700 rounded-2xl p-4 hover:opacity-90 transition-opacity">
              <ArrowRight className="w-7 h-7 text-white" />
              <p className="text-xs font-bold text-white text-center">Voir tout</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FORMATIONS POPULAIRES ══ */}
      {featuredCourses && featuredCourses.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[#FFA500] font-bold text-sm uppercase tracking-widest mb-1">{t.home.whyTitle}</p>
                <h2 className="text-2xl lg:text-3xl font-black text-gray-900">{t.home.popularTitle}</h2>
                <p className="text-gray-500 mt-1">{t.home.popularSubtitle}</p>
              </div>
              <Link href="/catalogue" className="hidden sm:flex items-center gap-1.5 text-[#0B3D91] font-semibold text-sm hover:underline">
                {t.home.seeCatalog} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Badge tendance sur la 1re formation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredCourses.slice(0, 8).map((c: any, i) => (
                <div key={c.id} className="relative">
                  {i === 0 && (
                    <div className="absolute -top-2.5 left-3 z-10">
                      <span className="inline-flex items-center gap-1 bg-[#FFA500] text-black text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                        <Flame className="w-3 h-3" /> {t.home.trend}
                      </span>
                    </div>
                  )}
                  <CourseCard course={c} />
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link href="/catalogue"
                className="inline-flex items-center gap-2 bg-[#0B3D91] hover:bg-blue-800 text-white font-bold px-8 py-4 rounded-2xl transition-colors">
                {t.home.allCourses} <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-xs text-gray-400 mt-3">{t.home.noEngagement} · {t.home.immediateAccess} · {t.home.mobileMoney}</p>
            </div>
          </div>
        </section>
      )}

      {/* ══ COMMENT ÇA MARCHE ══ */}
      <section className="py-10 md:py-20 bg-gradient-to-br from-[#0B1E4B] to-[#0B3D91] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-[#FFA500] font-bold text-sm uppercase tracking-widest mb-2">Simple & rapide</p>
            <h2 className="text-2xl lg:text-3xl font-black mb-3">{t.home.howTitle}</h2>
            <p className="text-blue-200 max-w-xl mx-auto">{t.home.howSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ETAPES.map((e, i) => (
              <div key={e.num} className="relative">
                {i < ETAPES.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-white/10 z-0" style={{ width: 'calc(100% - 2rem)', left: '50%' }} />
                )}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl font-black text-[#FFA500]/30">{e.num}</span>
                    <div className="w-10 h-10 rounded-xl bg-[#FFA500]/15 border border-[#FFA500]/25 flex items-center justify-center">
                      <e.icon className="w-5 h-5 text-[#FFA500]" />
                    </div>
                  </div>
                  <h3 className="font-bold text-white mb-2">{e.title}</h3>
                  <p className="text-sm text-blue-200 leading-relaxed">{e.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/inscription"
              className="inline-flex items-center gap-2 bg-[#FFA500] hover:bg-orange-400 text-black font-black px-8 py-4 rounded-full transition-colors text-sm shadow-lg hover:shadow-xl">
              <Sparkles className="w-4 h-4" />
              {t.home.startNow}
            </Link>
          </div>
        </div>
      </section>

      {/* ══ POURQUOI IBIG ══ */}
      <section className="py-10 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-[#FFA500] font-bold text-sm uppercase tracking-widest mb-2">Notre différence</p>
            <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-3">{t.home.whyTitle}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{t.home.whySub}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {AVANTAGES.map(a => (
              <div key={a.title} className={`bg-white rounded-2xl border p-6 hover:shadow-md transition-shadow ${a.bg}`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-white/80`}>
                  <a.icon className={`w-5 h-5 ${a.color}`} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{a.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>

          {/* Bande pays */}
          <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe2 className="w-5 h-5 text-[#0B3D91]" />
              <h3 className="font-bold text-gray-900">{t.home.countriesTitle}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {PAYS.map(p => (
                <span key={p} className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ TÉMOIGNAGES ══ */}
      <section className="py-10 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-[#FFA500] font-bold text-sm uppercase tracking-widest mb-2">Ils ont transformé leur carrière</p>
            <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-3">{t.home.testimonialsTitle}</h2>
            <div className="flex items-center justify-center gap-2">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-[#FFA500] text-[#FFA500]" />)}
              </div>
              <span className="font-bold text-gray-900">4.8/5</span>
              <span className="text-gray-400 text-sm">· Note moyenne sur toutes nos formations</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {TEMOIGNAGES.map(t => (
              <div key={t.nom} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col">
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-[#FFA500] text-[#FFA500]" />)}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4 flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0B3D91] to-blue-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                      {t.nom.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{t.nom}</p>
                      <p className="text-xs text-gray-400">{t.role}</p>
                      <p className="text-xs text-gray-400">{t.pays}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3 text-[#0B3D91]" />
                    <span className="text-[10px] text-[#0B3D91] font-semibold truncate">{t.formation}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CERTIFICAT SHOWCASE ══ */}
      <section className="py-10 md:py-20 bg-gradient-to-br from-gray-900 to-[#0B1E4B]">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <p className="text-[#FFA500] font-bold text-sm uppercase tracking-widest mb-3">Valorisez votre expertise</p>
            <h2 className="text-2xl lg:text-3xl font-black mb-5">{t.home.certTitle}</h2>
            <div className="space-y-4 mb-8">
              {[
                { icon: BadgeCheck, text: 'QR code unique — vérifiable instantanément par tout employeur', color: 'text-green-400' },
                { icon: Globe2, text: 'Reconnu dans 14 pays d\'Afrique francophone', color: 'text-blue-400' },
                { icon: Lock, text: 'Sécurisé et infalsifiable — chaque certificat a un identifiant unique', color: 'text-purple-400' },
                { icon: Award, text: 'Téléchargeable en PDF haute définition, prêt à imprimer', color: 'text-yellow-400' },
              ].map(item => (
                <div key={item.text} className="flex items-start gap-3">
                  <item.icon className={`w-5 h-5 ${item.color} flex-shrink-0 mt-0.5`} />
                  <p className="text-white/80 text-sm">{item.text}</p>
                </div>
              ))}
            </div>
            <Link href="/certifications"
              className="inline-flex items-center gap-2 bg-[#FFA500] hover:bg-orange-400 text-black font-black px-6 py-3 rounded-xl transition-colors text-sm">
              {t.home.certCta} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mockup certificat */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-[#FFA500]/20 text-center relative">
                <div className="absolute top-3 right-3">
                  <BadgeCheck className="w-7 h-7 text-[#0B3D91]" />
                </div>
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl overflow-hidden bg-[#0B3D91] flex items-center justify-center">
                  <span className="text-white font-black text-xl">IBIG</span>
                </div>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Certificat de Réussite</p>
                <p className="font-bold text-gray-900 text-lg mb-1">Aminata Koné</p>
                <p className="text-xs text-gray-500 mb-4">a complété avec succès la formation</p>
                <div className="bg-[#0B3D91]/5 border border-[#0B3D91]/15 rounded-xl py-3 px-4 mb-5">
                  <p className="font-black text-[#0B3D91] text-sm">Gestion des Ressources Humaines</p>
                  <p className="text-xs text-gray-400 mt-0.5">Score final : 91% · 40h de formation</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400">Délivré le</p>
                    <p className="text-xs font-bold text-gray-700">15 Sept. 2026</p>
                  </div>
                  <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-0.5">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-sm ${i % 3 === 0 ? 'bg-gray-900' : 'bg-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[9px] text-[#0B3D91] mt-3 font-mono">ID: IBIG-2026-GRH-0047 · ibig-elearning.com/verify</p>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-green-500 text-white rounded-2xl shadow-xl px-4 py-2.5 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-bold">Certificat vérifié ✓</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ ASSISTANT SARA ══ */}
      <section className="py-10 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Mockup chat SARA */}
          <div className="order-2 lg:order-1">
            <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden max-w-sm mx-auto lg:mx-0 shadow-lg">
              <div className="bg-[#0B3D91] px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFA500] flex items-center justify-center">
                  <span className="text-black font-black text-sm">S</span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">SARA</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <p className="text-blue-200 text-xs">Assistante pédagogique IA · En ligne</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-end">
                  <div className="bg-[#0B3D91] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] text-sm">
                    Je ne comprends pas la différence entre le bilan et le compte de résultat 😕
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#FFA500] flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-black font-black text-[10px]">S</span>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] text-sm text-gray-700 shadow-sm">
                    Excellente question ! 🎯 <br /><br />
                    Le <strong>bilan</strong> est une photo de votre entreprise à un instant T — ce qu&apos;elle possède (actif) et ce qu&apos;elle doit (passif).<br /><br />
                    Le <strong>compte de résultat</strong> est un film sur une période — vos recettes moins vos charges = votre bénéfice ou perte.
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-[#0B3D91] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] text-sm">
                    Merci, c&apos;est beaucoup plus clair ! 🙏
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#FFA500] flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-black font-black text-[10px]">S</span>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3 py-2 max-w-[85%] shadow-sm">
                    <div className="flex gap-1">
                      {[1,2,3].map(i => (
                        <span key={i} className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
                  <span className="text-xs text-gray-400 flex-1">Posez votre question...</span>
                  <MessageSquare className="w-4 h-4 text-[#0B3D91]" />
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-[#FFA500] font-bold text-sm uppercase tracking-widest mb-3">Votre tuteur personnel</p>
            <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-4">{t.home.saraTitle}</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">{t.home.saraSub}</p>
            <div className="space-y-3 mb-8">
              {[
                'Explications claires en français à toute heure',
                'Exemples issus du contexte économique africain',
                'Aide pour les exercices et quiz sans donner les réponses',
                'Recommandations de ressources complémentaires',
              ].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
            <Link href="/inscription"
              className="inline-flex items-center gap-2 border-2 border-[#0B3D91] text-[#0B3D91] hover:bg-[#0B3D91] hover:text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
              {t.home.saraCta} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ══ */}
      <section className="py-10 md:py-20 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #020b1a 0%, #0B3D91 60%, #1a56cc 100%)' }}>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: '#FFA500' }} />

        <div className="relative max-w-3xl mx-auto px-4 text-center text-white">
          <p className="text-[#FFA500] font-bold text-sm uppercase tracking-widest mb-4">Rejoignez-nous maintenant</p>
          <h2 className="text-3xl lg:text-4xl font-black mb-5 leading-tight">
            {t.home.finalCtaTitle}<br />
            <span style={{ background: 'linear-gradient(90deg, #FFA500, #FFD700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {t.home.finalCtaAccent}
            </span>
          </h2>
          <p className="text-blue-100 mb-8 text-base max-w-xl mx-auto leading-relaxed">
            {t.home.finalCtaSub}
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Link href="/inscription"
              className="flex items-center gap-2 bg-[#FFA500] hover:bg-orange-400 text-black font-black px-8 py-4 rounded-full transition-all hover:scale-105 shadow-lg text-base">
              <Sparkles className="w-5 h-5" />
              {t.home.ctaStart}
            </Link>
            <Link href="/catalogue"
              className="flex items-center gap-2 border-2 border-white/30 hover:border-white text-white font-bold px-8 py-4 rounded-full transition-colors text-base">
              {t.home.ctaExplore}
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-blue-200">
            {[
              { icon: CheckCircle, text: 'Sans engagement' },
              { icon: Smartphone, text: 'Paiement Mobile Money' },
              { icon: Award, text: 'Certificat inclus' },
              { icon: Clock, text: 'Accès immédiat' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-1.5">
                <f.icon className="w-4 h-4 text-green-400" />
                {f.text}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
