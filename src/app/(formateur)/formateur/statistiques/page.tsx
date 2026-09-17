import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { TrendingUp, Users, Star, BookOpen, Award } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

export default async function FormateurStatistiquesPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: courses } = await supabase
    .from('courses')
    .select(`
      id, title, slug, is_published, price_xof, enrollment_count, rating_average, rating_count,
      enrollments(count),
      reviews(rating)
    `)
    .eq('instructor_id', user.id)
    .order('enrollment_count', { ascending: false })

  const totalEnrollments = courses?.reduce((sum, c) => sum + ((c.enrollments as any)?.[0]?.count ?? 0), 0) ?? 0
  const totalRevenue = courses?.reduce((sum, c) => sum + (c.price_xof * ((c.enrollments as any)?.[0]?.count ?? 0)), 0) ?? 0
  const avgRating = courses?.length
    ? (courses.reduce((sum, c) => sum + (c.rating_average ?? 0), 0) / courses.filter(c => c.rating_average > 0).length || 0).toFixed(1)
    : '—'
  const publishedCourses = courses?.filter(c => c.is_published).length ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
        <p className="text-gray-500 text-sm mt-1">Vue d'ensemble de vos performances</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Formations publiées', value: publishedCourses, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total apprenants', value: totalEnrollments.toLocaleString('fr-FR'), icon: Users, color: 'text-green-600 bg-green-50' },
          { label: 'Note moyenne', value: avgRating, icon: Star, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Revenus estimés', value: formatPrice(totalRevenue), icon: TrendingUp, color: 'text-purple-600 bg-purple-50', small: true },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color} mb-3`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className={`font-bold text-gray-900 ${(s as any).small ? 'text-base' : 'text-2xl'}`}>{s.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Performance par formation */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Performance par formation</h2>
        </div>
        {!courses?.length ? (
          <div className="p-12 text-center">
            <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aucune formation créée</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {(courses as any[]).map(course => {
              const enrollCount = (course.enrollments as any)?.[0]?.count ?? 0
              const ratings = (course.reviews as any[])?.map((r: any) => r.rating) ?? []
              const avg = ratings.length ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1) : '—'
              const revenue = course.price_xof * enrollCount

              return (
                <div key={course.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900 text-sm truncate">{course.title}</p>
                      {course.is_published ? (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium shrink-0">Publié</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium shrink-0">Brouillon</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {enrollCount} apprenants</span>
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" /> {avg} ({ratings.length} avis)</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-[#0B3D91] text-sm">{formatPrice(revenue)}</p>
                    <p className="text-xs text-gray-400">revenus estimés</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Note :</strong> Les revenus affichés sont des estimations basées sur le nombre d'inscriptions actives. Les revenus réels tiennent compte des remboursements et des promotions.
      </div>
    </div>
  )
}
