import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Video, ExternalLink, Calendar, Clock } from 'lucide-react'

export default async function LiveSessionsLearnerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // Get user's enrolled courses
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('user_id', user.id)

  const courseIds = enrollments?.map(e => e.course_id) ?? []

  const { data: sessions } = courseIds.length
    ? await supabase
        .from('live_sessions')
        .select('*, course:courses(title, slug), instructor:profiles(full_name)')
        .in('course_id', courseIds)
        .gte('scheduled_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // include 2h in past
        .order('scheduled_at')
    : { data: [] }

  const now = new Date()
  const upcoming = sessions?.filter(s => new Date(s.scheduled_at) >= now) ?? []
  const past = sessions?.filter(s => new Date(s.scheduled_at) < now) ?? []

  const platformLabels: Record<string, string> = { zoom: '📹 Zoom', meet: '📞 Google Meet', other: '🔗 Autre' }

  const SessionCard = ({ s }: { s: any }) => {
    const date = new Date(s.scheduled_at)
    const isNow = date <= now && new Date(date.getTime() + s.duration_minutes * 60000) > now
    return (
      <div className={`bg-white rounded-2xl border ${isNow ? 'border-[#0B3D91] shadow-md' : 'border-gray-100 shadow-sm'} p-5 flex items-start gap-4`}>
        {isNow && <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />}
        <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${isNow ? 'bg-[#0B3D91]' : 'bg-gray-100'}`}>
          <span className={`text-sm font-bold ${isNow ? 'text-white' : 'text-gray-700'}`}>{date.getDate()}</span>
          <span className={`text-[10px] uppercase ${isNow ? 'text-white/70' : 'text-gray-500'}`}>
            {date.toLocaleDateString('fr-FR', { month: 'short' })}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-sm">{s.title}</h3>
            {isNow && <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">En cours</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{s.course.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">Par {s.instructor?.full_name}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {s.duration_minutes} min
            </span>
            <span className="text-xs text-gray-500">{platformLabels[s.platform] ?? '🔗'}</span>
          </div>
        </div>
        <a href={s.meeting_url} target="_blank" rel="noopener noreferrer"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg flex-shrink-0 transition-colors ${isNow ? 'bg-[#0B3D91] text-white hover:bg-[#0a3480]' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          Rejoindre <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sessions live</h1>
        <p className="text-gray-500 text-sm mt-1">Sessions Zoom et Google Meet de vos formations</p>
      </div>

      {!sessions?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Video className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-500">Aucune session live prévue</p>
          <p className="text-sm text-gray-400 mt-1">Vos formateurs n&apos;ont pas encore programmé de sessions</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">À venir</h2>
              <div className="space-y-3">
                {upcoming.map(s => <SessionCard key={s.id} s={s} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">Passées</h2>
              <div className="space-y-3 opacity-70">
                {past.map(s => <SessionCard key={s.id} s={s} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
