import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, Award, Clock, TrendingUp, ArrowRight, Play } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function TableauDeBordPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, course:courses(id, title, slug, thumbnail_url, duration_hours)')
    .eq('user_id', user!.id)
    .order('enrolled_at', { ascending: false })
    .limit(5)

  const { data: certificates } = await supabase
    .from('certificates')
    .select('*, course:courses(title)')
    .eq('user_id', user!.id)
    .order('issued_at', { ascending: false })
    .limit(3)

  const stats = {
    total: enrollments?.length ?? 0,
    completed: enrollments?.filter(e => e.status === 'completed').length ?? 0,
    inProgress: enrollments?.filter(e => e.status === 'active' && e.progress_percent > 0).length ?? 0,
    certs: certificates?.length ?? 0,
  }

  return (
    <div>
      {/* Bienvenue */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Bonjour, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500">Continuez votre parcours de formation</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Formations inscrites', value: stats.total, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
          { label: 'En cours', value: stats.inProgress, icon: TrendingUp, color: 'text-orange-600 bg-orange-50' },
          { label: 'Terminées', value: stats.completed, icon: Award, color: 'text-green-600 bg-green-50' },
          { label: 'Certificats', value: stats.certs, icon: Award, color: 'text-purple-600 bg-purple-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color} mb-3`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Formations en cours */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Mes formations</h2>
              <Link href="/mes-formations" className="text-sm text-[#0B3D91] hover:underline flex items-center gap-1">
                Voir tout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {enrollments && enrollments.length > 0 ? enrollments.map((e: any) => (
                <div key={e.id} className="p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                    {e.course?.thumbnail_url ? (
                      <img src={e.course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full ibig-gradient flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white/60" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{e.course?.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-[#0B3D91]" style={{ width: `${e.progress_percent}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{e.progress_percent}%</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" /> {e.course?.duration_hours}h
                    </div>
                  </div>
                  <Link href={`/apprendre/${e.course?.id}/intro`}
                    className="flex items-center gap-1 text-xs font-semibold text-white ibig-gradient px-3 py-2 rounded-lg hover:opacity-90 flex-shrink-0">
                    <Play className="w-3 h-3" /> Reprendre
                  </Link>
                </div>
              )) : (
                <div className="p-8 text-center">
                  <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm mb-3">Aucune formation en cours</p>
                  <Link href="/catalogue" className="text-[#0B3D91] font-semibold text-sm hover:underline">Explorer le catalogue →</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Certificats récents */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Certificats</h2>
              <Link href="/mes-certificats" className="text-sm text-[#0B3D91] hover:underline">Voir tout</Link>
            </div>
            <div className="p-4 space-y-3">
              {certificates && certificates.length > 0 ? certificates.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[#0B3D91]/5 to-[#FFA500]/5 border border-[#0B3D91]/10">
                  <div className="w-10 h-10 rounded-full bg-[#FFA500]/10 flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-[#FFA500]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{c.course?.title}</p>
                    <p className="text-xs text-gray-400">{formatDate(c.issued_at)}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6">
                  <Award className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-xs">Terminez une formation pour obtenir votre certificat</p>
                </div>
              )}
            </div>
          </div>

          {/* CTA découvrir */}
          <div className="mt-4 ibig-gradient rounded-2xl p-5 text-white">
            <h3 className="font-bold text-sm mb-1">Découvrez de nouvelles formations</h3>
            <p className="text-blue-200 text-xs mb-3">Développez vos compétences dès aujourd&apos;hui</p>
            <Link href="/catalogue" className="flex items-center gap-1 text-sm font-semibold text-[#FFA500] hover:text-orange-400 transition-colors">
              Explorer le catalogue <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
