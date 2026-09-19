'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { FileText, Save, CheckCircle, Loader2 } from 'lucide-react'

interface Props {
  lessonId: string
  courseId: string
}

export default function LessonNotes({ lessonId, courseId }: Props) {
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [open, setOpen] = useState(false)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSaved = useRef('')

  // Charger la note
  useEffect(() => {
    setContent('')
    setStatus('idle')
    fetch(`/api/notes?lesson_id=${lessonId}`)
      .then(r => r.json())
      .then(d => { setContent(d.content ?? ''); lastSaved.current = d.content ?? '' })
  }, [lessonId])

  const save = useCallback(async (text: string) => {
    if (text === lastSaved.current) return
    setStatus('saving')
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson_id: lessonId, course_id: courseId, content: text }),
    })
    lastSaved.current = text
    setStatus('saved')
    setTimeout(() => setStatus('idle'), 2000)
  }, [lessonId, courseId])

  const onChange = (val: string) => {
    setContent(val)
    setStatus('idle')
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => save(val), 1500)
  }

  return (
    <div className="border-t border-gray-100">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <FileText className="w-4 h-4 text-[#0B3D91]" />
        <span className="flex-1 text-left">Mes notes</span>
        {content && <span className="w-2 h-2 rounded-full bg-[#0B3D91]" title="Note enregistrée" />}
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2">
          <textarea
            value={content}
            onChange={e => onChange(e.target.value)}
            rows={6}
            placeholder="Prenez des notes sur cette leçon… elles sont sauvegardées automatiquement."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 resize-none placeholder:text-gray-400"
          />
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{content.length} caractère{content.length !== 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1">
              {status === 'saving' && <><Loader2 className="w-3 h-3 animate-spin" /> Sauvegarde…</>}
              {status === 'saved' && <><CheckCircle className="w-3 h-3 text-green-500" /> Sauvegardé</>}
              {status === 'idle' && content && <><Save className="w-3 h-3" /> Auto-save actif</>}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
