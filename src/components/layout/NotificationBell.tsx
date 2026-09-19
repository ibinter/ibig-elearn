'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, BookOpen, Award, MessageCircle, Video, Star, Megaphone, X, CheckCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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
  enrollment: <BookOpen className="w-4 h-4 text-blue-600" />,
  certificate: <Award className="w-4 h-4 text-yellow-600" />,
  message: <MessageCircle className="w-4 h-4 text-green-600" />,
  live: <Video className="w-4 h-4 text-red-600" />,
  achievement: <Star className="w-4 h-4 text-purple-600" />,
  system: <Megaphone className="w-4 h-4 text-gray-600" />,
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
  if (diff < 3600) return `${Math.floor(diff / 60)} min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}j`
}

export default function NotificationBell() {
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const unread = notifs.filter(n => !n.is_read).length

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)

      setNotifs(data ?? [])

      // Realtime subscription
      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => setNotifs(prev => [payload.new as Notif, ...prev])
        )
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
    load()
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function markAllRead() {
    const ids = notifs.filter(n => !n.is_read).map(n => n.id)
    if (!ids.length) return
    await supabase.from('notifications').update({ is_read: true }).in('id', ids)
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl text-gray-500 hover:text-[#0B3D91] hover:bg-blue-50 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
            style={{ width: 18, height: 18, fontSize: 10 }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-[#0B3D91] hover:underline flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" /> Tout lire
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              notifs.map(n => {
                const content = (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`flex gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${!n.is_read ? 'bg-blue-50/40' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${typeBg[n.type] ?? 'bg-gray-50'}`}>
                      {typeIcon[n.type] ?? <Bell className="w-4 h-4 text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-xs leading-snug ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                        {!n.is_read && <span className="w-2 h-2 bg-[#0B3D91] rounded-full flex-shrink-0 mt-1" />}
                      </div>
                      {n.body && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>}
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                )
                return n.link
                  ? <Link key={n.id} href={n.link} onClick={() => setOpen(false)}>{content}</Link>
                  : <div key={n.id}>{content}</div>
              })
            )}
          </div>

          {notifs.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 text-center">
              <Link href="/notifications" onClick={() => setOpen(false)} className="text-xs text-[#0B3D91] font-semibold hover:underline">
                Voir toutes les notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
