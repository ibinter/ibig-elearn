import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, Clock, Star, Target, ChevronRight, Award } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Parcours de formation — IBIG E-LEARN',
  description: 'Des séquences de formations organisées par experts pour vous emmener du débutant à l\'expert dans votre domaine.',
}

export const revalidate = 300

const levelLabel: Record<string, string> = {
  debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé', tous_niveaux: 'Tous niveaux'
}
const levelColor: Record<string, string> = {
  debutant: 'bg-green-100 text-green-700',
  intermediaire: 'bg-yellow-100 text-yellow-700',
  avance: 'bg-red-100 text-red-700',
  tous_niveaux: 'bg-blue-100 text-blue-700',
}

export default async function ParcoursPage() {
  const supabase = await createClient()

  const { data: paths } = await supabase
    .from('learning_paths')
    .select('*, courses:learning_path_courses(count)')
    .eq('is_published', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  const featured = (paths ?? []).filter(p => p.is_featured)
  const others = (paths ?? []).filter(p => !p.is_featured)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-[#0B3D91] border border-blue-100 rounded-full px-4 py-1.5 text-sm font-semibold mb-5">
          <Target className="w-4 h-4" /> Parcours guidés
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-5">
          Progressez étape par étape<br />
          <span className="text-[#0B3D91]">vers l'expertise</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Nos experts ont conçu des parcours complets pour vous guider du niveau débutant à expert dans chaque domaine. Des formations organisées, dans le bon ordre.
        </p>
      </div>

      {/* Avantages */}
      <div className="grid sm:grid-cols-3 gap-5 mb-16">
        {[
          { icon: Target, title: 'Objectif clair', desc: 'Chaque parcours a un objectif précis : un métier, une compétence, une certification.' },
          { icon: BookOpen, title: 'Formations organisées', desc: 'Les formations sont dans l\'ordre optimal pour une progression logique et efficace.' },
          { icon: Award, title: 'Certificat de parcours', desc: 'À la fin du parcours, obtenez un certificat reconnu qui atteste de vos compétences.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <div className="w-12 h-12 ibig-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {paths && paths.length > 0 ? (
        <>
          {/* Parcours en vedette */}
          {featured.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Star className="w-5 h-5 text-[#FFA500] fill-[#FFA500]" /> Parcours recommandés
              </h2>
              <div className="grid lg:grid-cols-2 gap-6">
                {featured.map(path => (
                  <PathCard key={path.id} path={path} featured />
                ))}
              </div>
            </section>
          )}

          {/* Tous les parcours */}
          {others.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Tous les parcours</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {others.map(path => (
                  <PathCard key={path.id} path={path} />
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-20 h-20 ibig-gradient rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Parcours bientôt disponibles</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            Nos experts sont en train de concevoir des parcours de formation adaptés aux professionnels africains. Revenez bientôt !
          </p>
          <Link href="/catalogue"
            className="inline-flex items-center gap-2 ibig-gradient text-white font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity">
            Explorer le catalogue <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}

function PathCard({ path, featured = false }: { path: any; featured?: boolean }) {
  const courseCount = path.courses?.[0]?.count ?? 0
  const level = path.level ?? 'tous_niveaux'

  return (
    <Link href={`/parcours/${path.slug}`}
      className={`group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col ${featured ? 'lg:flex-row' : ''}`}>
      {/* Thumbnail */}
      <div className={`relative overflow-hidden bg-gray-100 flex-shrink-0 ${featured ? 'lg:w-52 aspect-video lg:aspect-auto' : 'aspect-video'}`}>
        {path.thumbnail_url
          ? <img src={path.thumbnail_url} alt={path.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full ibig-gradient flex items-center justify-center">
              <Target className="w-12 h-12 text-white/40" />
            </div>
        }
        {path.is_featured && (
          <div className="absolute top-2 left-2 bg-[#FFA500] text-black text-xs font-bold px-2 py-0.5 rounded-full">
            Recommandé
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${levelColor[level]}`}>
            {levelLabel[level]}
          </span>
        </div>
        <h3 className={`font-bold text-gray-900 leading-snug mb-2 group-hover:text-[#0B3D91] transition-colors ${featured ? 'text-lg' : 'text-sm'}`}>
          {path.title}
        </h3>
        {path.short_description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">{path.short_description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-gray-400 mt-auto pt-3 border-t border-gray-100">
          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {courseCount} formation{courseCount > 1 ? 's' : ''}</span>
          {path.estimated_hours > 0 && (
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {path.estimated_hours}h</span>
          )}
          <span className="ml-auto text-[#0B3D91] font-semibold flex items-center gap-1">
            Voir le parcours <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
