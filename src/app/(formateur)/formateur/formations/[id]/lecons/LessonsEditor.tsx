'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, ChevronDown, ChevronRight, Grip, Video, FileText, HelpCircle, Eye, EyeOff, Trash2, Edit2, Check, X, Loader2, BookOpen } from 'lucide-react'

type Lesson = {
  id: string
  title: string
  type: 'video' | 'text' | 'quiz'
  video_url: string | null
  content: string | null
  duration_minutes: number | null
  position: number
  is_free_preview: boolean
  is_published: boolean
}

type Module = {
  id: string
  title: string
  position: number
  lessons: Lesson[]
}

const lessonTypeIcon = { video: Video, text: FileText, quiz: HelpCircle }
const lessonTypeLabel = { video: 'Vidéo', text: 'Texte', quiz: 'Quiz' }

function LessonRow({ lesson, onUpdate, onDelete }: {
  lesson: Lesson
  onUpdate: (id: string, data: Partial<Lesson>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(lesson.title)
  const [saving, setSaving] = useState(false)
  const Icon = lessonTypeIcon[lesson.type] ?? FileText

  async function save() {
    setSaving(true)
    await onUpdate(lesson.id, { title: title.trim() })
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group border-b border-gray-50 last:border-0">
      <Grip className="w-4 h-4 text-gray-300 flex-shrink-0" />
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${lesson.type === 'video' ? 'bg-blue-50' : lesson.type === 'quiz' ? 'bg-purple-50' : 'bg-green-50'}`}>
        <Icon className={`w-3.5 h-3.5 ${lesson.type === 'video' ? 'text-blue-600' : lesson.type === 'quiz' ? 'text-purple-600' : 'text-green-600'}`} />
      </div>

      {editing ? (
        <div className="flex-1 flex items-center gap-2">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            className="flex-1 border border-[#0B3D91] rounded-lg px-2 py-1 text-sm focus:outline-none"
          />
          <button onClick={save} disabled={saving} className="text-green-600 hover:text-green-700">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
          <button onClick={() => { setEditing(false); setTitle(lesson.title) }} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{lesson.title}</p>
          <p className="text-xs text-gray-400">{lessonTypeLabel[lesson.type]}{lesson.duration_minutes ? ` · ${lesson.duration_minutes} min` : ''}</p>
        </div>
      )}

      {!editing && (
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {lesson.is_free_preview && (
            <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full">Gratuit</span>
          )}
          <button
            onClick={() => onUpdate(lesson.id, { is_free_preview: !lesson.is_free_preview })}
            className="text-gray-400 hover:text-gray-600 p-1"
            title={lesson.is_free_preview ? 'Rendre payant' : 'Aperçu gratuit'}
          >
            {lesson.is_free_preview ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-[#0B3D91] p-1">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(lesson.id)} className="text-gray-400 hover:text-red-500 p-1">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

export default function LessonsEditor({ courseId, initialModules }: { courseId: string; initialModules: Module[] }) {
  const [modules, setModules] = useState<Module[]>(initialModules)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(initialModules.map(m => m.id)))
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [addingModule, setAddingModule] = useState(false)
  const [newLessonState, setNewLessonState] = useState<Record<string, { title: string; type: string } | null>>({})
  const supabase = createClient()

  function toggleModule(id: string) {
    setExpandedModules(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function addModule() {
    if (!newModuleTitle.trim()) return
    const pos = modules.length
    const { data } = await supabase.from('modules').insert({
      course_id: courseId, title: newModuleTitle.trim(), position: pos
    }).select().single()
    if (data) {
      setModules(prev => [...prev, { ...data, lessons: [] }])
      setExpandedModules(prev => new Set([...prev, data.id]))
    }
    setNewModuleTitle('')
    setAddingModule(false)
  }

  async function deleteModule(id: string) {
    if (!confirm('Supprimer ce module et toutes ses leçons ?')) return
    await supabase.from('modules').delete().eq('id', id)
    setModules(prev => prev.filter(m => m.id !== id))
  }

  async function updateModuleTitle(id: string, title: string) {
    await supabase.from('modules').update({ title }).eq('id', id)
    setModules(prev => prev.map(m => m.id === id ? { ...m, title } : m))
  }

  async function addLesson(moduleId: string) {
    const state = newLessonState[moduleId]
    if (!state || !state.title.trim()) return
    const module = modules.find(m => m.id === moduleId)
    const pos = module?.lessons.length ?? 0
    const { data } = await supabase.from('lessons').insert({
      module_id: moduleId, course_id: courseId,
      title: state.title.trim(), type: state.type,
      position: pos, is_free_preview: false, is_published: false
    }).select().single()
    if (data) {
      setModules(prev => prev.map(m => m.id === moduleId ? { ...m, lessons: [...m.lessons, data as Lesson] } : m))
    }
    setNewLessonState(prev => ({ ...prev, [moduleId]: null }))
  }

  async function updateLesson(id: string, data: Partial<Lesson>) {
    await supabase.from('lessons').update(data).eq('id', id)
    setModules(prev => prev.map(m => ({
      ...m,
      lessons: m.lessons.map(l => l.id === id ? { ...l, ...data } : l)
    })))
  }

  async function deleteLesson(id: string) {
    if (!confirm('Supprimer cette leçon ?')) return
    await supabase.from('lessons').delete().eq('id', id)
    setModules(prev => prev.map(m => ({ ...m, lessons: m.lessons.filter(l => l.id !== id) })))
  }

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{modules.length} module{modules.length > 1 ? 's' : ''} · {totalLessons} leçon{totalLessons > 1 ? 's' : ''}</p>
        <button
          onClick={() => setAddingModule(true)}
          className="flex items-center gap-2 ibig-gradient text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Ajouter un module
        </button>
      </div>

      {modules.map((module, mi) => (
        <div key={module.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Module header */}
          <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100">
            <button onClick={() => toggleModule(module.id)} className="text-gray-400 hover:text-gray-600">
              {expandedModules.has(module.id)
                ? <ChevronDown className="w-5 h-5" />
                : <ChevronRight className="w-5 h-5" />}
            </button>
            <div className="flex-1">
              <ModuleTitle title={module.title} onSave={t => updateModuleTitle(module.id, t)} />
            </div>
            <span className="text-xs text-gray-400">{module.lessons.length} leçon{module.lessons.length > 1 ? 's' : ''}</span>
            <button onClick={() => deleteModule(module.id)} className="text-gray-300 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {expandedModules.has(module.id) && (
            <div>
              {module.lessons.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-4">Aucune leçon — ajoutez-en une ci-dessous</p>
              )}
              {module.lessons.map(lesson => (
                <LessonRow key={lesson.id} lesson={lesson} onUpdate={updateLesson} onDelete={deleteLesson} />
              ))}

              {/* Add lesson */}
              {newLessonState[module.id] ? (
                <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-50 bg-blue-50/30">
                  <input
                    autoFocus
                    value={newLessonState[module.id]!.title}
                    onChange={e => setNewLessonState(prev => ({ ...prev, [module.id]: { ...prev[module.id]!, title: e.target.value } }))}
                    onKeyDown={e => e.key === 'Enter' && addLesson(module.id)}
                    placeholder="Titre de la leçon..."
                    className="flex-1 border border-[#0B3D91] rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                  />
                  <select
                    value={newLessonState[module.id]!.type}
                    onChange={e => setNewLessonState(prev => ({ ...prev, [module.id]: { ...prev[module.id]!, type: e.target.value } }))}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                  >
                    <option value="video">Vidéo</option>
                    <option value="text">Texte</option>
                    <option value="quiz">Quiz</option>
                  </select>
                  <button onClick={() => addLesson(module.id)} className="text-green-600 hover:text-green-700 p-1">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setNewLessonState(prev => ({ ...prev, [module.id]: null }))} className="text-gray-400 hover:text-gray-600 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setNewLessonState(prev => ({ ...prev, [module.id]: { title: '', type: 'video' } }))}
                  className="flex items-center gap-2 text-sm text-[#0B3D91] hover:text-blue-800 px-4 py-3 w-full border-t border-gray-50 hover:bg-blue-50/30 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Ajouter une leçon
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add module form */}
      {addingModule && (
        <div className="bg-white rounded-2xl border border-[#0B3D91] shadow-sm p-4 flex items-center gap-3">
          <input
            autoFocus
            value={newModuleTitle}
            onChange={e => setNewModuleTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addModule()}
            placeholder="Titre du module..."
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 focus:border-[#0B3D91]"
          />
          <button onClick={addModule} className="ibig-gradient text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90">
            Créer
          </button>
          <button onClick={() => setAddingModule(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {modules.length === 0 && !addingModule && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium mb-4">Aucun module créé pour l'instant</p>
          <button
            onClick={() => setAddingModule(true)}
            className="inline-flex items-center gap-2 ibig-gradient text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 text-sm"
          >
            <Plus className="w-4 h-4" /> Créer le premier module
          </button>
        </div>
      )}
    </div>
  )
}

function ModuleTitle({ title, onSave }: { title: string; onSave: (t: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(title)
  if (editing) return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { onSave(val); setEditing(false) } if (e.key === 'Escape') setEditing(false) }}
        className="flex-1 bg-white border border-[#0B3D91] rounded-lg px-2 py-1 text-sm font-semibold focus:outline-none"
      />
      <button onClick={() => { onSave(val); setEditing(false) }} className="text-green-600"><Check className="w-4 h-4" /></button>
    </div>
  )
  return (
    <button onClick={() => setEditing(true)} className="text-left font-semibold text-gray-900 text-sm hover:text-[#0B3D91] transition-colors">
      {title}
    </button>
  )
}
