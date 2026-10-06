'use client'

import { useState } from 'react'
import { Sparkles, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  courseId?: string
  label?: string
}

export default function EnrichLessonsButton({ courseId, label }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ updated: number; skipped: number; total: number } | null>(null)

  async function handleEnrich(forceAll: boolean) {
    const msg = forceAll
      ? `⚠️ RÉGÉNÉRER TOUT le contenu ${courseId ? 'de cette formation' : 'de TOUTES les formations'} ?\nCela remplace le contenu existant et peut prendre 5-15 minutes (traitement par vagues de 20 leçons).`
      : `Enrichir les leçons sans contenu riche ${courseId ? 'de cette formation' : '(toutes formations)'} ?`
    if (!confirm(msg)) return

    setStatus('loading')
    setResult(null)

    let totalUpdated = 0
    let totalSkipped = 0

    try {
      // Appels en boucle par vagues de 20 leçons jusqu'à ce qu'il n'y ait plus rien à traiter
      while (true) {
        const res = await fetch('/api/admin/enrich-lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId: courseId ?? null, forceAll, limit: 4 }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Erreur serveur')

        totalUpdated += data.updated
        totalSkipped += data.skipped

        // Mettre à jour l'affichage en temps réel
        setResult({ updated: totalUpdated, skipped: totalSkipped, total: totalUpdated + totalSkipped })

        // Si rien n'a été enrichi ET rien n'a bougé → terminé (évite boucle infinie)
        if (data.updated === 0 && data.skipped === 0) break
        // Si uniquement des erreurs sans progression réelle → stop
        if (data.updated === 0 && !forceAll) break
      }

      setStatus('done')
    } catch (err: any) {
      setStatus('error')
      console.error(err)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Enrichir uniquement les manquants */}
      <button
        onClick={() => handleEnrich(false)}
        disabled={status === 'loading'}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors disabled:opacity-60"
      >
        {status === 'loading'
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Sparkles className="w-3.5 h-3.5" />}
        {status === 'loading' ? 'Génération...' : (label ?? 'Enrichir (IA)')}
      </button>

      {/* Forcer la régénération complète */}
      <button
        onClick={() => handleEnrich(true)}
        disabled={status === 'loading'}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors disabled:opacity-60"
        title="Régénère TOUT le contenu, même celui qui existe"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        {courseId ? 'Régénérer tout' : 'Tout régénérer'}
      </button>

      {status === 'done' && result && (
        <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          <CheckCircle className="w-3.5 h-3.5" />
          {result.updated} enrichie(s) · {result.skipped} ignorée(s)
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
