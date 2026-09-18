'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, CheckCheck, BookOpen, Award, MessageCircle, Zap, Star, X } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  type: 'lesson_complete' | 'certificate' | 'message' | 'new_lesson' | 'review' | 'loyalty' | 'system'
  title: string
  body: string
  url?: string
  is_read: boolean
  created_at: string
}

const ICONS: Record<string, React.ElementType> = {
  lesson_complete: BookOpen,
  certificate: Award,
  message: MessageCircle,
  new_lesson: Zap,
  review: Star,
  loyalty: Star,
  system: Bell,
}

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return 'À l\'instant'
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
  return `Il y a ${Math.floor(diff / 86400)}j`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifs.filter(n => !n.is_read).length

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => setNotifs(d.notifications ?? []))
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function markAllRead() {
    setLoading(true)
    await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: 'all' }) })
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    setLoading(false)
  }

  async function markRead(id: string) {
    await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [id] }) })
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} disabled={loading}
                  className="text-xs text-[#0B3D91] hover:underline flex items-center gap-1 disabled:opacity-50">
                  <CheckCheck className="w-3.5 h-3.5" /> Tout lire
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Liste */}
          <div className="overflow-y-auto max-h-96">
            {notifs.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aucune notification</p>
              </div>
            ) : (
              notifs.map(n => {
                const Icon = ICONS[n.type] ?? Bell
                const content = (
                  <div
                    className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                    onClick={() => { markRead(n.id); setOpen(false) }}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${!n.is_read ? 'bg-[#0B3D91]/10' : 'bg-gray-100'}`}>
                      <Icon className={`w-4 h-4 ${!n.is_read ? 'text-[#0B3D91]' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-[#0B3D91] flex-shrink-0 mt-1.5" />}
                  </div>
                )
                return n.url ? <Link key={n.id} href={n.url}>{content}</Link> : <div key={n.id}>{content}</div>
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
