import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Users, Award, Globe2, ArrowRight, Star, Play, Zap, Shield, Headphones, TrendingUp, CheckCircle } from 'lucide-react'
import CourseCard from '@/components/ui/CourseCard'
import HeroSlider from '@/components/home/HeroSlider'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'IBIG E-LEARNING — Formation professionnelle en ligne en Afrique',
  description: 'La plateforme de référence pour la formation professionnelle en ligne en Afrique francophone. Plus de 179 formations certifiantes dans 12 pays. Formez-vous en marketing, finance, tech, gestion et bien plus.',
  keywords: ['formation en ligne Afrique', 'e-learning Afrique francophone', 'formation professionnelle Côte d\'Ivoire', 'certification en ligne', 'IBIG E-LEARNING', 'cours en ligne', 'formation à distance'],
  alternates: { canonical: 'https://ibig-elearning.com' },
  openGraph: {
    title: 'IBIG E-LEARNING — Formation professionnelle en ligne en Afrique',
    description: 'La plateforme de référence pour la formation professionnelle en ligne en Afrique francophone. Plus de 179 formations certifiantes.',
    url: 'https://ibig-elearning.com',
    images: [{ url: '/logo-full.webp', width: 1200, height: 630, alt: 'IBIG E-LEARNING' }],
  },
}

