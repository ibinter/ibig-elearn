'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  Save, Loader2, AlertCircle, PlusCircle, Trash2, GripVertical,
  ChevronDown, ChevronRight, Play, BookOpen, HelpCircle, FileText,
  Eye, EyeOff, CheckCircle, ArrowLeft, Upload
} from 'lucide-react'
import Link from 'next/link'
import BunnyUpload from '@/components/formateur/BunnyUpload'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const LEVELS = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
  { value: 'tous_niveaux', label: 'Tous niveaux' },
]
const LESSON_TYPES = [
  { value: 'video', label: 'Vidéo', icon: Play },
  { value: 'document', label: 'Document', icon: FileText },
  { value: 'quiz', label: 'Quiz', icon: HelpCircle },
  { value: 'assignment', label: 'Devoir', icon: BookOpen },
]
const typeIcon = (t: string) => ({ video: Play, document: FileText, quiz: HelpCircle, assignment: BookOpen }[t] ?? BookOpen)

interface Lesson { id: string; title: string; type: string; position: number; is_free_preview: boolean; video_duration_seconds: number | null; video_url: string | null; _showUpload?: boolean }
interface Module { id: string; title: string; position: number; lessons: Lesson[]; open?: boolean }
interface CourseInfo { id: string; title: string; slug: string; short_description: string; description: string; level: string; language: string; price_xof: number; duration_hours: number; thumbnail_url: string | null; is_published: boolean; category_id: string | null; objectives: string[] }

