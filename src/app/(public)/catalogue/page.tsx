import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, Filter, Search, Star, Users, Clock } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { Course, Category } from '@/types'

interface PageProps {
  searchParams: Promise<{ categorie?: string; niveau?: string; q?: string; featured?: string }>
}

export default async function CataloguePage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('courses')
    .select('*, instructor:profiles(full_name), category:categories(name, slug)')
    .eq('is_published', true)
    .order('enrollment_count', { ascending: false })

  if (params.categorie) {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', params.categorie).single()
    if (cat) query = query.eq('category_id', cat.id)
  }
  if (params.niveau) query = query.eq('level', params.niveau)
  if (params.featured === 'true') query = query.eq('is_featured', true)
  if (params.q) query = query.ilike('title', `%${params.q}%`)

  const { data: courses } = await query
  const { data: categories } = await supabase.from('categories').select('*').order('position')

  const levelLabel: Record<string, string> = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' }
  const levelColor: Record<string, string> = { debutant: 'bg-green-100 text-green-700', intermediaire: 'bg-yellow-100 text-yellow-700', avance: 'bg-red-100 text-red-700' }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Catalogue des formations</h1>
        <p className="text-gray-500">{courses?.length ?? 0} formation{(courses?.length ?? 0) > 1 ? 's' : ''} disponible{(courses?.length ?? 0) > 1 ? 's' : ''}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filtres */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><Filter className="w-4 h-4" /> Filtres</h2>

            {/* Recherche */}
            <form method="get" className="mb-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="q"
                  defaultValue={params.q}
                  placeholder="Rechercher..."
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]"
                />
                {params.categorie && <input type="hidden" name="categorie" value={params.categorie} />}
                {params.niveau && <input type="hidden" name="niveau" value={params.niveau} />}
              </div>
              <button type="submit" className="mt-2 w-full py-2 bg-[#0B3D91] text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors">Rechercher</button>
            </form>

            {/* Catégories */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Catégories</h3>
              <ul className="space-y-1">
                <li>
                  <Link href="/catalogue" className={`block px-3 py-2 rounded-lg text-sm transition-colors ${!params.categorie ? 'bg-[#0B3D91] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                    Toutes les catégories
                  </Link>
                </li>
                {(categories as Category[])?.map(cat => (
                  <li key={cat.id}>
                    <Link href={`/catalogue?categorie=${cat.slug}`}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${params.categorie === cat.slug ? 'bg-[#0B3D91] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Niveau */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Niveau</h3>
              <ul className="space-y-1">
                {[{val: '', label: 'Tous les niveaux'}, {val: 'debutant', label: 'Débutant'}, {val: 'intermediaire', label: 'Intermédiaire'}, {val: 'avance', label: 'Avancé'}].map(n => (
                  <li key={n.val}>
                    <Link href={`/catalogue?${params.categorie ? `categorie=${params.categorie}&` : ''}${n.val ? `niveau=${n.val}` : ''}`}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${params.niveau === n.val || (!params.niveau && !n.val) ? 'bg-[#0B3D91] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Grille de cours */}
        <div className="flex-1">
          {courses && courses.length > 0 ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {(courses as Course[]).map(course => (
                <Link key={course.id} href={`/formation/${course.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col">
                  <div className="relative aspect-video bg-gray-100">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full ibig-gradient flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-white/50" />
                      </div>
                    )}
                    <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full ${levelColor[course.level]}`}>
                      {levelLabel[course.level]}
                    </span>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-xs font-medium text-[#0B3D91] mb-1">{(course.category as any)?.name}</p>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1 line-clamp-2 group-hover:text-[#0B3D91] transition-colors">{course.title}</h3>
                    <p className="text-gray-400 text-xs mb-2">par {(course.instructor as any)?.full_name}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-1">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-[#FFA500] fill-[#FFA500]" /> {course.rating_average.toFixed(1)}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course.enrollment_count}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration_hours}h</span>
                    </div>
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-base font-bold text-[#0B3D91]">{formatPrice(course.price_xof)}</span>
                      <span className="text-xs bg-[#0B3D91]/10 text-[#0B3D91] px-2 py-1 rounded-lg font-medium">Voir la formation →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Aucune formation trouvée</h3>
              <p className="text-gray-400 text-sm mb-4">Essayez d&apos;autres filtres ou revenez bientôt.</p>
              <Link href="/catalogue" className="text-[#0B3D91] font-semibold hover:underline">Voir tout le catalogue</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
