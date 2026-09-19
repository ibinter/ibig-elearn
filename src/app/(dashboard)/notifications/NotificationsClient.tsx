'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, BookOpen, Award, MessageCircle, Video, Star, Megaphone, CheckCheck, Trash2 } from 'lucide-react'
import Link from 'next/link'

type Notif = {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

const typeIcon: Record<string, React.ReactNode> = {
  enrollment: <BookOpen className="w-5 h-5 text-blue-600" />,
  certificate: <Award className="w-5 h-5 text-yellow-600" />,
  message: <MessageCircle className="w-5 h-5 text-green-600" />,
  live: <Video className="w-5 h-5 text-red-600" />,
  achievement: <Star className="w-5 h-5 text-purple-600" />,
  system: <Megaphone className="w-5 h-5 text-gray-600" />,
}

const typeBg: Record<string, string> = {
  enrollment: 'bg-blue-50',
  certificate: 'bg-yellow-50',
  message: 'bg-green-50',
  live: 'bg-red-50',
  achievement: 'bg-purple-50',
  system: 'bg-gray-50',
}

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000
  if (diff < 60) return 'À l\'instant'
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} jours`
  return new Date(date).toLocaleDateString('fr-FR')
}

export default function NotificationsClient({ initialNotifs }: { initialNotifs: Notif[] }) {
  const [notifs, setNotifs] = useState<Notif[]>(initialNotifs)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const supabase = createClient()

  const displayed = filter === 'unread' ? notifs.filter(n => !n.is_read) : notifs
  const unreadCount = notifs.filter(n => !n.is_read).length

  async function markAllRead() {
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function deleteNotif(id: string) {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifs(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#0B3D91]" /> Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 text-sm text-[#0B3D91] font-semibold hover:underline">
            <CheckCheck className="w-4 h-4" /> Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'unread'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${filter === f ? 'ibig-gradient text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {f === 'all' ? 'Toutes' : `Non lues (${unreadCount})`}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">
            {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {displayed.map((n, i) => {
            const content = (
              <div
                className={`flex gap-4 px-5 py-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 group ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                onClick={() => !n.is_read && markRead(n.id)}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeBg[n.type] ?? 'bg-gray-50'}`}>
                  {typeIcon[n.type] ?? <Bell className="w-5 h-5 text-gray-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!n.is_read && <span className="w-2 h-2 bg-[#0B3D91] rounded-full" />}
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); deleteNotif(n.id) }}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {n.body && <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>}
                  <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            )

            return n.link
              ? <Link key={n.id} href={n.link}>{content}</Link>
              : <div key={n.id}>{content}</div>
          })}
        </div>
      )}
    </div>
  )
}
