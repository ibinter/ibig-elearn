'use client'

import { useState } from 'react'
import { Video, Plus, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  courses: { id: string; title: string }[]
  instructorId: string
}

export default function LiveSessionForm({ courses, instructorId }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    course_id: '',
    title: '',
    description: '',
    scheduled_at: '',
    duration_minutes: 60,
    meeting_url: '',
    platform: 'zoom' as 'zoom' | 'meet' | 'other',
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/live-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, instructor_id: instructorId }),
      })
      if (res.ok) {
        setOpen(false)
        setForm({ course_id: '', title: '', description: '', scheduled_at: '', duration_minutes: 60, meeting_url: '', platform: 'zoom' })
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  const platformIcons = { zoom: '📹', meet: '📞', other: '🔗' }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      {!open ? (
        <button onClick={() => setOpen(true)} className="w-full flex items-center gap-3 p-5 text-left hover:bg-gray-50 rounded-2xl transition-colors">
          <div className="w-10 h-10 rounded-xl bg-[#0B3D91]/10 flex items-center justify-center">
            <Plus className="w-5 h-5 text-[#0B3D91]" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Planifier une session live</p>
            <p className="text-sm text-gray-500">Zoom, Google Meet ou autre lien de réunion</p>
          </div>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <h3 className="font-bold text-gray-900">Nouvelle session live</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Formation</label>
              <select
                required
                value={form.course_id}
                onChange={e => setForm(p => ({ ...p, course_id: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0B3D91]"
              >
                <option value="">Sélectionner une formation</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Titre de la session</label>
              <input
                required value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Q&A module 3 — Fondamentaux"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0B3D91]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Date et heure</label>
              <input
                type="datetime-local" required value={form.scheduled_at}
                onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0B3D91]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Durée (minutes)</label>
              <input
                type="number" min={15} max={480} value={form.duration_minutes}
                onChange={e => setForm(p => ({ ...p, duration_minutes: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0B3D91]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Plateforme</label>
              <select
                value={form.platform}
                onChange={e => setForm(p => ({ ...p, platform: e.target.value as any }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0B3D91]"
              >
                <option value="zoom">📹 Zoom</option>
                <option value="meet">📞 Google Meet</option>
                <option value="other">🔗 Autre</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Lien de réunion</label>
              <input
                required value={form.meeting_url}
                onChange={e => setForm(p => ({ ...p, meeting_url: e.target.value }))}
                placeholder="https://zoom.us/j/..."
                type="url"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0B3D91]"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Description (optionnel)</label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={2}
                placeholder="Décrivez le contenu de la session..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#0B3D91]"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#0B3D91] text-white rounded-xl text-sm font-semibold hover:bg-[#0a3480] disabled:opacity-50 transition-colors">
              {saving ? 'Création...' : 'Créer la session'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