export default async function AccueilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Données personnalisées si connecté
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

  const stats = [
    { label: 'Formations', value: `${totalCourses ?? 179}+`, icon: BookOpen },
    { label: 'Apprenants', value: `${totalUsers ?? 5000}+`, icon: Users },
    { label: 'Certificats délivrés', value: `${totalCerts ?? 1200}+`, icon: Award },
    { label: 'Pays couverts', value: '12', icon: Globe2 },
  ]

  const avantages = [
    { icon: Play, title: 'Cours 100% en ligne', desc: 'Apprenez à votre rythme, où que vous soyez en Afrique et dans le monde.' },
    { icon: Award, title: 'Certificats reconnus', desc: 'Obtenez des certificats valorisés par les entreprises partenaires IBIG.' },
    { icon: Headphones, title: 'Support SARA 24/7', desc: 'Notre assistante IA répond à toutes vos questions pédagogiques en temps réel.' },
    { icon: Shield, title: 'Paiement sécurisé', desc: 'Orange Money, MTN, Wave, Moov et carte bancaire acceptés.' },
    { icon: Zap, title: 'Accès immédiat', desc: 'Démarrez votre formation dès la confirmation de votre inscription.' },
    { icon: TrendingUp, title: 'Progression suivie', desc: 'Tableau de bord personnel, streaks et points de fidélité pour vous motiver.' },
  ]

  const temoignages = [
    { nom: 'Aminata Koné', pays: 'Côte d\'Ivoire', role: 'DRH', text: 'IBIG E-LEARNING m\'a permis d\'obtenir ma certification en GRH en seulement 3 mois. Les cours sont adaptés à notre contexte africain.', note: 5 },
    { nom: 'Moussa Diallo', pays: 'Sénégal', role: 'Entrepreneur', text: 'J\'ai lancé mon entreprise grâce à la formation en Entrepreneuriat. L\'assistant SARA est incroyable pour répondre à mes questions.', note: 5 },
    { nom: 'Fatoumata Bah', pays: 'Guinée', role: 'Comptable', text: 'Le paiement en Mobile Money facilite l\'accès aux formations. Je recommande à tous mes collègues.', note: 5 },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://ibig-elearning.com/#organization',
        name: 'IBIG E-LEARNING',
        url: 'https://ibig-elearning.com',
        logo: { '@type': 'ImageObject', url: 'https://ibig-elearning.com/logo-full.webp' },
        description: 'La plateforme de référence pour la formation professionnelle en ligne en Afrique francophone.',
        address: { '@type': 'PostalAddress', addressLocality: 'Abidjan', addressRegion: 'Cocody Riviera Palmeraie', addressCountry: 'CI' },
        contactPoint: { '@type': 'ContactPoint', email: 'contact@ibig-elearning.com', contactType: 'customer service' },
        sameAs: ['https://www.facebook.com/ibig', 'https://www.linkedin.com/company/ibig'],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://ibig-elearning.com/#website',
        url: 'https://ibig-elearning.com',
        name: 'IBIG E-LEARNING',
        publisher: { '@id': 'https://ibig-elearning.com/#organization' },
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: 'https://ibig-elearning.com/recherche?q={search_term_string}' },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* HERO — Slider dynamique pour tous */}
      <HeroSlider featuredCourses={featuredCourses ?? []} totalEnrollments={totalUsers ?? 0} />

      {/* Bandeau de reprise pour utilisateurs connectés */}
      {user && (
        <div className="bg-[#0B3D91] text-white">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="font-semibold text-sm">Bienvenue, {userProfile?.full_name?.split(' ')[0] ?? 'Apprenant'} 👋</span>
              {(userProfile as any)?.streak_days > 0 && (
                <span className="text-xs bg-orange-500/20 border border-orange-400/30 rounded-full px-2 py-0.5 text-orange-300">
                  🔥 {(userProfile as any).streak_days} jours de suite
                </span>
              )}
            </div>
            {userEnrollments.length > 0 ? (
              <div className="flex flex-wrap gap-2 flex-1">
                {userEnrollments.slice(0, 3).map((e: any) => (
                  <Link key={(e.course as any)?.id} href={`/formation/${(e.course as any)?.slug}`}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-3 py-1.5 transition-colors text-xs">
                    <div className="w-5 h-5 rounded bg-white/20 overflow-hidden flex-shrink-0">
                      {(e.course as any)?.thumbnail_url
                        ? <img src={(e.course as any).thumbnail_url} alt="" className="w-full h-full object-cover" />
                        : <BookOpen className="w-3 h-3 text-white/50 m-auto" />}
                    </div>
                    <span className="truncate max-w-[120px]">{(e.course as any)?.title}</span>
                    <span className="text-[#FFA500] font-bold flex-shrink-0">{e.progress_percent ?? 0}%</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-blue-200 text-sm">Vous n&apos;avez pas encore de formation en cours.</p>
            )}
            <Link href="/tableau-de-bord"
              className="flex-shrink-0 flex items-center gap-1.5 bg-[#FFA500] hover:bg-orange-400 text-white font-bold px-4 py-2 rounded-xl transition-colors text-xs">
              Mon espace <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* CATÉGORIES */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Explorez par domaine</h2>
            <p className="text-gray-500">25 domaines de formation pour booster votre carrière</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {(categories ?? []).map((cat: any) => (
              <Link key={cat.id} href={`/catalogue?categorie=${cat.slug}`}
                className="flex flex-col items-center gap-2 bg-white border border-gray-200 rounded-2xl p-4 hover:border-[#0B3D91] hover:shadow-sm transition-all group">
                <span className="text-3xl">{cat.icon}</span>
                <p className="text-xs font-semibold text-gray-700 text-center leading-snug group-hover:text-[#0B3D91] transition-colors">{cat.name}</p>
              </Link>
            ))}
            <Link href="/catalogue"
              className="flex flex-col items-center gap-2 bg-[#0B3D91] rounded-2xl p-4 hover:opacity-90 transition-opacity">
              <ArrowRight className="w-8 h-8 text-white" />
              <p className="text-xs font-semibold text-white text-center">Voir tout</p>
            </Link>
          </div>
        </div>
      </section>

      {/* FORMATIONS VEDETTES */}
      {featuredCourses && featuredCourses.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Formations populaires</h2>
                <p className="text-gray-500 mt-1">Les plus suivies par nos apprenants</p>
              </div>
              <Link href="/catalogue" className="hidden sm:flex items-center gap-1.5 text-[#0B3D91] font-semibold text-sm hover:underline">
                Voir tout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredCourses.slice(0, 8).map((c: any) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
            <div className="text-center mt-8 sm:hidden">
              <Link href="/catalogue" className="inline-flex items-center gap-2 text-[#0B3D91] font-semibold">
                Voir toutes les formations <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* AVANTAGES */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Pourquoi IBIG E-LEARNING ?</h2>
            <p className="text-gray-500">Une plateforme pensée pour les professionnels africains</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {avantages.map(a => (
              <div key={a.title} className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="w-11 h-11 rounded-xl bg-[#0B3D91]/10 flex items-center justify-center mb-4">
                  <a.icon className="w-5 h-5 text-[#0B3D91]" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">{a.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Ils nous font confiance</h2>
            <p className="text-gray-500">Des milliers d'apprenants à travers l'Afrique</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {temoignages.map(t => (
              <div key={t.nom} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-4 h-4 text-[#FFA500] fill-[#FFA500]" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0B3D91] flex items-center justify-center text-white font-bold text-sm">
                    {t.nom.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.nom}</p>
                    <p className="text-xs text-gray-400">{t.role} · {t.pays}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 bg-gradient-to-r from-[#0B3D91] to-blue-700">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl lg:text-4xl font-extrabold mb-4">
            Commencez votre formation aujourd'hui
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Rejoignez plus de 5 000 professionnels qui font confiance à IBIG E-LEARNING pour leur développement de compétences.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/inscription"
              className="bg-[#FFA500] hover:bg-orange-400 text-white font-bold px-8 py-4 rounded-2xl transition-colors text-base">
              S'inscrire gratuitement
            </Link>
            <Link href="/catalogue"
              className="border-2 border-white/40 hover:border-white text-white font-semibold px-8 py-4 rounded-2xl transition-colors text-base">
              Explorer le catalogue
            </Link>
          </div>
          <div className="flex justify-center gap-8 mt-10 text-sm text-blue-200">
            {['Sans engagement', 'Paiement Mobile Money', 'Certificat inclus'].map(f => (
              <div key={f} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-400" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
