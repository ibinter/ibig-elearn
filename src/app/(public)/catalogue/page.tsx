import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, Filter, Search, Star, Users, Clock } from 'lucide-react'
import PriceDisplay from '@/components/ui/PriceDisplay'
import type { Course, Category } from '@/types'

interface PageProps {
  searchParams: Promise<{
    categorie?: string; niveau?: string; q?: string; featured?: string
    langue?: string; duree?: string; prix?: string; tri?: string
  }>
}

export default async function CataloguePage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('courses')
    .select('*, instructor:profiles(full_name), category:categories(name, slug), price_eur, price_usd')
    .eq('is_published', true)

  if (params.categorie) {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', params.categorie).single()
    if (cat) query = query.eq('category_id', cat.id)
  }
  if (params.niveau) query = query.eq('level', params.niveau)
  if (params.featured === 'true') query = query.eq('is_featured', true)
  if (params.q) query = query.or(`title.ilike.%${params.q}%,short_description.ilike.%${params.q}%`)
  if (params.langue) query = query.eq('language', params.langue)

  if (params.duree === '0-5') query = query.lte('duration_hours', 5)
  else if (params.duree === '5-20') query = query.gte('duration_hours', 5).lte('duration_hours', 20)
  else if (params.duree === '20+') query = query.gte('duration_hours', 20)

  if (params.prix === 'gratuit') query = query.eq('price_xof', 0)
  else if (params.prix === 'payant') query = query.gt('price_xof', 0)
  else if (params.prix === '0-20000') query = query.gt('price_xof', 0).lte('price_xof', 20000)
  else if (params.prix === '20000-50000') query = query.gt('price_xof', 20000).lte('price_xof', 50000)
  else if (params.prix === '50000+') query = query.gt('price_xof', 50000)

  const tri = params.tri ?? 'popular'
  if (tri === 'popular') query = query.order('enrollment_count', { ascending: false })
  else if (tri === 'recent') query = query.order('created_at', { ascending: false })
  else if (tri === 'rating') query = query.order('rating_average', { ascending: false })
  else if (tri === 'price_asc') query = query.order('price_xof', { ascending: true })
  else if (tri === 'price_desc') query = query.order('price_xof', { ascending: false })

  const { data: courses } = await query
  const { data: categories } = await supabase.from('categories').select('*').order('position')

  const levelLabel: Record<string, string> = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' }
  const levelColor: Record<string, string> = { debutant: 'bg-green-100 text-green-700', intermediaire: 'bg-yellow-100 text-yellow-700', avance: 'bg-red-100 text-red-700' }

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = { ...params, ...overrides }
    const entries = Object.entries(p).filter(([, v]) => v !== undefined && v !== '')
    return '/catalogue' + (entries.length ? '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&') : '')
  }

  const activeFilterCount = [params.categorie, params.niveau, params.langue, params.duree, params.prix, params.q].filter(Boolean).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Catalogue des formations</h1>
          <p className="text-gray-500">{courses?.length ?? 0} formation{(courses?.length ?? 0) > 1 ? 's' : ''} disponible{(courses?.length ?? 0) > 1 ? 's' : ''}</p>
        </div>
        {/* Tri */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 whitespace-nowrap">Trier par :</span>
          <select
            defaultValue={tri}
            onChange={undefined}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] bg-white"
            id="sort-select"
          >
            {[
              { val: 'popular', label: 'Les plus populaires' },
              { val: 'recent', label: 'Les plus récentes' },
              { val: 'rating', label: 'Meilleures notes' },
              { val: 'price_asc', label: 'Prix croissant' },
              { val: 'price_desc', label: 'Prix décroissant' },
            ].map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
          </select>
          <SortScript currentParams={params} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filtres */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Filter className="w-4 h-4" /> Filtres</h2>
              {activeFilterCount > 0 && (
                <Link href="/catalogue" className="text-xs text-red-500 hover:text-red-700 font-medium">
                  Tout effacer ({activeFilterCount})
                </Link>
              )}
            </div>

            {/* Recherche */}
            <form method="get" className="mb-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" name="q" defaultValue={params.q} placeholder="Rechercher..."
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]" />
                {params.categorie && <input type="hidden" name="categorie" value={params.categorie} />}
                {params.niveau && <input type="hidden" name="niveau" value={params.niveau} />}
                {params.langue && <input type="hidden" name="langue" value={params.langue} />}
                {params.duree && <input type="hidden" name="duree" value={params.duree} />}
                {params.prix && <input type="hidden" name="prix" value={params.prix} />}
                {params.tri && <input type="hidden" name="tri" value={params.tri} />}
              </div>
              <button type="submit" className="mt-2 w-full py-2 bg-[#0B3D91] text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors">Rechercher</button>
            </form>

            {/* Catégories */}
            <FilterSection title="Catégories">
              <ul className="space-y-1">
                <li>
                  <Link href={buildUrl({ categorie: undefined })}
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${!params.categorie ? 'bg-[#0B3D91] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                    Toutes
                  </Link>
                </li>
                {(categories as Category[])?.map(cat => (
                  <li key={cat.id}>
                    <Link href={buildUrl({ categorie: cat.slug })}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${params.categorie === cat.slug ? 'bg-[#0B3D91] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </FilterSection>

            {/* Niveau */}
            <FilterSection title="Niveau">
              <ul className="space-y-1">
                {[{ val: '', label: 'Tous' }, { val: 'debutant', label: 'Débutant' }, { val: 'intermediaire', label: 'Intermédiaire' }, { val: 'avance', label: 'Avancé' }].map(n => (
                  <li key={n.val}>
                    <Link href={buildUrl({ niveau: n.val || undefined })}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${(params.niveau ?? '') === n.val ? 'bg-[#0B3D91] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </FilterSection>

            {/* Prix */}
            <FilterSection title="Prix">
              <ul className="space-y-1">
                {[
                  { val: '', label: 'Tous' },
                  { val: 'gratuit', label: 'Gratuit' },
                  { val: '0-20000', label: 'Moins de 20 000 FCFA' },
                  { val: '20000-50000', label: '20 000 – 50 000 FCFA' },
                  { val: '50000+', label: 'Plus de 50 000 FCFA' },
                ].map(p => (
                  <li key={p.val}>
                    <Link href={buildUrl({ prix: p.val || undefined })}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${(params.prix ?? '') === p.val ? 'bg-[#0B3D91] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                      {p.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </FilterSection>

            {/* Durée */}
            <FilterSection title="Durée">
              <ul className="space-y-1">
                {[
                  { val: '', label: 'Toutes' },
                  { val: '0-5', label: 'Moins de 5h' },
                  { val: '5-20', label: '5h – 20h' },
                  { val: '20+', label: 'Plus de 20h' },
                ].map(d => (
                  <li key={d.val}>
                    <Link href={buildUrl({ duree: d.val || undefined })}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${(params.duree ?? '') === d.val ? 'bg-[#0B3D91] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                      {d.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </FilterSection>

            {/* Langue */}
            <FilterSection title="Langue">
              <ul className="space-y-1">
                {[{ val: '', label: 'Toutes' }, { val: 'fr', label: 'Français' }, { val: 'en', label: 'Anglais' }, { val: 'ar', label: 'Arabe' }].map(l => (
                  <li key={l.val}>
                    <Link href={buildUrl({ langue: l.val || undefined })}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${(params.langue ?? '') === l.val ? 'bg-[#0B3D91] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </FilterSection>
          </div>
        </aside>

        {/* Grille */}
        <div className="flex-1">
          {courses && courses.length > 0 ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {(courses as Course[]).map(course => (
                <Link key={course.id} href={`/formation/${course.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col">
                  <div className="relative aspect-video bg-gray-100">
                    {course.thumbnail_url
                      ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full ibig-gradient flex items-center justify-center"><BookOpen className="w-10 h-10 text-white/50" /></div>}
                    <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full ${levelColor[course.level]}`}>{levelLabel[course.level]}</span>
                    {(course as any).price_xof === 0 && (
                      <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full bg-green-500 text-white">GRATUIT</span>
                    )}
                    {(course as any).price_xof > 0 && (new Date().getTime() - new Date((course as any).created_at).getTime()) < 30 * 24 * 60 * 60 * 1000 && (
                      <span className="absolute bottom-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full bg-[#FFA500] text-black">🆕 NOUVEAU</span>
                    )}
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
                      <PriceDisplay price_xof={course.price_xof} price_eur={course.price_eur} price_usd={course.price_usd} className="text-base font-bold text-[#0B3D91]" />
                      <span className="text-xs bg-[#0B3D91]/10 text-[#0B3D91] px-2 py-1 rounded-lg font-medium">Voir →</span>
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

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      {children}
    </div>
  )
}

function SortScript({ currentParams }: { currentParams: Record<string, string | undefined> }) {
  const paramsJson = JSON.stringify(currentParams)
  return (
    <script dangerouslySetInnerHTML={{
      __html: `
(function(){
  var sel = document.getElementById('sort-select');
  if(!sel) return;
  sel.addEventListener('change', function(){
    var p = ${paramsJson};
    p.tri = sel.value;
    var entries = Object.entries(p).filter(function(e){ return e[1]; });
    window.location.href = '/catalogue' + (entries.length ? '?' + entries.map(function(e){ return e[0]+'='+encodeURIComponent(e[1]); }).join('&') : '');
  });
})();
`}} />
  )
}
