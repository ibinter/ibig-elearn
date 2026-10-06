'use client'

import { useState } from 'react'
import { Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface Props {
  courseId?: string
  label?: string
}

export default function EnrichLessonsButton({ courseId, label }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ updated: number; skipped: number; total: number } | null>(null)

  async function handleEnrich() {
    if (!confirm(courseId
      ? 'Enrichir le contenu des leçons de cette formation avec l\'IA ? (leçons sans contenu ou < 400 caractères)'
      : 'Enrichir le contenu de TOUTES les formations ? Cela peut prendre plusieurs minutes.'))
      return

    setStatus('loading')
    setResult(null)

    try {
      const res = await fetch('/api/admin/enrich-lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: courseId ?? null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur serveur')
      setResult({ updated: data.updated, skipped: data.skipped, total: data.total })
      setStatus('done')
    } catch (err: any) {
      setStatus('error')
      console.error(err)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleEnrich}
        disabled={status === 'loading'}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors disabled:opacity-60"
      >
        {status === 'loading'
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Sparkles className="w-3.5 h-3.5" />}
        {status === 'loading' ? 'Génération en cours...' : (label ?? 'Enrichir les leçons (IA)')}
      </button>

      {status === 'done' && result && (
        <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          <CheckCircle className="w-3.5 h-3.5" />
          {result.updated} leçon(s) enrichie(s) · {result.skipped} ignorée(s)
        </span>
      )}
      {status === 'error' && (
        <span className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
          <AlertCircle className="w-3.5 h-3.5" />
          Erreur — voir console
        </span>
      )}
    </div>
  )
}
