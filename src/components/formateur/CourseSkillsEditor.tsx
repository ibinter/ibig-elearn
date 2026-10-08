'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Check, X, Target } from 'lucide-react'
import { SKILL_LEVELS } from '@/lib/skills'

type Skill = { id: string; name: string; category: string | null }

/** Compétences développées par la formation (alimente le profil de compétences des apprenants). */
export default function CourseSkillsEditor({ courseId }: { courseId: string }) {
  const [all, setAll] = useState<Skill[]>([])
  const [picked, setPicked] = useState<{ skillId: string; level: number }[]>([])
  const [state, setState] = useState<'loading' | 'idle' | 'saving' | 'saved' | 'error'>('loading')

  useEffect(() => {
    const db = createClient()
    Promise.all([
      db.from('skills').select('id, name, category').order('category').order('name'),
      db.from('course_skills').select('skill_id, level').eq('course_id', courseId),
    ]).then(([s, cs]) => {
      setAll((s.data ?? []) as Skill[])
      setPicked((cs.data ?? []).map(x => ({ skillId: x.skill_id, level: x.level })))
      setState('idle')
    })
  }, [courseId])

  async function save() {
    setState('saving')
    const res = await fetch('/api/formateur/competences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId, skills: picked }) })
    setState(res.ok ? 'saved' : 'error')
    if (res.ok) setTimeout(() => setState('idle'), 1500)
  }

  const name = (id: string) => all.find(s => s.id === id)?.name ?? ''
  const available = all.filter(s => !picked.some(p => p.skillId === s.id))

  return (
    <div className="rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-[#0B3D91]" />
        <p className="text-sm font-medium text-gray-800">Compétences développées</p>
      </div>
      {state === 'loading' ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : (
        <>
          <div className="flex flex-wrap gap-2">
            {picked.map(p => (
              <span key={p.skillId} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 pl-3 pr-1 py-1 text-xs">
                {name(p.skillId)}
                <select value={p.level} onChange={e => setPicked(list => list.map(x => x.skillId === p.skillId ? { ...x, level: Number(e.target.value) } : x))}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold border-0 ${SKILL_LEVELS[p.level].cls}`} aria-label="Niveau">
                  {[1, 2, 3].map(l => <option key={l} value={l}>{SKILL_LEVELS[l].label}</option>)}
                </select>
                <button type="button" onClick={() => setPicked(list => list.filter(x => x.skillId !== p.skillId))} className="p-0.5 text-gray-400 hover:text-red-500" aria-label="Retirer"><X className="w-3.5 h-3.5" /></button>
              </span>
            ))}
            {picked.length === 0 && <p className="text-xs text-gray-400">Aucune compétence associée.</p>}
          </div>
          {available.length > 0 && picked.length < 12 && (
            <select value="" onChange={e => e.target.value && setPicked(list => [...list, { skillId: e.target.value, level: 2 }])}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">+ Ajouter une compétence…</option>
              {available.map(s => <option key={s.id} value={s.id}>{s.category ? `${s.category} — ` : ''}{s.name}</option>)}
            </select>
          )}
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-gray-400">Visibles sur la fiche formation ; acquises par l&apos;apprenant à la fin de la formation.</p>
            <button type="button" onClick={save} disabled={state === 'saving'}
              className="flex items-center gap-1.5 bg-[#0B3D91] text-white text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-60">
              {state === 'saving' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : state === 'saved' ? <Check className="w-3.5 h-3.5" /> : null}
              {state === 'saved' ? 'Enregistré' : state === 'error' ? 'Réessayer' : 'Enregistrer'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
