'use client'

import { ExternalLink, Calendar, Clock, Users, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Session {
  id: string
  title: string
  scheduled_at: string
  duration_minutes: number
  platform: 'zoom' | 'meet' | 'other'
  meeting_url: string
  description?: string
  course: { title: string }
}

const platformLabels = { zoom: '📹 Zoom', meet: '📞 Google Meet', other: '🔗 Autre' }
const platformColors = { zoom: 'bg-blue-50 text-blue-700', meet: 'bg-green-50 text-green-700', other: 'bg-gray-50 text-gray-700' }

export default function LiveSessionList({ sessions }: { sessions: Session[] }) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette session ?')) return
    await fetch(`/api/live-sessions/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  const now = new Date()

  if (!sessions.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
        <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">Aucune session programmée</p>
        <p className="text-sm mt-1">Créez votre première session live ci-dessus</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="p-5 border-b border-gray-100">
        <h2 className="font-bold text-gray-900">Mes sessions live ({sessions.length})</h2>
      </div>
      <div className="divide-y divide-gray-50">
        {sessions.map(s => {
          const date = new Date(s.scheduled_at)
          const isPast = date < now
          const isToday = date.toDateString() === now.toDateString()
          return (
            <div key={s.id} className="p-5 flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${isPast ? 'bg-gray-100' : 'bg-[#0B3D91]/10'}`}>
                <span className={`text-xs font-bold ${isPast ? 'text-gray-400' : 'text-[#0B3D91]'}`}>
                  {date.toLocaleDateString('fr-FR', { day: 'numeric' })}
                </span>
                <span className={`text-[10px] uppercase ${isPast ? 'text-gray-400' : 'text-[#0B3D91]'}`}>
                  {date.toLocaleDateString('fr-FR', { month: 'short' })}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 text-sm">{s.title}</h3>
                  {isToday && <span className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-semibold">Aujourd&apos;hui</span>}
                  {isPast && <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Passée</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{s.course.title}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {s.duration_minutes} min
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${platformColors[s.platform]}`}>
                    {platformLabels[s.platform]}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a href={s.meeting_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B3D91] text-white text-xs font-semibold rounded-lg hover:bg-[#0a3480] transition-colors">
                  Rejoindre <ExternalLink className="w-3 h-3" />
                </a>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
