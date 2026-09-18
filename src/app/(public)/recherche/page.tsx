import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Search, BookOpen, User, Star, ChevronRight } from 'lucide-react'
import PriceDisplay from '@/components/ui/PriceDisplay'

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function RecherchePage({ searchParams }: PageProps) {
  const { q = '' } = await searchParams
  const query = q.trim()

  let courses: any[] = []
  let instructors: any[] = []

  if (query.length >= 2) {
    const supabase = await createClient()
    const search = `%${query}%`
    const [{ data: c }, { data: i }] = await Promise.all([
      supabase
        .from('courses')
        .select('id, title, slug, short_description, thumbnail_url, price_xof, level, rating_avg, review_count, instructor:profiles(full_name)')
        .eq('is_published', true)
        .or(`title.ilike.${search},short_description.ilike.${search}`)
        .limit(18),
      supabase
        .from('profiles')
        .select('id, full_name, bio, avatar_url, country')
        .eq('role', 'formateur')
        .ilike('full_name', search)
        .limit(6),
    ])
    courses = c ?? []
    instructors = i ?? []
  }

  const levelLabel: Record<string, string> = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' }
  const total = courses.length + instructors.length

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Barre de recherche */}
      <form method="GET" action="/recherche" className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          name="q"
          defaultValue={query}
          placeholder="Rechercher une formation, un formateur…"
          autoFocus
          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 focus:border-[#0B3D91] rounded-2xl text-sm focus:outline-none shadow-sm transition-colors"
        />
        <button type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 ibig-gradient text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90">
          Rechercher
        </button>
      </form>

      {query.length >= 2 && (
        <p className="text-sm text-gray-500">
          {total > 0 ? <><span className="font-semibold text-gray-900">{total}</span> résultat{total !== 1 ? 's' : ''} pour «{' '}<span className="text-[#0B3D91]">{query}</span>»</> : `Aucun résultat pour « ${query} »`}
        </p>
      )}

      {/* Formations */}
      {courses.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#0B3D91]" /> Formations ({courses.length})
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map(course => (
              <Link key={course.id} href={`/formation/${course.slug}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  {course.thumbnail_url
                    ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full ibig-gradient flex items-center justify-center"><BookOpen className="w-8 h-8 text-white/60" /></div>
                  }
                </div>
                <div className="p-4 space-y-1.5">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{course.title}</h3>
                  <p className="text-xs text-gray-500">{(course.instructor as any)?.full_name}</p>
                  {course.rating_avg > 0 && (
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="font-semibold text-gray-700">{Number(course.rating_avg).toFixed(1)}</span>
                      <span className="text-gray-400">({course.review_count})</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{levelLabel[course.level] ?? course.level}</span>
                    <PriceDisplay priceXof={course.price_xof} className="text-sm font-bold text-[#0B3D91]" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Formateurs */}
      {instructors.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4 text-[#0B3D91]" /> Formateurs ({instructors.length})
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {instructors.map(ins => (
              <Link key={ins.id} href={`/formateur/${ins.id}`}
                className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 group">
                <div className="w-12 h-12 rounded-full ibig-gradient flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {ins.full_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{ins.full_name}</p>
                  {ins.country && <p className="text-xs text-gray-400">{ins.country}</p>}
                  {ins.bio && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ins.bio}</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#0B3D91] flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Aucun résultat */}
      {query.length >= 2 && total === 0 && (
        <div className="text-center py-20 space-y-4">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto">
            <Search className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 text-sm">Aucun résultat pour «{' '}<span className="font-semibold">{query}</span>»</p>
          <Link href="/catalogue" className="inline-flex items-center gap-2 text-sm text-[#0B3D91] hover:underline">
            Parcourir tout le catalogue <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* État initial */}
      {query.length < 2 && (
        <div className="text-center py-20 text-gray-400 text-sm">
          Saisissez au moins 2 caractères pour lancer la recherche.
        </div>
      )}
    </div>
  )
}
