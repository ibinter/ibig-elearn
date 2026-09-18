'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Save, Plus, Trash2, GripVertical, Eye, EyeOff,
  ChevronDown, ChevronRight, Video, FileText, CheckSquare,
  ArrowLeft, Loader2, Globe
} from 'lucide-react'

interface Category { id: string; name: string }
interface Lesson {
  id?: string; title: string; type: string
  video_url?: string; content?: string
  position: number; is_free_preview: boolean; _new?: boolean
}
interface Module {
  id?: string; title: string; position: number
  lessons: Lesson[]; _open?: boolean; _new?: boolean
}
interface CourseData {
  id?: string; slug?: string; title: string; description: string
  short_description: string; category_id: string; level: string
  price_xof: number; thumbnail_url: string; is_published: boolean
  objectives: string[]; requirements: string[]; modules: Module[]
}

const LESSON_ICONS: Record<string, any> = {
  video: Video, document: FileText, quiz: CheckSquare, assignment: CheckSquare,
}

const STEP_LABELS = ['Informations', 'Contenu', 'Publication']

export default function CourseEditor({
  categories,
  initialCourse,
}: {
  categories: Category[]
  initialCourse?: any
}) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [courseId, setCourseId] = useState<string | undefined>(initialCourse?.id)
  const [courseSlug, setCourseSlug] = useState<string | undefined>(initialCourse?.slug)

  const [form, setForm] = useState<CourseData>({
    title: initialCourse?.title ?? '',
    description: initialCourse?.description ?? '',
    short_description: initialCourse?.short_description ?? '',
    category_id: initialCourse?.category_id ?? '',
    level: initialCourse?.level ?? 'debutant',
    price_xof: initialCourse?.price_xof ?? 0,
    thumbnail_url: initialCourse?.thumbnail_url ?? '',
    is_published: initialCourse?.is_published ?? false,
    objectives: initialCourse?.objectives ?? [''],
    requirements: initialCourse?.requirements ?? [''],
    modules: (initialCourse?.modules ?? []).map((m: any) => ({ ...m, _open: true })),
    id: initialCourse?.id,
    slug: initialCourse?.slug,
  })

  const set = (key: keyof CourseData, val: any) => setForm(f => ({ ...f, [key]: val }))

  // ── Sauvegarde infos ──
  const saveInfos = async () => {
    setSaving(true); setError(null)
    try {
      const payload = {
        title: form.title, description: form.description,
        short_description: form.short_description,
        category_id: form.category_id || null,
        level: form.level, price_xof: form.price_xof,
        thumbnail_url: form.thumbnail_url || null,
        objectives: form.objectives.filter(Boolean),
        requirements: form.requirements.filter(Boolean),
      }
      if (courseId) {
        await fetch('/api/formateur/cours', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: courseId, ...payload }),
        })
      } else {
        const res = await fetch('/api/formateur/cours', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setCourseId(data.id)
        setCourseSlug(data.slug)
      }
      setStep(1)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  // ── Module ──
  const addModule = () => setForm(f => ({
    ...f,
    modules: [...f.modules, { title: 'Nouveau module', position: f.modules.length, lessons: [], _open: true, _new: true }]
  }))

  const saveModule = async (idx: number) => {
    const m = form.modules[idx]
    if (!courseId) { setError('Sauvegardez d\'abord les informations.'); return }
    try {
      if (m._new) {
        const res = await fetch('/api/formateur/modules', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_id: courseId, title: m.title, position: m.position }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setForm(f => {
          const mods = [...f.modules]
          mods[idx] = { ...mods[idx], id: data.id, _new: false }
          return { ...f, modules: mods }
        })
      } else if (m.id) {
        await fetch('/api/formateur/modules', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: m.id, title: m.title }),
        })
      }
    } catch (e: any) { setError(e.message) }
  }

  const deleteModule = async (idx: number) => {
    const m = form.modules[idx]
    if (m.id) {
      await fetch('/api/formateur/modules', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: m.id }),
      })
    }
    setForm(f => ({ ...f, modules: f.modules.filter((_, i) => i !== idx) }))
  }

  // ── Leçon ──
  const addLesson = (modIdx: number) => setForm(f => {
    const mods = [...f.modules]
    mods[modIdx] = {
      ...mods[modIdx],
      lessons: [...mods[modIdx].lessons, {
        title: 'Nouvelle leçon', type: 'video', position: mods[modIdx].lessons.length,
        is_free_preview: false, _new: true,
      }]
    }
    return { ...f, modules: mods }
  })

  const saveLesson = async (modIdx: number, lesIdx: number) => {
    const m = form.modules[modIdx]
    const l = m.lessons[lesIdx]
    if (!m.id) { setError('Sauvegardez d\'abord le module.'); return }
    try {
      if (l._new) {
        const res = await fetch('/api/formateur/lecons', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            module_id: m.id, course_id: courseId, title: l.title,
            type: l.type, video_url: l.video_url, content: l.content,
            position: l.position, is_free_preview: l.is_free_preview,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setForm(f => {
          const mods = [...f.modules]
          const lessons = [...mods[modIdx].lessons]
          lessons[lesIdx] = { ...lessons[lesIdx], id: data.id, _new: false }
          mods[modIdx] = { ...mods[modIdx], lessons }
          return { ...f, modules: mods }
        })
      } else if (l.id) {
        await fetch('/api/formateur/lecons', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: l.id, title: l.title, type: l.type, video_url: l.video_url, content: l.content, is_free_preview: l.is_free_preview }),
        })
      }
    } catch (e: any) { setError(e.message) }
  }

  const deleteLesson = async (modIdx: number, lesIdx: number) => {
    const l = form.modules[modIdx].lessons[lesIdx]
    if (l.id) {
      await fetch('/api/formateur/lecons', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: l.id }),
      })
    }
    setForm(f => {
      const mods = [...f.modules]
      mods[modIdx] = { ...mods[modIdx], lessons: mods[modIdx].lessons.filter((_, i) => i !== lesIdx) }
      return { ...f, modules: mods }
    })
  }

  // ── Publication ──
  const publish = async (pub: boolean) => {
    if (!courseId) return
    setSaving(true); setError(null)
    try {
      await fetch('/api/formateur/cours', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: courseId, is_published: pub }),
      })
      set('is_published', pub)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const finish = () => router.push('/formateur')

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => i < step || courseId ? setStep(i) : null}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                i === step ? 'ibig-gradient text-white' :
                i < step ? 'bg-green-100 text-green-700 cursor-pointer hover:bg-green-200' :
                'bg-gray-100 text-gray-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold border-current">
                {i < step ? '✓' : i + 1}
              </span>
              {label}
            </button>
            {i < STEP_LABELS.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      {/* ── STEP 0 : Informations ── */}
      {step === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm"
              placeholder="Ex: Maîtriser Excel de A à Z" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description courte *</label>
            <input value={form.short_description} onChange={e => set('short_description', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm"
              placeholder="Résumé en 1-2 phrases pour la carte de formation" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description complète *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={5}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm resize-none"
              placeholder="Décrivez le contenu, le public cible, les prérequis..." />
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Catégorie</label>
              <select value={form.category_id} onChange={e => set('category_id', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm bg-white">
                <option value="">— Choisir —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Niveau</label>
              <select value={form.level} onChange={e => set('level', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm bg-white">
                <option value="debutant">Débutant</option>
                <option value="intermediaire">Intermédiaire</option>
                <option value="avance">Avancé</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Prix (XOF)</label>
              <input type="number" value={form.price_xof} onChange={e => set('price_xof', parseInt(e.target.value) || 0)} min={0} step={1000}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm"
                placeholder="0 = Gratuit" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">URL de la miniature</label>
            <input value={form.thumbnail_url} onChange={e => set('thumbnail_url', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm"
              placeholder="https://..." />
            {form.thumbnail_url && (
              <img src={form.thumbnail_url} alt="preview" className="mt-2 h-24 rounded-lg object-cover" />
            )}
          </div>

          {/* Objectifs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ce que les apprenants vont apprendre</label>
            <div className="space-y-2">
              {form.objectives.map((o, i) => (
                <div key={i} className="flex gap-2">
                  <input value={o} onChange={e => { const arr = [...form.objectives]; arr[i] = e.target.value; set('objectives', arr) }}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]"
                    placeholder={`Objectif ${i + 1}`} />
                  {form.objectives.length > 1 && (
                    <button onClick={() => set('objectives', form.objectives.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
              <button onClick={() => set('objectives', [...form.objectives, ''])}
                className="text-sm text-[#0B3D91] hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Ajouter un objectif
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={saveInfos} disabled={!form.title || !form.description || saving}
              className="flex items-center gap-2 ibig-gradient text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer et continuer
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 1 : Contenu ── */}
      {step === 1 && (
        <div className="space-y-4">
          {form.modules.map((mod, mIdx) => (
            <div key={mIdx} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Module header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <input
                  value={mod.title}
                  onChange={e => {
                    const mods = [...form.modules]; mods[mIdx] = { ...mods[mIdx], title: e.target.value }
                    set('modules', mods)
                  }}
                  className="flex-1 font-semibold text-gray-900 bg-transparent focus:outline-none text-sm"
                />
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => saveModule(mIdx)}
                    className="text-xs bg-[#0B3D91] text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 flex items-center gap-1">
                    <Save className="w-3 h-3" /> Sauvegarder
                  </button>
                  <button onClick={() => deleteModule(mIdx)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => {
                    const mods = [...form.modules]; mods[mIdx] = { ...mods[mIdx], _open: !mods[mIdx]._open }
                    set('modules', mods)
                  }} className="text-gray-400 hover:text-gray-700">
                    {mod._open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Leçons */}
              {mod._open && (
                <div className="divide-y divide-gray-50">
                  {mod.lessons.map((les, lIdx) => {
                    const Icon = LESSON_ICONS[les.type] ?? Video
                    return (
                      <div key={lIdx} className="px-4 py-3 space-y-3">
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <input
                            value={les.title}
                            onChange={e => {
                              const mods = [...form.modules]
                              mods[mIdx].lessons[lIdx] = { ...mods[mIdx].lessons[lIdx], title: e.target.value }
                              set('modules', mods)
                            }}
                            className="flex-1 text-sm text-gray-800 bg-transparent focus:outline-none border-b border-transparent focus:border-gray-300 pb-0.5"
                          />
                          <select
                            value={les.type}
                            onChange={e => {
                              const mods = [...form.modules]
                              mods[mIdx].lessons[lIdx] = { ...mods[mIdx].lessons[lIdx], type: e.target.value }
                              set('modules', mods)
                            }}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none"
                          >
                            <option value="video">Vidéo</option>
                            <option value="document">Document</option>
                            <option value="quiz">Quiz</option>
                          </select>
                          <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                            <input type="checkbox" checked={les.is_free_preview}
                              onChange={e => {
                                const mods = [...form.modules]
                                mods[mIdx].lessons[lIdx] = { ...mods[mIdx].lessons[lIdx], is_free_preview: e.target.checked }
                                set('modules', mods)
                              }} className="rounded" />
                            Gratuit
                          </label>
                          <button onClick={() => saveLesson(mIdx, lIdx)}
                            className="text-xs bg-green-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-green-700 flex items-center gap-1">
                            <Save className="w-3 h-3" />
                          </button>
                          <button onClick={() => deleteLesson(mIdx, lIdx)} className="text-gray-300 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {les.type === 'video' && (
                          <input
                            value={les.video_url ?? ''}
                            onChange={e => {
                              const mods = [...form.modules]
                              mods[mIdx].lessons[lIdx] = { ...mods[mIdx].lessons[lIdx], video_url: e.target.value }
                              set('modules', mods)
                            }}
                            className="ml-7 w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0B3D91]"
                            placeholder="URL vidéo Bunny Stream (GUID)"
                          />
                        )}
                        {les.type === 'document' && (
                          <textarea
                            value={les.content ?? ''}
                            onChange={e => {
                              const mods = [...form.modules]
                              mods[mIdx].lessons[lIdx] = { ...mods[mIdx].lessons[lIdx], content: e.target.value }
                              set('modules', mods)
                            }}
                            rows={3}
                            className="ml-7 w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0B3D91] resize-none"
                            placeholder="Contenu texte de la leçon (Markdown supporté)"
                          />
                        )}
                      </div>
                    )
                  })}
                  <div className="px-4 py-2">
                    <button onClick={() => { if (mod.id) addLesson(mIdx); else setError('Sauvegardez d\'abord le module.') }}
                      className="text-xs text-[#0B3D91] hover:underline flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Ajouter une leçon
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <button onClick={addModule}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-[#0B3D91] text-gray-500 hover:text-[#0B3D91] py-4 rounded-2xl transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> Ajouter un module
          </button>

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(0)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <button onClick={() => setStep(2)}
              className="flex items-center gap-2 ibig-gradient text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90">
              Continuer <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2 : Publication ── */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-6">
          <div className="w-16 h-16 ibig-gradient rounded-2xl flex items-center justify-center mx-auto">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Prêt à publier ?</h2>
            <p className="text-gray-500 text-sm mt-1">
              {form.modules.length} module{form.modules.length !== 1 ? 's' : ''} ·{' '}
              {form.modules.reduce((s, m) => s + m.lessons.length, 0)} leçon{form.modules.reduce((s, m) => s + m.lessons.length, 0) !== 1 ? 's' : ''}
            </p>
          </div>

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            form.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {form.is_published ? <><Eye className="w-4 h-4" /> Publiée</> : <><EyeOff className="w-4 h-4" /> Brouillon</>}
          </div>

          <div className="flex justify-center gap-3">
            {!form.is_published ? (
              <button onClick={() => publish(true)} disabled={saving}
                className="flex items-center gap-2 ibig-gradient text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                Publier la formation
              </button>
            ) : (
              <button onClick={() => publish(false)} disabled={saving}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-200 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4" />}
                Dépublier
              </button>
            )}
            <button onClick={finish}
              className="flex items-center gap-2 border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-50">
              Terminer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
