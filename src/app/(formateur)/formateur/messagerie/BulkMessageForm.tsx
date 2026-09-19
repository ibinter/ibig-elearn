'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Loader2, Users } from 'lucide-react'

interface Course { id: string; title: string; enrollments?: { count: number }[] }

export default function BulkMessageForm({ courses }: { courses: Course[] }) {
  const router = useRouter()
  const [courseId, setCourseId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const selectedCourse = courses.find(c => c.id === courseId)
  const enrollCount = (selectedCourse?.enrollments as any)?.[0]?.count ?? 0

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!courseId || !subject.trim() || !body.trim()) { setError('Tous les champs sont requis'); return }
    if (!confirm(`Envoyer ce message à ${enrollCount} apprenant(s) ?`)) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/formateur/messagerie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, subject: subject.trim(), body: body.trim() }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Erreur'); }
    else { setSuccess(true); setSubject(''); setBody(''); setCourseId(''); router.refresh() }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-bold text-gray-900 mb-5">Nouveau message</h2>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 font-medium">
          Message envoyé avec succès à {enrollCount} apprenant(s) !
        </div>
      )}

      <form onSubmit={send} className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Formation</label>
          <select value={courseId} onChange={e => setCourseId(e.target.value)} required
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]">
            <option value="">Choisir une formation</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title} ({(c.enrollments as any)?.[0]?.count ?? 0} apprenants)</option>
            ))}
          </select>
          {courseId && (
            <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
              <Users className="w-3 h-3" /> {enrollCount} destinataire(s)
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Objet</label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required
            placeholder="Ex: Nouveaux contenus disponibles !"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} required rows={5}
            placeholder="Écrivez votre message ici..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91] resize-none" />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

        <button type="submit" disabled={loading || !courseId}
          className="flex items-center gap-2 bg-[#0B3D91] hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Envoyer à tous les apprenants
        </button>
      </form>
    </div>
  )
}
