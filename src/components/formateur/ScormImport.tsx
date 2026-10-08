'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PackageOpen, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

type Step = 'idle' | 'upload' | 'process' | 'done' | 'error'

/** Import d'un paquet SCORM 1.2 / 2004 ou xAPI (ZIP) : crée une leçon « Module interactif » en fin de module. */
export default function ScormImport({ courseId, moduleId, onImported }: { courseId: string; moduleId: string; onImported: () => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('idle')
  const [msg, setMsg] = useState('')
  const [pct, setPct] = useState(0)

  async function handle(file: File) {
    if (!file.name.toLowerCase().endsWith('.zip')) { setStep('error'); setMsg('Choisissez le fichier .zip exporté par votre outil auteur.'); return }
    setStep('upload'); setMsg(''); setPct(0)
    try {
      const r1 = await fetch('/api/scorm/upload-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId, size: file.size }) })
      const up = await r1.json()
      if (!r1.ok) throw new Error(up.error)

      // Progression simulée : l'envoi direct au stockage n'expose pas d'événement de progression
      const tick = setInterval(() => setPct(p => Math.min(95, p + Math.max(1, Math.round(3e7 / Math.max(file.size, 1e6))))), 400)
      const { error } = await createClient().storage.from('scorm').uploadToSignedUrl(up.path, up.token, file, { contentType: 'application/zip' })
      clearInterval(tick)
      if (error) throw new Error(error.message)
      setPct(100)

      setStep('process')
      const r2 = await fetch('/api/scorm/process', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, moduleId, uploadPath: up.path, title: file.name.replace(/\.zip$/i, '').replace(/[_-]+/g, ' ') }),
      })
      const res = await r2.json()
      if (!r2.ok) throw new Error(res.error)
      setStep('done')
      setMsg(`« ${res.title} » importé (${res.standard === 'xapi' ? 'xAPI' : res.standard === 'scorm2004' ? 'SCORM 2004' : 'SCORM 1.2'}, ${res.files} fichiers).`)
      onImported()
    } catch (e) {
      setStep('error')
      setMsg((e as Error).message || 'Import impossible')
    } finally {
      if (input.current) input.current.value = ''
    }
  }

  const busy = step === 'upload' || step === 'process'
  return (
    <div className="border-t border-gray-50 px-4 py-3">
      <input ref={input} type="file" accept=".zip,application/zip" className="hidden" onChange={e => e.target.files?.[0] && handle(e.target.files[0])} />
      <button type="button" disabled={busy} onClick={() => input.current?.click()}
        className="flex items-center gap-2 text-sm text-purple-700 hover:text-purple-900 disabled:opacity-60">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageOpen className="w-4 h-4" />}
        {step === 'upload' ? `Envoi du paquet… ${pct} %` : step === 'process' ? 'Décompression et vérification…' : 'Importer un module SCORM / xAPI (.zip)'}
      </button>
      {step === 'done' && <p className="mt-1.5 text-xs text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {msg}</p>}
      {step === 'error' && <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {msg}</p>}
      {step === 'idle' && <p className="mt-1 text-[11px] text-gray-400">Articulate Storyline / Rise, iSpring, Captivate, Elucidat… · SCORM 1.2, SCORM 2004 ou xAPI · 500 Mo max.</p>}
    </div>
  )
}