export default function ModifierFormationPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [course, setCourse] = useState<CourseInfo | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingModule, setSavingModule] = useState<string | null>(null)
  const [flash, setFlash] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [tab, setTab] = useState<'info' | 'programme'>('info')

  const showFlash = (type: 'ok' | 'err', msg: string) => {
    setFlash({ type, msg })
    setTimeout(() => setFlash(null), 3500)
  }

  const load = useCallback(async () => {
    const { data: c } = await supabase.from('courses').select('*').eq('id', id).single()
    if (!c) { router.push('/formateur/formations'); return }
    setCourse(c as CourseInfo)

    const { data: mods } = await supabase.from('modules').select('*, lessons(*)').eq('course_id', id).order('position')
    const sorted = (mods ?? []).map((m: any) => ({
      ...m,
      lessons: (m.lessons ?? []).sort((a: Lesson, b: Lesson) => a.position - b.position),
      open: true,
    }))
    setModules(sorted)

    const { data: cats } = await supabase.from('categories').select('id, name').order('name')
    setCategories(cats ?? [])
    setLoading(false)
  }, [id, router])

  useEffect(() => { load() }, [load])

  // ── Course info save ──────────────────────────────────────────────
  async function saveCourse() {
    if (!course) return
    setSaving(true)
    const { error } = await supabase.from('courses').update({
      title: course.title,
      short_description: course.short_description,
      description: course.description,
      level: course.level,
      language: course.language,
      price_xof: course.price_xof,
      duration_hours: course.duration_hours,
      thumbnail_url: course.thumbnail_url,
      is_published: course.is_published,
      category_id: course.category_id,
      objectives: course.objectives,
    }).eq('id', id)
    setSaving(false)
    if (error) showFlash('err', error.message)
    else showFlash('ok', 'Formation enregistrée')
  }

  // ── Modules ───────────────────────────────────────────────────────
  async function addModule() {
    const pos = modules.length
    const { data, error } = await supabase.from('modules').insert({ course_id: id, title: 'Nouveau module', position: pos }).select().single()
    if (error || !data) return
    setModules(m => [...m, { ...data, lessons: [], open: true }])
  }

  async function saveModuleTitle(modId: string, title: string) {
    setSavingModule(modId)
    await supabase.from('modules').update({ title }).eq('id', modId)
    setSavingModule(null)
  }

  async function deleteModule(modId: string) {
    if (!confirm('Supprimer ce module et toutes ses leçons ?')) return
    await supabase.from('modules').delete().eq('id', modId)
    setModules(m => m.filter(x => x.id !== modId))
  }

  // ── Lessons ───────────────────────────────────────────────────────
  async function addLesson(modId: string) {
    const mod = modules.find(m => m.id === modId)
    if (!mod) return
    const pos = mod.lessons.length
    const { data, error } = await supabase.from('lessons').insert({
      module_id: modId, course_id: id, title: 'Nouvelle leçon', type: 'video', position: pos, is_free_preview: false,
    }).select().single()
    if (error || !data) return
    setModules(m => m.map(mod => mod.id === modId ? { ...mod, lessons: [...mod.lessons, data as Lesson] } : mod))
  }

  async function updateLesson(modId: string, lessonId: string, patch: Partial<Lesson>) {
    setModules(m => m.map(mod => mod.id !== modId ? mod : {
      ...mod,
      lessons: mod.lessons.map(l => l.id === lessonId ? { ...l, ...patch } : l)
    }))
  }

  async function saveLesson(lesson: Lesson) {
    await supabase.from('lessons').update({
      title: lesson.title,
      type: lesson.type,
      is_free_preview: lesson.is_free_preview,
      video_url: lesson.video_url,
      video_duration_seconds: lesson.video_duration_seconds,
    }).eq('id', lesson.id)
    showFlash('ok', 'Leçon enregistrée')
  }

  async function deleteLesson(modId: string, lessonId: string) {
    if (!confirm('Supprimer cette leçon ?')) return
    await supabase.from('lessons').delete().eq('id', lessonId)
    setModules(m => m.map(mod => mod.id !== modId ? mod : { ...mod, lessons: mod.lessons.filter(l => l.id !== lessonId) }))
  }

  function toggleModule(modId: string) {
    setModules(m => m.map(mod => mod.id === modId ? { ...mod, open: !mod.open } : mod))
  }

  function setObj(i: number, val: string) {
    if (!course) return
    const obj = [...(course.objectives ?? [])]
    obj[i] = val
    setCourse({ ...course, objectives: obj })
  }
  function addObj() {
    if (!course) return
    setCourse({ ...course, objectives: [...(course.objectives ?? []), ''] })
  }
  function removeObj(i: number) {
    if (!course) return
    const obj = [...(course.objectives ?? [])]
    obj.splice(i, 1)
    setCourse({ ...course, objectives: obj })
  }

  const totalLessons = modules.reduce((n, m) => n + m.lessons.length, 0)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-[#0B3D91]" />
    </div>
  )

  return (
    <div className="max-w-4xl">
      {/* Flash */}
      {flash && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${flash.type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {flash.type === 'ok' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {flash.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/formateur/formations" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4" /> Mes formations
          </Link>
          <h1 className="text-xl font-bold text-gray-900 line-clamp-1">{course?.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{modules.length} modules · {totalLessons} leçons</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/formation/${course?.slug}`} target="_blank"
            className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50">
            <Eye className="w-4 h-4" /> Aperçu
          </Link>
          {tab === 'info' && (
            <button onClick={saveCourse} disabled={saving}
              className="flex items-center gap-1.5 ibig-gradient text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {(['info', 'programme'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-[#0B3D91] text-[#0B3D91]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'info' ? 'Informations' : 'Programme'}
          </button>
        ))}
      </div>

      {/* ── TAB: Informations ── */}
      {tab === 'info' && course && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Informations générales</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/40"
                value={course.title} onChange={e => setCourse({ ...course, title: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Résumé court</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/40"
                maxLength={200} value={course.short_description ?? ''} onChange={e => setCourse({ ...course, short_description: e.target.value })}
                placeholder="En une phrase, ce que l'apprenant va apprendre" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description complète</label>
              <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/40 resize-none"
                rows={5} value={course.description ?? ''} onChange={e => setCourse({ ...course, description: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/40"
                  value={course.category_id ?? ''} onChange={e => setCourse({ ...course, category_id: e.target.value || null })}>
                  <option value="">Sans catégorie</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/40"
                  value={course.level} onChange={e => setCourse({ ...course, level: e.target.value })}>
                  {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix (XOF)</label>
                <input type="number" min="0" step="1000" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/40"
                  value={course.price_xof ?? 0} onChange={e => setCourse({ ...course, price_xof: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durée (heures)</label>
                <input type="number" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/40"
                  value={course.duration_hours ?? 0} onChange={e => setCourse({ ...course, duration_hours: parseInt(e.target.value) || 0 })} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL Miniature (thumbnail)</label>
              <input type="url" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/40"
                value={course.thumbnail_url ?? ''} onChange={e => setCourse({ ...course, thumbnail_url: e.target.value || null })}
                placeholder="https://..." />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={course.is_published} onChange={e => setCourse({ ...course, is_published: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-[#0B3D91] focus:ring-[#0B3D91]/40" />
              <span className="text-sm text-gray-700">Formation publiée et visible dans le catalogue</span>
            </label>
          </div>

          {/* Objectifs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Objectifs pédagogiques</h2>
            <div className="space-y-2">
              {(course.objectives ?? []).map((obj, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/40"
                    value={obj} onChange={e => setObj(i, e.target.value)} placeholder={`Objectif ${i + 1}`} />
                  <button onClick={() => removeObj(i)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button onClick={addObj} className="flex items-center gap-1.5 text-sm text-[#0B3D91] hover:underline mt-1">
                <PlusCircle className="w-4 h-4" /> Ajouter un objectif
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Programme ── */}
      {tab === 'programme' && (
        <div className="space-y-4">
          {modules.map(mod => (
            <div key={mod.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Module header */}
              <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100">
                <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <button onClick={() => toggleModule(mod.id)} className="text-gray-400 flex-shrink-0">
                  {mod.open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <input className="flex-1 font-semibold text-gray-900 bg-transparent border-0 focus:outline-none focus:bg-white focus:border focus:border-[#0B3D91]/40 focus:px-2 focus:rounded-lg text-sm"
                  defaultValue={mod.title}
                  onBlur={e => saveModuleTitle(mod.id, e.target.value)} />
                {savingModule === mod.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400 flex-shrink-0" />}
                <span className="text-xs text-gray-400 flex-shrink-0">{mod.lessons.length} leçon{mod.lessons.length > 1 ? 's' : ''}</span>
                <button onClick={() => deleteModule(mod.id)} className="p-1 text-gray-300 hover:text-red-500 rounded flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Lessons */}
              {mod.open && (
                <div>
                  {mod.lessons.map(lesson => {
                    const LIcon = typeIcon(lesson.type)
                    return (
                      <div key={lesson.id} className="border-b border-gray-50 last:border-0">
                        <div className="flex items-start gap-3 px-5 py-3">
                          <GripVertical className="w-4 h-4 text-gray-200 mt-2.5 flex-shrink-0" />
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 ${lesson.type === 'video' ? 'bg-blue-50 text-blue-600' : lesson.type === 'quiz' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                            <LIcon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 space-y-2 min-w-0">
                            <input className="w-full text-sm font-medium text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/40"
                              value={lesson.title}
                              onChange={e => updateLesson(mod.id, lesson.id, { title: e.target.value })} />
                            <div className="flex flex-wrap items-center gap-3">
                              <select value={lesson.type}
                                onChange={e => updateLesson(mod.id, lesson.id, { type: e.target.value })}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none">
                                {LESSON_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                              </select>
                              {lesson.type === 'video' && (
                                <div className="w-full space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <input placeholder="bunny:LIBRARY_ID/VIDEO_GUID ou URL embed"
                                      value={lesson.video_url ?? ''}
                                      onChange={e => updateLesson(mod.id, lesson.id, { video_url: e.target.value || null })}
                                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 flex-1 min-w-32 focus:outline-none focus:ring-1 focus:ring-[#0B3D91]/40" />
                                    <input type="number" min="0" placeholder="Durée (sec)"
                                      value={lesson.video_duration_seconds ?? ''}
                                      onChange={e => updateLesson(mod.id, lesson.id, { video_duration_seconds: parseInt(e.target.value) || null })}
                                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 w-24 focus:outline-none" />
                                    <button type="button"
                                      onClick={() => updateLesson(mod.id, lesson.id, { _showUpload: !lesson._showUpload })}
                                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors ${lesson._showUpload ? 'bg-blue-50 border-[#0B3D91]/40 text-[#0B3D91]' : 'border-gray-200 text-gray-500 hover:border-[#0B3D91]/40 hover:text-[#0B3D91]'}`}>
                                      <Upload className="w-3 h-3" /> Uploader
                                    </button>
                                  </div>
                                  {lesson._showUpload && (
                                    <BunnyUpload
                                      lessonTitle={lesson.title}
                                      onSuccess={(videoUrl) => {
                                        updateLesson(mod.id, lesson.id, { video_url: videoUrl, _showUpload: false })
                                      }}
                                    />
                                  )}
                                </div>
                              )}
                              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                                <input type="checkbox" checked={lesson.is_free_preview}
                                  onChange={e => updateLesson(mod.id, lesson.id, { is_free_preview: e.target.checked })}
                                  className="w-3 h-3 rounded" />
                                Aperçu gratuit
                              </label>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 mt-1">
                            <button onClick={() => saveLesson(lesson)} title="Enregistrer"
                              className="p-1.5 text-gray-400 hover:text-[#0B3D91] rounded-lg hover:bg-blue-50">
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteLesson(mod.id, lesson.id)} title="Supprimer"
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  <div className="px-5 py-3 bg-gray-50/50">
                    <button onClick={() => addLesson(mod.id)}
                      className="flex items-center gap-1.5 text-xs text-[#0B3D91] hover:underline font-medium">
                      <PlusCircle className="w-3.5 h-3.5" /> Ajouter une leçon
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <button onClick={addModule}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-[#0B3D91]/40 text-gray-400 hover:text-[#0B3D91] rounded-2xl py-4 text-sm font-medium transition-colors">
            <PlusCircle className="w-5 h-5" /> Ajouter un module
          </button>

          {modules.length > 0 && (
            <div className="text-center">
              <p className="text-xs text-gray-400">
                {modules.length} module{modules.length > 1 ? 's' : ''} · {totalLessons} leçon{totalLessons > 1 ? 's' : ''} — Les modifications de leçons sont sauvegardées individuellement
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
