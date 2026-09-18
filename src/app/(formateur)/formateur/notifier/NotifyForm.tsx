'use client'
import { useState } from 'react'
import { Loader2, Send, CheckCircle } from 'lucide-react'

interface Lesson { id: string; title: string }
interface Module { id: string; title: string; lessons: Lesson[] }
interface Course { id: string; title: string; modules: Module[] }

export default function NotifyForm({ courses }: { courses: Course[] }) {
  const [courseId, setCourseId] = useState('')
  const [lessonId, setLessonId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null)
  const [error, setError] = useState('')

  const selectedCourse = courses.find(c => c.id === courseId)
  const allLessons = selectedCourse?.modules.flatMap(m => m.lessons) ?? []

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!courseId || !lessonId) return
    setLoading(true); setError(''); setResult(null)
    const res = await fetch('/api/notifications/nouvelle-lecon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, lessonId }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) setResult(data)
    else setError(data.error ?? 'Erreur')
  }

  if (result) return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
      <p className="font-bold text-gray-900 text-lg">{result.sent} email{result.sent > 1 ? 's' : ''} envoyé{result.sent > 1 ? 's' : ''}</p>
      <p className="text-gray-500 text-sm mt-1">sur {result.total} apprenant{result.total > 1 ? 's' : ''} inscrits</p>
      <button onClick={() => { setResult(null); setCourseId(''); setLessonId('') }}
        className="mt-5 text-sm text-[#0B3D91] font-medium hover:underline">Envoyer une autre notification</button>
    </div>
  )

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1.5">Formation *</label>
        <select value={courseId} onChange={e => { setCourseId(e.target.value); setLessonId('') }} required
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91] bg-white">
          <option value="">Choisir une formation</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>
      {courseId && (
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Leçon *</label>
          <select value={lessonId} onChange={e => setLessonId(e.target.value)} required
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91] bg-white">
            <option value="">Choisir une leçon</option>
            {allLessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button type="submit" disabled={loading || !courseId || !lessonId}
        className="w-full flex items-center justify-center gap-2 ibig-gradient text-white font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Envoyer la notification
      </button>
    </form>
  )
}
