import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, Star, Users, Clock, X } from 'lucide-react'
import PriceDisplay from '@/components/ui/PriceDisplay'
import type { Course, Category } from '@/types'
import CatalogueFilters from './CatalogueFilters'
import { getT } from '@/i18n'
import CourseLanguageBadge from '@/components/ui/CourseLanguageBadge'

export const metadata = { alternates: { canonical: '/catalogue' },
  title: 'Catalogue des formations professionnelles',
  description: 'Explorez nos formations certifiantes en ligne adaptées aux marchés africains. Filtrez par domaine, niveau, prix, langue. Payez en Mobile Money.',
  openGraph: {
    title: 'Catalogue',
    description: 'Formations certifiantes pour les professionnels d\'Afrique francophone.',
    type: 'website' as const,
  },
}

const PAGE_SIZE = 12

interface PageProps {
  searchParams: Promise<{
    categorie?: string; niveau?: string; q?: string; featured?: string
    langue?: string; duree?: string; prix?: string; tri?: string; page?: string
  }>
}

export default async function CataloguePage({ searchParams }: PageProps) {
  const t = await getT()
  const params = await searchParams
  const supabase = await createClient()
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const offset = (page - 1) * PAGE_SIZE

  // ── Requête principale ──────────────────────────────────────
  let query = supabase
    .from('courses')
    .select('id, title, slug, short_description, thumbnail_url, level, language, price_xof, price_eur, price_usd, rating_average, enrollment_count, duration_hours, is_featured, instructor:profiles(full_name), category:categories(name, slug)', { count: 'exact' })
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
  else if (params.prix === '0-20000') query = query.gt('price_xof', 0).lte('price_xof', 20000)
  else if (params.prix === '20000-50000') query = query.gt('price_xof', 20000).lte('price_xof', 50000)
  else if (params.prix === '50000+') query = query.gt('price_xof', 50000)

  const tri = params.tri ?? 'popular'
  if (tri === 'popular') query = query.order('enrollment_count', { ascending: false })
  else if (tri === 'recent') query = query.order('created_at', { ascending: false })
  else if (tri === 'rating') query = query.order('rating_average', { ascending: false })
  else if (tri === 'price_asc') query = query.order('price_xof', { ascending: true })
  else if (tri === 'price_desc') query = query.order('price_xof', { ascending: false })

  const { data: courses, count } = await query.range(offset, offset + PAGE_SIZE - 1)
  const { data: categories } = await supabase.from('categories').select('*').order('position')

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  const levelLabel: Record<string, string> = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' }
  const levelColor: Record<string, string> = {
    debutant: 'bg-green-100 text-green-700',
    intermediaire: 'bg-yellow-100 text-yellow-700',
    avance: 'bg-red-100 text-red-700',
  }

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = { ...params, page: undefined, ...overrides }
    const entries = Object.entries(p).filter(([, v]) => v !== undefined && v !== '')
    return '/catalogue' + (entries.length ? '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&') : '')
  }

  function pageUrl(p: number) {
    const all = { ...params, page: p > 1 ? String(p) : undefined }
    const entries = Object.entries(all).filter(([, v]) => v !== undefined && v !== '')
    return '/catalogue' + (entries.length ? '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&') : '')
  }

  // Chips filtres actifs
  const activeChips: { label: string; key: string }[] = []
  if (params.q) activeChips.push({ label: `"${params.q}"`, key: 'q' })
  if (params.categorie) activeChips.push({ label: (categories as Category[])?.find(c => c.slug === params.categorie)?.name ?? params.categorie, key: 'categorie' })
  if (params.niveau) activeChips.push({ label: levelLabel[params.niveau] ?? params.niveau, key: 'niveau' })
  if (params.prix) activeChips.push({ label: { gratuit: 'Gratuit', '0-20000': '< 20k FCFA', '20000-50000': '20k–50k FCFA', '50000+': '> 50k FCFA' }[params.prix] ?? params.prix, key: 'prix' })
  if (params.duree) activeChips.push({ label: { '0-5': '< 5h', '5-20': '5–20h', '20+': '> 20h' }[params.duree] ?? params.duree, key: 'duree' })
  if (params.langue) activeChips.push({ label: { fr: 'Français', en: 'Anglais', ar: 'Arabe' }[params.langue] ?? params.langue, key: 'langue' })

  return (
    <div>
      {/* Bannière hero */}
      <div className="hero-network text-white py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">{t.catalog.heroBanner}</h1>
          <p className="text-blue-200 text-sm">
            {count ?? 0} {t.catalog.heroSub}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Chips filtres actifs */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {activeChips.map(chip => (
              <Link key={chip.key} href={buildUrl({ [chip.key]: undefined })}
                className="inline-flex items-center gap-1.5 bg-[#0B3D91]/10 text-[#0B3D91] text-sm font-medium px-3 py-1.5 rounded-full hover:bg-[#0B3D91]/20 transition-colors">
                {chip.label}
                <X className="w-3.5 h-3.5" />
              </Link>
            ))}
            <Link href="/catalogue" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 px-2 py-1.5 transition-colors">
              {t.catalog.clearAll}
            </Link>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filtres — composant client pour mobile */}
          <CatalogueFilters
            categories={categories as Category[]}
            params={params}
          />

          {/* Grille */}
          <div className="flex-1 min-w-0">
            {/* Barre tri + compteur */}
            <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
              <p className="text-sm text-gray-500">
                {count ?? 0} résultat{(count ?? 0) > 1 ? 's' : ''}
                {page > 1 && ` — page ${page}/${totalPages}`}
              </p>
              <SortSelect current={tri} params={params} />
            </div>

            {courses && courses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {(courses as unknown as Course[]).map(course => (
                    <Link key={course.id} href={`/formation/${course.slug}`}
                      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col">
                      <div className="relative aspect-video bg-gray-100">
                        {course.thumbnail_url
                          ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          : <div className="w-full h-full ibig-gradient flex items-center justify-center"><BookOpen className="w-10 h-10 text-white/50" /></div>}
                        <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full ${levelColor[course.level] ?? 'bg-gray-100 text-gray-600'}`}>
                          {levelLabel[course.level] ?? course.level}
                        </span>
                        <CourseLanguageBadge language={(course as { language?: string }).language} variant="overlay" className="absolute bottom-2 right-2" />
                        {course.price_xof === 0 && (
                          <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full bg-green-500 text-white">GRATUIT</span>
                        )}
                        {(course as any).is_featured && (
                          <span className="absolute bottom-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full bg-[#FFA500] text-black">{t.catalog.featured}</span>
                        )}
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <p className="text-xs font-medium text-[#0B3D91] mb-1">{(course.category as any)?.name}</p>
                        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1 line-clamp-2 group-hover:text-[#0B3D91] transition-colors">{course.title}</h3>
                        <p className="text-gray-400 text-xs mb-3">par {(course.instructor as any)?.full_name}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-1">
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-[#FFA500] fill-[#FFA500]" /> {(course.rating_average ?? 0).toFixed(1)}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {(course.enrollment_count ?? 0).toLocaleString('fr-FR')}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration_hours}h</span>
                        </div>
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                          <PriceDisplay price_xof={course.price_xof} price_eur={(course as any).price_eur} price_usd={(course as any).price_usd} className="text-base font-bold text-[#0B3D91]" />
                          <span className="text-xs bg-[#0B3D91]/10 text-[#0B3D91] px-2 py-1 rounded-lg font-medium">Voir →</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-10">
                    {page > 1 && (
                      <Link href={pageUrl(page - 1)}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-[#0B3D91] hover:text-[#0B3D91] transition-colors">
                        {t.catalog.previous}
                      </Link>
                    )}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                      .reduce<(number | '…')[]>((acc, p, i, arr) => {
                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('…')
                        acc.push(p)
                        return acc
                      }, [])
                      .map((p, i) =>
                        p === '…'
                          ? <span key={`ellipsis-${i}`} className="px-2 py-2 text-sm text-gray-400">…</span>
                          : <Link key={p} href={pageUrl(p as number)}
                              className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${page === p ? 'bg-[#0B3D91] text-white' : 'border border-gray-200 text-gray-600 hover:border-[#0B3D91] hover:text-[#0B3D91]'}`}>
                              {p}
                            </Link>
                      )}
                    {page < totalPages && (
                      <Link href={pageUrl(page + 1)}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-[#0B3D91] hover:text-[#0B3D91] transition-colors">
                        {t.catalog.next}
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">{t.catalog.noFound}</h3>
                <p className="text-gray-400 text-sm mb-4">{t.catalog.noFoundSub}</p>
                <Link href="/catalogue" className="text-[#0B3D91] font-semibold hover:underline">{t.catalog.seeCatalog}</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Composant tri (client-side navigation) ──────────────────
function SortSelect({ current, params }: { current: string; params: Record<string, string | undefined> }) {
  const paramsJson = JSON.stringify({ ...params, page: undefined })
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="tri-select" className="text-sm text-gray-500 whitespace-nowrap">Trier par :</label>
      <select id="tri-select" defaultValue={current}
        className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] bg-white">
        <option value="popular">Les plus populaires</option>
        <option value="recent">Les plus récentes</option>
        <option value="rating">Meilleures notes</option>
        <option value="price_asc">Prix croissant</option>
        <option value="price_desc">Prix décroissant</option>
      </select>
      <script dangerouslySetInnerHTML={{ __html: `(function(){
        var s=document.getElementById('tri-select');
        if(!s)return;
        s.addEventListener('change',function(){
          var p=${paramsJson};p.tri=s.value;
          var e=Object.entries(p).filter(function(x){return x[1];});
          window.location.href='/catalogue'+(e.length?'?'+e.map(function(x){return x[0]+'='+encodeURIComponent(x[1]);}).join('&'):'');
        });
      })();` }} />
    </div>
  )
}
