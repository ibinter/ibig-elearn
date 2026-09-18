import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Users, Award, Globe2, ArrowRight, Star, Play, Zap, Shield, Headphones, TrendingUp, CheckCircle } from 'lucide-react'
import CourseCard from '@/components/ui/CourseCard'

export const revalidate = 3600

export default async function AccueilPage() {
  const supabase = await createClient()

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
    { nom: 'Aminata Koné', pays: 'Côte d\'Ivoire', role: 'DRH', text: 'IBIG E-LEARN m\'a permis d\'obtenir ma certification en GRH en seulement 3 mois. Les cours sont adaptés à notre contexte africain.', note: 5 },
    { nom: 'Moussa Diallo', pays: 'Sénégal', role: 'Entrepreneur', text: 'J\'ai lancé mon entreprise grâce à la formation en Entrepreneuriat. L\'assistant SARA est incroyable pour répondre à mes questions.', note: 5 },
    { nom: 'Fatoumata Bah', pays: 'Guinée', role: 'Comptable', text: 'Le paiement en Mobile Money facilite l\'accès aux formations. Je recommande à tous mes collègues.', note: 5 },
  ]

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0B3D91] text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B3D91] via-[#0B3D91] to-blue-800" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #FFA500 0%, transparent 50%), radial-gradient(circle at 80% 20%, #00A86B 0%, transparent 50%)' }} />

        <div className="relative max-w-6xl mx-auto px-4 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              La plateforme eLearning panafricaine
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
              Formez-vous avec les
              <span className="text-[#FFA500]"> meilleurs experts </span>
              d'Afrique
            </h1>
            <p className="text-blue-100 text-lg mb-8 leading-relaxed">
              IBIG E-LEARN vous donne accès à plus de 179 formations professionnelles certifiantes, conçues pour le marché africain, accessibles depuis votre téléphone.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              <Link href="/catalogue"
                className="flex items-center gap-2 bg-[#FFA500] hover:bg-orange-400 text-white font-bold px-6 py-3.5 rounded-2xl transition-colors text-sm">
                Explorer les formations <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/inscription"
                className="flex items-center gap-2 border-2 border-white/30 hover:border-white text-white font-semibold px-6 py-3.5 rounded-2xl transition-colors text-sm">
                Commencer gratuitement
              </Link>
            </div>
            <div className="flex flex-wrap gap-6">
              {stats.map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <s.icon className="w-4 h-4 text-[#FFA500]" />
                  <div>
                    <p className="font-bold text-lg leading-none">{s.value}</p>
                    <p className="text-xs text-blue-200">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-4">
            {(featuredCourses ?? []).slice(0, 4).map((c: any) => (
              <Link key={c.id} href={`/formation/${c.slug}`}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-colors">
                <div className="w-full aspect-video rounded-xl bg-white/10 overflow-hidden mb-3">
                  {c.thumbnail_url
                    ? <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-white/30" /></div>}
                </div>
                <p className="text-sm font-semibold line-clamp-2 leading-snug">{c.title}</p>
                <p className="text-xs text-blue-200 mt-1">{c.instructor?.full_name}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Vague bas */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gray-50" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

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
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Pourquoi IBIG E-LEARN ?</h2>
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
            Rejoignez plus de 5 000 professionnels qui font confiance à IBIG E-LEARN pour leur développement de compétences.
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
