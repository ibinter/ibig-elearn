import Link from 'next/link'
import { ArrowRight, CheckCircle, Star, Users, BookOpen, Award, Shield, Smartphone, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Course } from '@/types'
import { formatPrice } from '@/lib/utils'

async function getFeaturedCourses(): Promise<Course[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('*, instructor:profiles(full_name, avatar_url), category:categories(name, slug)')
    .eq('is_published', true)
    .eq('is_featured', true)
    .order('enrollment_count', { ascending: false })
    .limit(6)
  return (data as Course[]) ?? []
}

async function getStats() {
  const supabase = await createClient()
  const [{ count: courses }, { count: enrollments }] = await Promise.all([
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }),
  ])
  return { courses: courses ?? 0, enrollments: enrollments ?? 0 }
}

const categories = [
  { name: 'Formation professionnelle', slug: 'formation-professionnelle', icon: '🎓', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { name: 'Numérique & Informatique', slug: 'numerique-informatique', icon: '💻', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { name: 'Immobilier & Foncier', slug: 'immobilier-foncier', icon: '🏗️', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { name: 'BTP & Travaux publics', slug: 'btp-travaux-publics', icon: '🏛️', color: 'bg-red-50 border-red-200 text-red-700' },
  { name: 'Commerce & E-commerce', slug: 'commerce-ecommerce', icon: '🛒', color: 'bg-green-50 border-green-200 text-green-700' },
  { name: 'Gestion & Entrepreneuriat', slug: 'gestion-entrepreneuriat', icon: '📈', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
]

export default async function HomePage() {
  const [featuredCourses, stats] = await Promise.all([getFeaturedCourses(), getStats()])

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B3D91] via-[#1558c0] to-[#0B3D91] text-white">
        <div className="absolute inset-0 opacity-10">
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
                Des formations professionnelles certifiantes adaptées au marché africain. Payez en francs CFA, apprenez à votre rythme, obtenez un certificat vérifiable.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/catalogue" className="flex items-center justify-center gap-2 bg-[#FFA500] hover:bg-orange-500 text-black font-semibold px-8 py-4 rounded-xl transition-colors text-base">
                  Explorer le catalogue <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/inscription" className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base">
                  Commencer gratuitement
                </Link>
              </div>
              <div className="flex flex-wrap gap-6 mt-10">
                {[
                  { icon: '✅', text: 'Certificats vérifiables' },
                  { icon: '📱', text: 'Mobile-first' },
                  { icon: '💳', text: 'Paiement Mobile Money' },
                ].map(item => (
                  <div key={item.text} className="flex items-center gap-2 text-sm text-blue-100">
                    <span>{item.icon}</span> {item.text}
                  </div>
                ))}
              </div>
            </div>
            {/* Stats card */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                { label: 'Apprenants inscrits', value: `${stats.enrollments.toLocaleString('fr-FR')}+`, icon: Users },
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

      {/* CATÉGORIES */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Explorez nos domaines</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Des formations couvrant les secteurs porteurs du marché africain</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(cat => (
              <Link key={cat.slug} href={`/catalogue?categorie=${cat.slug}`}
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 ${cat.color} hover:scale-105 transition-transform text-center`}>
                <span className="text-3xl">{cat.icon}</span>
                <span className="font-medium text-sm leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FORMATIONS VEDETTES */}
      {featuredCourses.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Formations vedettes</h2>
                <p className="text-gray-500">Les formations les plus populaires sur la plateforme</p>
              </div>
              <Link href="/catalogue?featured=true" className="hidden sm:flex items-center gap-1 text-[#0B3D91] font-semibold hover:underline">
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

      {/* POURQUOI IBIG E-LEARN */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Pourquoi choisir IBIG E-LEARN ?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Une plateforme conçue pour et par les Africains, avec une compréhension profonde de vos défis</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Award, title: 'Certifications vérifiables', desc: 'Chaque certificat porte un code unique vérifiable publiquement par votre employeur ou partenaire.', color: 'text-[#0B3D91]' },
              { icon: Smartphone, title: 'Mobile-first & Hors-ligne', desc: 'Apprenez depuis votre téléphone même sur une connexion 3G lente. Contenu téléchargeable pour le hors-ligne.', color: 'text-green-600' },
              { icon: Globe, title: 'Multi-devise & Multi-pays', desc: 'Payez en XOF, XAF, EUR ou USD. Orange Money, MTN Money, Wave et carte bancaire acceptés.', color: 'text-[#FFA500]' },
              { icon: Users, title: 'Formateurs experts', desc: 'Nos formateurs sont des praticiens reconnus dans leurs domaines, ancrés dans la réalité africaine.', color: 'text-purple-600' },
              { icon: Shield, title: 'Paiements sécurisés', desc: 'Transactions 100% sécurisées via CinetPay. Garantie satisfait ou remboursé 7 jours.', color: 'text-red-600' },
              { icon: BookOpen, title: 'Parcours adaptatifs', desc: "L'assistant IA SARA vous accompagne tout au long de votre formation et adapte les ressources à votre niveau.", color: 'text-blue-600' },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <item.icon className={`w-10 h-10 ${item.color} mb-4`} />
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 ibig-gradient text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Prêt à transformer votre carrière ?</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers de professionnels africains qui se forment chaque jour sur IBIG E-LEARN.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/inscription" className="bg-[#FFA500] hover:bg-orange-500 text-black font-bold px-10 py-4 rounded-xl transition-colors text-base">
              Créer mon compte gratuitement
            </Link>
            <Link href="/catalogue" className="bg-white/10 border border-white/30 hover:bg-white/20 text-white font-semibold px-10 py-4 rounded-xl transition-colors text-base">
              Voir les formations
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function CourseCard({ course }: { course: Course }) {
  const levelLabel: Record<string, string> = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' }
  const levelColor: Record<string, string> = { debutant: 'bg-green-100 text-green-700', intermediaire: 'bg-yellow-100 text-yellow-700', avance: 'bg-red-100 text-red-700' }

  return (
    <Link href={`/formation/${course.slug}`} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col">
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full ibig-gradient flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-white/50" />
          </div>
        )}
        {course.is_featured && (
          <span className="absolute top-3 left-3 bg-[#FFA500] text-black text-xs font-bold px-2 py-1 rounded-full">⭐ Vedette</span>
        )}
        <span className={`absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded-full ${levelColor[course.level]}`}>
          {levelLabel[course.level]}
        </span>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs font-medium text-[#0B3D91] mb-1">{(course.category as any)?.name}</p>
        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-[#0B3D91] transition-colors">{course.title}</h3>
        <p className="text-gray-500 text-xs mb-3 line-clamp-2 flex-1">{course.short_description}</p>
        <div className="flex items-center gap-1 mb-3">
          <Star className="w-4 h-4 text-[#FFA500] fill-[#FFA500]" />
          <span className="text-sm font-semibold text-gray-900">{course.rating_average.toFixed(1)}</span>
          <span className="text-xs text-gray-400">({course.rating_count})</span>
          <span className="text-gray-300 mx-1">·</span>
          <Users className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500">{course.enrollment_count.toLocaleString('fr-FR')}</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-lg font-bold text-[#0B3D91]">{formatPrice(course.price_xof, 'XOF')}</span>
            {course.price_eur && <span className="text-xs text-gray-400 ml-1">≈ {formatPrice(course.price_eur, 'EUR')}</span>}
          </div>
          <span className="text-xs text-gray-500">{course.duration_hours}h</span>
        </div>
      </div>
    </Link>
  )
}
