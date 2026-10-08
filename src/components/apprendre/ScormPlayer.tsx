'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Maximize2, Minimize2, CheckCircle2, Loader2 } from 'lucide-react'

type Props = {
  packageId: string
  lessonId: string
  standard: 'scorm12' | 'scorm2004' | 'xapi'
  launchUrl: string               // URL déjà résolue (paramètres xAPI inclus)
  initialCmi: Record<string, string>
  learnerId: string
  learnerName: string
  alreadyCompleted: boolean
}

type ScormWindow = Window & { API?: unknown; API_1484_11?: unknown }

/**
 * Lecteur SCORM 1.2 / 2004 et xAPI.
 * Le module s'exécute dans une iframe du même domaine et dialogue avec l'API
 * exposée sur cette fenêtre ; l'état est enregistré côté serveur (reprise, score, réussite).
 */
export default function ScormPlayer({ packageId, lessonId, standard, launchUrl, initialCmi, learnerId, learnerName, alreadyCompleted }: Props) {
  const router = useRouter()
  const box = useRef<HTMLDivElement>(null)
  const [full, setFull] = useState(false)
  const [completed, setCompleted] = useState(alreadyCompleted)
  const [saving, setSaving] = useState(false)
  // Le module ne doit se charger qu'une fois l'API SCORM installée sur cette fenêtre
  const [apiReady, setApiReady] = useState(standard === 'xapi')

  useEffect(() => {
    if (standard === 'xapi') return
    const is2004 = standard === 'scorm2004'
    const w = window as ScormWindow

    // État initial : reprise de la tentative précédente
    const cmi: Record<string, string> = { ...initialCmi }
    const resuming = Object.keys(initialCmi).length > 0
    if (is2004) { cmi['cmi.learner_id'] = learnerId; cmi['cmi.learner_name'] = learnerName }
    else { cmi['cmi.core.student_id'] = learnerId; cmi['cmi.core.student_name'] = learnerName }
    if (is2004) {
      cmi['cmi.entry'] = resuming && cmi['cmi.exit'] === 'suspend' ? 'resume' : 'ab-initio'
      cmi['cmi.completion_status'] ??= 'not attempted'
      cmi['cmi.success_status'] ??= 'unknown'
      cmi['cmi.mode'] = 'normal'; cmi['cmi.credit'] = 'credit'
      cmi['cmi._version'] = '1.0'
    } else {
      cmi['cmi.core.entry'] = resuming && cmi['cmi.core.exit'] === 'suspend' ? 'resume' : 'ab-initio'
      cmi['cmi.core.lesson_status'] ??= 'not attempted'
      cmi['cmi.core.lesson_mode'] = 'normal'; cmi['cmi.core.credit'] = 'credit'
    }
    delete cmi['cmi.session_time']; delete cmi['cmi.core.session_time']

    let lastError = '0'
    let initialized = false
    let finished = false
    let dirty = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const send = async (final = false) => {
      dirty = false
      const payload = JSON.stringify({ packageId, lessonId, cmi, final })
      if (final && navigator.sendBeacon) {
        navigator.sendBeacon('/api/scorm/commit', new Blob([payload], { type: 'application/json' }))
        return
      }
      setSaving(true)
      try {
        const res = await fetch('/api/scorm/commit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true })
        const data = await res.json().catch(() => ({}))
        if (data.completed) { setCompleted(true); router.refresh() }
      } catch { dirty = true } finally { setSaving(false) }
    }
    const schedule = () => { dirty = true; if (timer) clearTimeout(timer); timer = setTimeout(() => send(), 1500) }

    // Collections (interactions, objectifs) : *._count calculé à partir des clés écrites
    const count = (prefix: string) => {
      const idx = new Set<number>()
      for (const k of Object.keys(cmi)) { const m = k.slice(prefix.length).match(/^\.(\d+)\./); if (k.startsWith(prefix) && m) idx.add(+m[1]) }
      return String(idx.size)
    }
    const get = (key: string) => {
      if (!initialized) { lastError = is2004 ? '122' : '301'; return '' }
      lastError = '0'
      if (key.endsWith('._count')) return count(key.slice(0, -'._count'.length))
      if (key.endsWith('._children')) return ''
      if (key === 'cmi.core.score._children') return 'raw,min,max'
      return cmi[key] ?? ''
    }
    const set = (key: string, value: string) => {
      if (!initialized || finished) { lastError = is2004 ? '132' : '301'; return 'false' }
      lastError = '0'
      cmi[key] = String(value)
      schedule()
      return 'true'
    }
    const commit = () => { if (dirty || timer) { if (timer) clearTimeout(timer); timer = null; void send() } lastError = '0'; return 'true' }
    const finish = () => {
      if (finished) return 'true'
      finished = true
      if (timer) clearTimeout(timer)
      void send()
      lastError = '0'
      return 'true'
    }
    const errorString = (code: string) => ({ '0': 'No error', '101': 'General exception', '122': 'Retrieve data before initialization', '132': 'Store data before initialization', '301': 'Not initialized' } as Record<string, string>)[code] ?? 'Error'

    if (is2004) {
      w.API_1484_11 = {
        Initialize: () => { initialized = true; lastError = '0'; return 'true' },
        Terminate: () => finish(),
        GetValue: (k: string) => get(k),
        SetValue: (k: string, v: string) => set(k, v),
        Commit: () => commit(),
        GetLastError: () => lastError,
        GetErrorString: (c: string) => errorString(c),
        GetDiagnostic: (c: string) => errorString(c),
      }
    } else {
      w.API = {
        LMSInitialize: () => { initialized = true; lastError = '0'; return 'true' },
        LMSFinish: () => finish(),
        LMSGetValue: (k: string) => get(k),
        LMSSetValue: (k: string, v: string) => set(k, v),
        LMSCommit: () => commit(),
        LMSGetLastError: () => lastError,
        LMSGetErrorString: (c: string) => errorString(c),
        LMSGetDiagnostic: (c: string) => errorString(c),
      }
    }

    setApiReady(true)

    // Sauvegarde finale si l'apprenant ferme l'onglet sans que le module ait terminé
    const onLeave = () => { if (initialized && !finished) void send(true) }
    window.addEventListener('pagehide', onLeave)
    return () => {
      window.removeEventListener('pagehide', onLeave)
      if (initialized && !finished && dirty) void send(true)
      delete w.API; delete w.API_1484_11
      if (timer) clearTimeout(timer)
    }
  }, [packageId, lessonId, standard, initialCmi, learnerId, learnerName, router])

  // xAPI : la complétion est remontée par le LRS ; on rafraîchit périodiquement l'état
  useEffect(() => {
    if (standard !== 'xapi' || completed) return
    const id = setInterval(async () => {
      const res = await fetch(`/api/scorm/commit?lessonId=${lessonId}`).catch(() => null)
      const data = await res?.json().catch(() => null)
      if (data?.completed) { setCompleted(true); router.refresh() }
    }, 15000)
    return () => clearInterval(id)
  }, [standard, completed, lessonId, router])

  useEffect(() => {
    const onFs = () => setFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  return (
    <div ref={box} className="bg-[#0b1220] w-full">
      <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2 text-xs text-gray-300">
        <span className="flex items-center gap-2">
          <span className="font-semibold uppercase tracking-wider text-[#FFA500]">{standard === 'xapi' ? 'xAPI' : standard === 'scorm2004' ? 'SCORM 2004' : 'SCORM 1.2'}</span>
          {completed
            ? <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Module terminé</span>
            : saving ? <span className="flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enregistrement…</span>
            : <span>Votre progression est enregistrée automatiquement</span>}
        </span>
        <button type="button" onClick={() => full ? document.exitFullscreen() : box.current?.requestFullscreen()}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-white/10" aria-label="Plein écran">
          {full ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{full ? 'Quitter le plein écran' : 'Plein écran'}</span>
        </button>
      </div>
      {apiReady && <iframe
        src={launchUrl}
        title="Module interactif"
        className={`w-full bg-white border-0 ${full ? 'h-[calc(100vh-36px)]' : 'h-[70vh] min-h-[460px]'}`}
        allow="fullscreen; autoplay; clipboard-write"
        allowFullScreen
      />}
    </div>
  )
}
