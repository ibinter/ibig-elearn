import { createClient } from '@/lib/supabase/server'
import { Video, Calendar, Clock, ExternalLink, Users } from 'lucide-react'

export default async function AdminSessionsLivePage() {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from('live_sessions')
    .select('*, course:courses(title, slug), instructor:profiles(full_name, email)')
    .order('scheduled_at', { ascending: false })

  const now = new Date()
  const upcoming = sessions?.filter(s => new Date(s.scheduled_at) >= now) ?? []
  const past = sessions?.filter(s => new Date(s.scheduled_at) < now) ?? []

  const platformLabel: Record<string, string> = { zoom: 'Zoom', meet: 'Google Meet', other: 'Autre' }

  const SessionRow = ({ s }: { s: any }) => {
    const date = new Date(s.scheduled_at)
    const isNow = date <= now && new Date(date.getTime() + s.duration_minutes * 60000) > now
    return (
      <tr className="hover:bg-gray-50 border-b border-gray-50">
        <td className="px-5 py-3">
          <div className="flex items-center gap-2">
            {isNow && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />}
            <div>
              <p className="text-sm font-medium text-gray-900">{s.title}</p>
              {isNow && <span className="text-[10px] text-green-600 font-bold">En cours</span>}
            </div>
          </div>
        </td>
        <td className="px-5 py-3 text-sm text-gray-600">{(s.course as any)?.title ?? '—'}</td>
        <td className="px-5 py-3 text-sm text-gray-600">{(s.instructor as any)?.full_name ?? '—'}</td>
        <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
          {date.toLocaleDateString('fr-FR')} {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </td>
        <td className="px-5 py-3 text-sm text-gray-500">{s.duration_minutes} min · {platformLabel[s.platform] ?? s.platform}</td>
        <td className="px-5 py-3">
          <a href={s.meeting_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-[#0B3D91] hover:underline">
            Lien <ExternalLink className="w-3 h-3" />
          </a>
        </td>
      </tr>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Video className="w-6 h-6 text-[#0B3D91]" /> Classes virtuelles
        </h1>
        <p className="text-gray-500 text-sm mt-1">Toutes les sessions live planifiées par les formateurs</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-[#0B3D91]">{upcoming.length}</div>
          <div className="text-xs text-gray-500 mt-1">Sessions à venir</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">{past.length}</div>
          <div className="text-xs text-gray-500 mt-1">Sessions passées</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{sessions?.filter(s => {
            const d = new Date(s.scheduled_at)
            return d <= now && new Date(d.getTime() + s.duration_minutes * 60000) > now
          }).length ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">En cours maintenant</div>
        </div>
      </div>

      {!sessions?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Video className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-500">Aucune session live</p>
          <p className="text-sm text-gray-400 mt-1">Les formateurs n'ont pas encore planifié de sessions</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0B3D91]" />
                <h2 className="font-semibold text-gray-900">À venir ({upcoming.length})</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500">Titre</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500">Formation</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500">Formateur</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500">Date</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500">Durée/Plateforme</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500">Lien</th>
                  </tr>
                </thead>
                <tbody>{upcoming.map(s => <SessionRow key={s.id} s={s} />)}</tbody>
              </table>
            </div>
          )}
          {past.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <h2 className="font-semibold text-gray-900 text-gray-500">Passées ({past.length})</h2>
              </div>
              <table className="w-full opacity-70">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500">Titre</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500">Formation</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500">Formateur</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500">Date</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500">Durée/Plateforme</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500">Lien</th>
                  </tr>
                </thead>
                <tbody>{past.slice(0, 20).map(s => <SessionRow key={s.id} s={s} />)}</tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
