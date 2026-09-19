'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Send, Users, Loader2, CheckCircle, Megaphone, BookOpen, Award, Video } from 'lucide-react'

type Profile = { id: string; full_name: string; email: string; role: string; country: string | null }

const notifTypes = [
  { value: 'system', label: 'Annonce générale', icon: Megaphone },
  { value: 'enrollment', label: 'Formation', icon: BookOpen },
  { value: 'certificate', label: 'Certificat', icon: Award },
  { value: 'live', label: 'Session live', icon: Video },
]

export default function AdminNotificationsPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [target, setTarget] = useState<'all' | 'role' | 'specific'>('all')
  const [role, setRole] = useState('apprenant')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [type, setType] = useState('system')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [link, setLink] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<number>(0)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('profiles').select('id, full_name, email, role, country').order('full_name').then(({ data }) => {
      setUsers(data ?? [])
    })
  }, [])

  async function handleSend() {
    if (!title.trim()) return
    setSending(true)
    setSent(0)

    let targetIds: string[] = []
    if (target === 'all') {
      targetIds = users.map(u => u.id)
    } else if (target === 'role') {
      targetIds = users.filter(u => u.role === role).map(u => u.id)
    } else {
      targetIds = selectedUsers
    }

    // Batch insert notifications
    const notifs = targetIds.map(user_id => ({
      user_id, type, title: title.trim(),
      body: body.trim() || null,
      link: link.trim() || null,
    }))

    const batchSize = 50
    let count = 0
    for (let i = 0; i < notifs.length; i += batchSize) {
      await supabase.from('notifications').insert(notifs.slice(i, i + batchSize))
      count += Math.min(batchSize, notifs.length - i)
    }

    setSent(count)
    setSending(false)
    setTitle('')
    setBody('')
    setLink('')
  }

  const estimatedCount = target === 'all'
    ? users.length
    : target === 'role'
    ? users.filter(u => u.role === role).length
    : selectedUsers.length

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
          <Bell className="w-6 h-6 text-[#0B3D91]" /> Envoyer des notifications
        </h1>
        <p className="text-gray-500 text-sm">Notifiez vos apprenants directement dans leur tableau de bord</p>
      </div>

      {sent > 0 && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3 text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-semibold">{sent} notification{sent > 1 ? 's' : ''} envoyée{sent > 1 ? 's' : ''} avec succès !</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        {/* Audience */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0B3D91]" /> Audience
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { value: 'all', label: 'Tous les utilisateurs' },
              { value: 'role', label: 'Par rôle' },
              { value: 'specific', label: 'Spécifique' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setTarget(opt.value as any)}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${target === opt.value ? 'ibig-gradient text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {target === 'role' && (
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 focus:border-[#0B3D91]"
            >
              {['apprenant', 'formateur', 'coordinateur', 'admin'].map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}s</option>
              ))}
            </select>
          )}

          {target === 'specific' && (
            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              {users.map(u => (
                <label key={u.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(u.id)}
                    onChange={e => setSelectedUsers(prev => e.target.checked ? [...prev, u.id] : prev.filter(id => id !== u.id))}
                    className="rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email} · {u.role}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-2">
            {estimatedCount} destinataire{estimatedCount > 1 ? 's' : ''} sélectionné{estimatedCount > 1 ? 's' : ''}
          </p>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Type de notification</label>
          <div className="flex flex-wrap gap-2">
            {notifTypes.map(t => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${type === t.value ? 'ibig-gradient text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">Titre *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Nouvelle formation disponible !"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 focus:border-[#0B3D91]"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">Message (optionnel)</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={3}
            placeholder="Détails supplémentaires..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 focus:border-[#0B3D91] resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">Lien de redirection (optionnel)</label>
          <input
            type="text"
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="Ex: /catalogue ou /parcours/marketing-digital"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 focus:border-[#0B3D91]"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={sending || !title.trim() || estimatedCount === 0}
          className="w-full flex items-center justify-center gap-2 ibig-gradient text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {sending ? 'Envoi en cours...' : `Envoyer à ${estimatedCount} destinataire${estimatedCount > 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}
