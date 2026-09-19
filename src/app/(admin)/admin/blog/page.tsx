'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Eye, EyeOff, Trash2, Edit2, BookOpen, Clock, Loader2, X, Save } from 'lucide-react'
import RichTextEditor from '@/components/admin/RichTextEditor'

type Post = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  category: string | null
  is_published: boolean
  published_at: string | null
  reading_time_minutes: number | null
  views_count: number
  created_at: string
}

function slugify(str: string) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Post | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', slug: '', excerpt: '', content: '', category: '', cover_image: '',
    reading_time_minutes: 5, is_published: false
  })
  const supabase = createClient()

  useEffect(() => {
    supabase.from('blog_posts')
      .select('id, title, slug, excerpt, category, is_published, published_at, reading_time_minutes, views_count, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setPosts(data ?? []); setLoading(false) })
  }, [])

  function openNew() {
    setEditing(null)
    setForm({ title: '', slug: '', excerpt: '', content: '', category: '', cover_image: '', reading_time_minutes: 5, is_published: false })
    setShowForm(true)
  }

  function openEdit(post: Post) {
    setEditing(post)
    setForm({ ...post as any })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.slug.trim()) return
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim() || null,
      content: (form as any).content?.trim() || '',
      category: form.category.trim() || null,
      cover_image: (form as any).cover_image?.trim() || null,
      reading_time_minutes: form.reading_time_minutes,
      is_published: form.is_published,
      published_at: form.is_published ? new Date().toISOString() : null,
    }
    if (editing) {
      const { data } = await supabase.from('blog_posts').update(payload).eq('id', editing.id).select().single()
      if (data) setPosts(prev => prev.map(p => p.id === editing.id ? { ...p, ...data } : p))
    } else {
      const { data } = await supabase.from('blog_posts').insert(payload).select().single()
      if (data) setPosts(prev => [data, ...prev])
    }
    setSaving(false)
    setShowForm(false)
  }

  async function togglePublish(post: Post) {
    const updates = { is_published: !post.is_published, published_at: !post.is_published ? new Date().toISOString() : null }
    await supabase.from('blog_posts').update(updates).eq('id', post.id)
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, ...updates } : p))
  }

  async function deletePost(id: string) {
    if (!confirm('Supprimer cet article ?')) return
    await supabase.from('blog_posts').delete().eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-[#0B3D91] animate-spin" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#0B3D91]" /> Gestion du Blog
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{posts.length} article{posts.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 ibig-gradient text-white font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm">
          <Plus className="w-4 h-4" /> Nouvel article
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-900">{editing ? 'Modifier l\'article' : 'Nouvel article'}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Titre *</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: editing ? f.slug : slugify(e.target.value) }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 focus:border-[#0B3D91]"
                placeholder="Titre de l'article"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Slug *</label>
              <input
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 focus:border-[#0B3D91]"
                placeholder="mon-article-slug"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Catégorie</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20">
                <option value="">-- Choisir --</option>
                {['Carrière', 'Formation', 'Business', 'Tech', 'Leadership', 'Finance', 'RH', 'Marketing'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Temps de lecture (min)</label>
              <input type="number" min={1} max={60}
                value={form.reading_time_minutes}
                onChange={e => setForm(f => ({ ...f, reading_time_minutes: parseInt(e.target.value) || 5 }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_published}
                  onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
                  className="rounded" />
                <span className="text-sm font-medium text-gray-700">Publier maintenant</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Image de couverture (URL)</label>
            <input value={(form as any).cover_image ?? ''}
              onChange={e => setForm(f => ({ ...f, cover_image: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Extrait</label>
            <textarea value={form.excerpt ?? ''} rows={2}
              onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 resize-none"
              placeholder="Courte description de l'article..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Contenu *</label>
            <RichTextEditor
              value={(form as any).content ?? ''}
              onChange={html => setForm(f => ({ ...f, content: html }))}
              placeholder="Rédigez le contenu de l'article…"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving || !form.title.trim()}
              className="flex items-center gap-2 ibig-gradient text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      )}

      {/* Posts list */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium mb-4">Aucun article de blog</p>
          <button onClick={openNew}
            className="inline-flex items-center gap-2 ibig-gradient text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 text-sm">
            <Plus className="w-4 h-4" /> Créer le premier article
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {posts.map((post, i) => (
            <div key={post.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group ${i > 0 ? 'border-t border-gray-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{post.title}</h3>
                  <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${post.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {post.is_published ? 'Publié' : 'Brouillon'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {post.category && <span className="text-[#0B3D91] bg-blue-50 px-1.5 py-0.5 rounded-full">{post.category}</span>}
                  {post.reading_time_minutes && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.reading_time_minutes} min</span>}
                  <span>{post.views_count} vues</span>
                  <span>{new Date(post.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => togglePublish(post)} title={post.is_published ? 'Dépublier' : 'Publier'}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#0B3D91]">
                  {post.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => openEdit(post)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deletePost(post.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500">
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
