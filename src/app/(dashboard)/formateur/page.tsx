import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Users, Award, TrendingUp, Eye, EyeOff, PlusCircle, ChevronRight, BarChart2 } from 'lucide-react'

export default async function FormateurPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || !['formateur', 'admin', 'coordinateur'].includes(profile.role ?? '')) {
    redirect('/tableau-de-bord')
  }

  // Formations du formateur
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, slug, is_published, price, total_lessons, thumbnail_url, category')
    .eq('instructor_id', user.id)
    .order('created_at', { ascending: false })

  const courseIds = (courses ?? []).map(c => c.id)

  // Stats inscriptions par formation
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id, progress_percent, is_completed')
    .in('course_id', courseIds.length > 0 ? courseIds : ['00000000-0000-0000-0000-000000000000'])

  const { data: certs } = await supabase
    .from('certificates')
    .select('course_id')
    .in('course_id', courseIds.length > 0 ? courseIds : ['00000000-0000-0000-0000-000000000000'])

  const enrollMap: Record<string, number> = {}
  const completedMap: Record<string, number> = {}
  for (const e of enrollments ?? []) {
    enrollMap[e.course_id] = (enrollMap[e.course_id] ?? 0) + 1
    if (e.is_completed) completedMap[e.course_id] = (completedMap[e.course_id] ?? 0) + 1
  }

  const certMap: Record<string, number> = {}
  for (const c of certs ?? []) certMap[c.course_id] = (certMap[c.course_id] ?? 0) + 1

  const totalInscriptions = Object.values(enrollMap).reduce((s, v) => s + v, 0)
  const totalCerts = (certs ?? []).length
  const publishedCount = (courses ?? []).filter(c => c.is_published).length

  const kpis = [
    { label: 'Formations', value: courses?.length ?? 0, sub: `${publishedCount} publiées`, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
    { label: 'Apprenants inscrits', value: totalInscriptions, sub: 'total', icon: Users, color: 'text-green-600 bg-green-50' },
    { label: 'Certificats délivrés', value: totalCerts, sub: 'via mes formations', icon: Award, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Taux complétion', value: totalInscriptions > 0 ? `${Math.round((Object.values(completedMap).reduce((s, v) => s + v, 0) / totalInscriptions) * 100)}%` : '—', sub: 'formations terminées', icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Espace formateur</h1>
          <p className="text-sm text-gray-500 mt-0.5">Bonjour, {profile.full_name?.split(' ')[0]} 👋</p>
        </div>
        <Link href="/formateur/nouvelle-formation"
          className="flex items-center gap-2 ibig-gradient text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
          <PlusCircle className="w-4 h-4" /> Nouvelle formation
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString('fr') : value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label} <span className="text-gray-400">· {sub}</span></div>
          </div>
        ))}
      </div>

      {/* Mes formations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Mes formations</h2>
          <Link href="/formateur/formations" className="text-xs text-[#0B3D91] hover:underline flex items-center gap-1">
            Tout voir <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {(courses ?? []).length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-4">Vous n'avez pas encore créé de formation.</p>
            <Link href="/formateur/nouvelle-formation"
              className="inline-flex items-center gap-2 ibig-gradient text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90">
              <PlusCircle className="w-4 h-4" /> Créer ma première formation
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(courses ?? []).map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                {/* Thumbnail */}
                {c.thumbnail_url ? (
                  <img src={c.thumbnail_url} alt={c.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl ibig-gradient flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                )}
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 truncate">{c.title}</p>
                    {c.is_published
                      ? <Eye className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      : <EyeOff className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-400">
                    {c.total_lessons ?? 0} leçons · {c.category ?? '—'}
                    {c.price > 0 ? ` · ${c.price.toLocaleString('fr')} XOF` : ' · Gratuit'}
                  </p>
                </div>
                {/* Stats */}
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{(enrollMap[c.id] ?? 0).toLocaleString('fr')}</p>
                    <p className="text-xs text-gray-400">inscrits</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{certMap[c.id] ?? 0}</p>
                    <p className="text-xs text-gray-400">certs</p>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/formateur/formations/${c.slug}/stats`}
                    className="flex items-center gap-1 text-xs text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <BarChart2 className="w-3.5 h-3.5" /> Stats
                  </Link>
                  <Link href={`/formateur/formations/${c.slug}/editer`}
                    className="flex items-center gap-1 text-xs ibig-gradient text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
                    Éditer
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ressources formateur */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { title: 'Guide formateur', desc: 'Bonnes pratiques pour créer vos formations', href: '/faq#formateurs', emoji: '📖' },
          { title: 'Support formateurs', desc: 'Contactez notre équipe dédiée', href: '/contact', emoji: '💬' },
          { title: 'Conditions', desc: 'Conditions d\'utilisation pour les formateurs', href: '/devenir-formateur', emoji: '📋' },
        ].map(item => (
          <Link key={item.title} href={item.href}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-[#0B3D91]/20 transition-all">
            <div className="text-2xl mb-2">{item.emoji}</div>
            <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
