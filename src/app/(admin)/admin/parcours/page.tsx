'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Target, Plus, Pencil, Eye, EyeOff, Star, Trash2, Loader2, BookOpen, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

const supabase = createClient()

interface Path {
  id: string
  title: string
  slug: string
  short_description: string
  level: string
  estimated_hours: number
  is_published: boolean
  is_featured: boolean
  created_at: string
}

interface Course {
  id: string
  title: string
  slug: string
  price_xof: number
  level: string
}

const LEVELS = ['tous_niveaux', 'debutant', 'intermediaire', 'avance']
const LEVEL_LABELS: Record<string, string> = { tous_niveaux: 'Tous niveaux', debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' }

function slugify(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function AdminParcoursPage() {
  const [paths, setPaths] = useState<Path[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Path | null>(null)
  const [flash, setFlash] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  const [form, setForm] = useState({
    title: '', slug: '', short_description: '', description: '', thumbnail_url: '',
    level: 'tous_niveaux', estimated_hours: '0', is_published: false, is_featured: false,
  })
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('learning_paths').select('*').order('created_at', { ascending: false }),
      supabase.from('courses').select('id, title, slug, price_xof, level').eq('is_published', true).order('title'),
    ]).then(([{ data: p }, { data: c }]) => {
      setPaths(p ?? [])
      setCourses(c ?? [])
      setLoading(false)
    })
  }, [])

  function showFlash(type: 'ok' | 'err', msg: string) {
    setFlash({ type, msg })
    setTimeout(() => setFlash(null), 3500)
  }

  function openCreate() {
    setEditing(null)
    setForm({ title: '', slug: '', short_description: '', description: '', thumbnail_url: '', level: 'tous_niveaux', estimated_hours: '0', is_published: false, is_featured: false })
    setSelectedCourses([])
    setShowForm(true)
  }

  async function openEdit(path: Path) {
    setEditing(path)
    setForm({
      title: path.title, slug: path.slug, short_description: path.short_description ?? '',
      description: '', thumbnail_url: '', level: path.level ?? 'tous_niveaux',
      estimated_hours: String(path.estimated_hours ?? 0), is_published: path.is_published, is_featured: path.is_featured,
    })
    const { data: pcs } = await supabase.from('learning_path_courses').select('course_id').eq('path_id', path.id).order('position')
    setSelectedCourses((pcs ?? []).map(pc => pc.course_id))
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.title.trim()) { showFlash('err', 'Le titre est requis'); return }
    setSaving(true)
    const slug = form.slug || slugify(form.title) + '-' + Date.now().toString(36)
    const payload = {
      title: form.title, slug, short_description: form.short_description,
      level: form.level, estimated_hours: parseInt(form.estimated_hours) || 0,
      is_published: form.is_published, is_featured: form.is_featured,
    }

    let pathId = editing?.id
    if (editing) {
      const { error } = await supabase.from('learning_paths').update(payload).eq('id', editing.id)
      if (error) { showFlash('err', error.message); setSaving(false); return }
    } else {
      const { data, error } = await supabase.from('learning_paths').insert(payload).select().single()
      if (error || !data) { showFlash('err', error?.message ?? 'Erreur'); setSaving(false); return }
      pathId = data.id
    }

    // Sync courses
    if (pathId) {
      await supabase.from('learning_path_courses').delete().eq('path_id', pathId)
      if (selectedCourses.length > 0) {
        await supabase.from('learning_path_courses').insert(
          selectedCourses.map((courseId, i) => ({ path_id: pathId, course_id: courseId, position: i }))
        )
      }
    }

    // Refresh
    const { data: refreshed } = await supabase.from('learning_paths').select('*').order('created_at', { ascending: false })
    setPaths(refreshed ?? [])
    setSaving(false)
    setShowForm(false)
    showFlash('ok', editing ? 'Parcours mis à jour' : 'Parcours créé')
  }

  async function togglePublish(path: Path) {
    await supabase.from('learning_paths').update({ is_published: !path.is_published }).eq('id', path.id)
    setPaths(p => p.map(x => x.id === path.id ? { ...x, is_published: !x.is_published } : x))
  }

  async function deletePath(path: Path) {
    if (!confirm(`Supprimer le parcours "${path.title}" ?`)) return
    await supabase.from('learning_paths').delete().eq('id', path.id)
    setPaths(p => p.filter(x => x.id !== path.id))
    showFlash('ok', 'Parcours supprimé')
  }

  function toggleCourse(id: string) {
    setSelectedCourses(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  function moveCourse(id: string, dir: -1 | 1) {
    setSelectedCourses(s => {
      const idx = s.indexOf(id)
      if (idx < 0) return s
      const newIdx = idx + dir
      if (newIdx < 0 || newIdx >= s.length) return s
      const arr = [...s]
      ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
      return arr
    })
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#0B3D91]" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {flash && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${flash.type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {flash.type === 'ok' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {flash.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Target className="w-6 h-6 text-[#0B3D91]" /> Parcours de formation</h1>
          <p className="text-gray-500 text-sm mt-1">{paths.length} parcours</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 ibig-gradient text-white font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 text-sm">
          <Plus className="w-4 h-4" /> Créer un parcours
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-gray-900 text-lg">{editing ? 'Modifier le parcours' : 'Nouveau parcours'}</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: slugify(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/40" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/40 font-mono" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description courte</label>
              <input value={form.short_description} onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/40" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
              <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/40">
                {LEVELS.map(l => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durée estimée (heures)</label>
              <input type="number" min="0" value={form.estimated_hours} onChange={e => setForm(f => ({ ...f, estimated_hours: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/40" />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} className="rounded w-4 h-4" />
              Publié
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="rounded w-4 h-4" />
              Mis en avant
            </label>
          </div>

          {/* Course selection */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Formations du parcours ({selectedCourses.length})</h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Selected courses - ordered */}
              {selectedCourses.length > 0 && (
                <div className="bg-blue-50 p-3 border-b border-gray-200">
                  <p className="text-xs font-semibold text-[#0B3D91] mb-2">Ordre du parcours :</p>
                  {selectedCourses.map((id, i) => {
                    const c = courses.find(x => x.id === id)
                    if (!c) return null
                    return (
                      <div key={id} className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs text-[#0B3D91] font-bold w-5">{i + 1}.</span>
                        <span className="text-xs flex-1 text-gray-700">{c.title}</span>
                        <button onClick={() => moveCourse(id, -1)} disabled={i === 0} className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => moveCourse(id, 1)} disabled={i === selectedCourses.length - 1} className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
              {/* All courses */}
              <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                {courses.map(c => (
                  <label key={c.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={selectedCourses.includes(c.id)} onChange={() => toggleCourse(c.id)} className="rounded w-4 h-4 text-[#0B3D91]" />
                    <span className="text-sm text-gray-700 flex-1">{c.title}</span>
                    <span className="text-xs text-gray-400">{c.price_xof === 0 ? 'Gratuit' : `${c.price_xof.toLocaleString('fr')} XOF`}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 ibig-gradient text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {saving ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer le parcours'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {paths.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun parcours créé. Cliquez sur "Créer un parcours" pour commencer.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paths.map(path => (
            <div key={path.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${path.is_published ? 'ibig-gradient' : 'bg-gray-100'}`}>
                <Target className={`w-5 h-5 ${path.is_published ? 'text-white' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 truncate">{path.title}</p>
                  {path.is_featured && <Star className="w-4 h-4 text-[#FFA500] fill-[#FFA500] flex-shrink-0" />}
                  {!path.is_published && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Brouillon</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{path.slug} · {LEVEL_LABELS[path.level] ?? path.level}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={`/parcours/${path.slug}`} target="_blank"
                  className="p-2 text-gray-400 hover:text-[#0B3D91] rounded-lg hover:bg-blue-50 transition-colors" title="Voir">
                  <BookOpen className="w-4 h-4" />
                </Link>
                <button onClick={() => togglePublish(path)}
                  className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors" title={path.is_published ? 'Dépublier' : 'Publier'}>
                  {path.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => openEdit(path)}
                  className="p-2 text-gray-400 hover:text-[#0B3D91] rounded-lg hover:bg-blue-50 transition-colors" title="Modifier">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deletePath(path)}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" title="Supprimer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
