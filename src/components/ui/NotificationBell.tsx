'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Award, BookOpen, Tag, Info, X, Check, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Notif {
  id: string
  type: string
  title: string
  message?: string
  link?: string
  is_read: boolean
  created_at: string
}

function typeIcon(type: string) {
  switch (type) {
    case 'certificate': return <Award className="w-4 h-4 text-yellow-500" />
    case 'enrollment': return <BookOpen className="w-4 h-4 text-blue-500" />
    case 'promo': return <Tag className="w-4 h-4 text-green-500" />
    default: return <Info className="w-4 h-4 text-gray-400" />
  }
}

function fmtDate(s: string) {
  const d = new Date(s)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return "À l'instant"
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function NotificationBell() {
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifs.filter(n => !n.is_read).length

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setNotifs(data); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'all' }),
    })
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  if (!loaded) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-[#0B3D91] hover:underline flex items-center gap-1">
                  <Check className="w-3 h-3" /> Tout lire
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Liste */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifs.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Aucune notification
              </div>
            ) : notifs.map(n => (
              <div
                key={n.id}
                className={`flex gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors cursor-pointer ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                onClick={() => !n.is_read && markRead(n.id)}
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {typeIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                    {n.title}
                  </p>
                  {n.message && <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.message}</p>}
                  <p className="text-xs text-gray-400 mt-1">{fmtDate(n.created_at)}</p>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                  {!n.is_read && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                  {n.link && (
                    <Link href={n.link} onClick={() => setOpen(false)} className="text-[#0B3D91] hover:text-blue-700">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
