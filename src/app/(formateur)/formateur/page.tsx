import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { BookOpen, Users, Star, TrendingUp, PlusCircle, Eye } from 'lucide-react'

export default async function FormateurDashboard() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { count: totalCourses },
    { data: courses },
  ] = await Promise.all([
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('instructor_id', user.id),
    supabase.from('courses').select(`
      id, title, slug, thumbnail_url, is_published,
      enrollments(count),
      reviews(rating)
    `).eq('instructor_id', user.id).order('created_at', { ascending: false }).limit(5),
  ])

  const stats = courses?.map(c => {
    const enrollCount = (c.enrollments as any)?.[0]?.count ?? 0
    const ratings = (c.reviews as any[])?.map((r: any) => r.rating) ?? []
    const avgRating = ratings.length ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1) : null
    return { ...c, enrollCount, avgRating, reviewCount: ratings.length }
  })

  const totalEnrollments = stats?.reduce((sum, c) => sum + c.enrollCount, 0) ?? 0

  const statCards = [
    { label: 'Formations', value: totalCourses ?? 0, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
    { label: 'Apprenants', value: totalEnrollments, icon: Users, color: 'text-green-600 bg-green-50' },
    { label: 'Formations publiées', value: stats?.filter(c => c.is_published).length ?? 0, icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord formateur</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez vos formations et suivez vos apprenants</p>
        </div>
        <Link
          href="/formateur/formations/nouvelle"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Nouvelle formation
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mes formations récentes */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Mes formations</h2>
          <Link href="/formateur/formations" className="text-blue-600 hover:underline text-sm">Voir tout</Link>
        </div>
        {!stats?.length ? (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucune formation créée</p>
            <Link href="/formateur/formations/nouvelle" className="text-blue-600 hover:underline text-sm mt-1 inline-block">
              Créer votre première formation →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {stats.map(course => (
              <div key={course.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="w-14 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">📚</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate text-sm">{course.title}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.enrollCount} apprenants</span>
                    {course.avgRating && (
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{course.avgRating} ({course.reviewCount})</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${course.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {course.is_published ? 'Publié' : 'Brouillon'}
                  </span>
                  <Link href={`/formation/${course.slug}`} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
