import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Users, TrendingUp, Star, DollarSign, Plus, Eye, BarChart2, Bell, Video, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function FormateurDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!['formateur', 'admin', 'coordinateur'].includes(profile?.role ?? '')) redirect('/tableau-de-bord')

  // Formations du formateur
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, slug, thumbnail_url, is_published, enrollment_count, rating_average, rating_count, price_xof, created_at, updated_at, category:categories(name)')
    .eq('instructor_id', user.id)
    .order('created_at', { ascending: false })

  const courseIds = courses?.map(c => c.id) ?? []

  // Revenus (paiements complétés liés à ces formations)
  const { data: payments } = courseIds.length
    ? await supabase.from('payments').select('amount, currency, course_id, created_at').eq('status', 'completed').in('course_id', courseIds)
    : { data: [] }

  // Avis récents
  const { data: recentReviews } = courseIds.length
    ? await supabase.from('reviews').select('rating, comment, created_at, course:courses(title), user:profiles(full_name)').in('course_id', courseIds).eq('is_published', true).order('created_at', { ascending: false }).limit(5)
    : { data: [] }

  // Derniers inscrits
  const { data: recentEnrollments } = courseIds.length
    ? await supabase.from('enrollments').select('enrolled_at, progress_percent, course:courses(title), user:profiles(full_name, country)').in('course_id', courseIds).order('enrolled_at', { ascending: false }).limit(8)
    : { data: [] }

  // Stats globales
  const totalStudents = courses?.reduce((s, c) => s + (c.enrollment_count ?? 0), 0) ?? 0
  const totalRevenue = payments?.reduce((s, p) => s + (p.amount ?? 0), 0) ?? 0
  const avgRating = courses?.length
    ? (courses.filter(c => c.rating_count > 0).reduce((s, c) => s + c.rating_average, 0) / (courses.filter(c => c.rating_count > 0).length || 1))
    : 0
  const publishedCount = courses?.filter(c => c.is_published).length ?? 0

  // Revenus par mois (6 derniers mois)
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return { label: d.toLocaleDateString('fr-FR', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() }
  })
  const revenueByMonth = months.map(m => ({
    ...m,
    total: payments?.filter(p => {
      const d = new Date(p.created_at)
      return d.getFullYear() === m.year && d.getMonth() === m.month
    }).reduce((s, p) => s + p.amount, 0) ?? 0,
  }))
  const maxRevenue = Math.max(...revenueByMonth.map(m => m.total), 1)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Espace Formateur</h1>
          <p className="text-gray-500 text-sm mt-0.5">Bonjour {profile?.full_name} 👋</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/formateur/sessions-live"
            className="flex items-center gap-2 border border-gray-200 text-gray-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            <Video className="w-4 h-4" /> Sessions live
          </Link>
          <Link href={`/formateur/${user.id}`} target="_blank"
            className="flex items-center gap-2 border border-gray-200 text-gray-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            <Eye className="w-4 h-4" /> Profil public
          </Link>
          <Link href="/admin/formations/nouvelle"
            className="flex items-center gap-2 ibig-gradient text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Nouvelle formation
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Formations', value: courses?.length ?? 0, sub: `${publishedCount} publiée${publishedCount > 1 ? 's' : ''}`, icon: BookOpen, color: 'text-[#0B3D91] bg-blue-50' },
          { label: 'Apprenants', value: totalStudents.toLocaleString(), sub: 'inscrits total', icon: Users, color: 'text-purple-600 bg-purple-50' },
          { label: 'Revenus', value: `${totalRevenue.toLocaleString()} FCFA`, sub: 'depuis le début', icon: DollarSign, color: 'text-green-600 bg-green-50' },
          { label: 'Note moyenne', value: avgRating > 0 ? avgRating.toFixed(1) + ' / 5' : '—', sub: `${courses?.reduce((s, c) => s + (c.rating_count ?? 0), 0) ?? 0} avis`, icon: Star, color: 'text-[#FFA500] bg-orange-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label} · {s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Graphe revenus */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-[#0B3D91]" /> Revenus (6 derniers mois)</h2>
          <div className="flex items-end gap-3 h-36">
            {revenueByMonth.map(m => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs text-gray-500">{m.total > 0 ? `${(m.total / 1000).toFixed(0)}k` : ''}</span>
                <div className="w-full rounded-t-lg bg-[#0B3D91]/10 relative overflow-hidden" style={{ height: '100px' }}>
                  <div className="absolute bottom-0 w-full bg-[#0B3D91] rounded-t-lg transition-all"
                    style={{ height: `${Math.max(2, (m.total / maxRevenue) * 100)}%` }} />
                </div>
                <span className="text-xs text-gray-400">{m.label}</span>
              </div>
            ))}
          </div>
          {totalRevenue === 0 && <p className="text-sm text-gray-400 text-center mt-4">Aucun revenu enregistré pour l'instant.</p>}
        </div>

        {/* Avis récents */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-[#FFA500]" /> Avis récents</h2>
          {(!recentReviews || recentReviews.length === 0) ? (
            <p className="text-sm text-gray-400">Aucun avis pour l'instant.</p>
          ) : (
            <div className="space-y-4">
              {(recentReviews as any[]).map((r, i) => (
                <div key={i} className="pb-4 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-[#FFA500] fill-[#FFA500]' : 'text-gray-200 fill-gray-200'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    ))}
                    <span className="text-xs text-gray-400 ml-1">{r.user?.full_name}</span>
                  </div>
                  <p className="text-xs font-medium text-[#0B3D91]">{r.course?.title}</p>
                  {r.comment && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mes formations */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><BookOpen className="w-5 h-5 text-[#0B3D91]" /> Mes formations ({courses?.length ?? 0})</h2>
        </div>
        {(!courses || courses.length === 0) ? (
          <div className="p-8 text-center">
            <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">Vous n'avez pas encore de formation.</p>
            <Link href="/admin/formations/nouvelle" className="ibig-gradient text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90">Créer ma première formation</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {courses.map(c => (
              <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-16 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                  {c.thumbnail_url
                    ? <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full ibig-gradient flex items-center justify-center"><BookOpen className="w-5 h-5 text-white/50" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{c.title}</p>
                  <p className="text-xs text-gray-400">{(c.category as any)?.name} · Mis à jour le {formatDate(c.updated_at)}</p>
                </div>
                <div className="flex items-center gap-4 text-sm flex-shrink-0">
                  <span className="flex items-center gap-1 text-gray-500"><Users className="w-4 h-4" /> {c.enrollment_count}</span>
                  <span className="flex items-center gap-1 text-gray-500"><Star className="w-4 h-4 text-[#FFA500] fill-[#FFA500]" /> {c.rating_average?.toFixed(1)}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.is_published ? 'Publié' : 'Brouillon'}
                  </span>
                  <div className="flex gap-2">
                    <Link href={`/formateur/analytics/${c.id}`} className="text-xs border border-gray-200 text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1">
                      <BarChart2 className="w-3 h-3" /> Analytics
                    </Link>
                    <Link href={`/formation/${c.slug}`} className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">Voir</Link>
                    <Link href={`/admin/formations/${c.id}/modifier`} className="text-xs bg-[#0B3D91] text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 transition-colors">Modifier</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Derniers inscrits */}
      {recentEnrollments && recentEnrollments.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><Users className="w-5 h-5 text-[#0B3D91]" /> Derniers inscrits</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(recentEnrollments as any[]).map((e, i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-[#0B3D91]/10 flex items-center justify-center text-[#0B3D91] font-bold text-sm flex-shrink-0">
                  {e.user?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{e.user?.full_name}</p>
                  <p className="text-xs text-gray-400">{e.course?.title}{e.user?.country ? ` · ${e.user.country}` : ''}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0B3D91] rounded-full" style={{ width: `${e.progress_percent ?? 0}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-8">{e.progress_percent ?? 0}%</span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(e.enrolled_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notification aux inscrits */}
      <div className="bg-gradient-to-r from-[#0B3D91] to-blue-700 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Bell className="w-8 h-8 text-blue-300 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-bold">Nouvelle leçon publiée ?</p>
          <p className="text-blue-200 text-sm mt-0.5">Notifiez vos apprenants automatiquement par email à chaque nouvelle leçon.</p>
        </div>
        <Link href="/formateur/notifier" className="bg-white text-[#0B3D91] font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors whitespace-nowrap">
          Envoyer une notification
        </Link>
      </div>
    </div>
  )
}
