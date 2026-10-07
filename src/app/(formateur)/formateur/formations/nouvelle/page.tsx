'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Save, Loader2, AlertCircle } from 'lucide-react'
import { COURSE_LANGUAGES } from '@/lib/languages'

const LEVELS = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
  { value: 'tous_niveaux', label: 'Tous niveaux' },
]


export default function NouvelleFormationPage() {
  const router = useRouter()
  const supabase = createClient()

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    short_description: '',
    category_id: '',
    level: 'debutant',
    language: 'fr',
    price_xof: '0',
    duration_hours: '0',
    thumbnail_url: '',
    is_published: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('categories').select('id, name').order('name').then(({ data }) => {
      if (data) setCategories(data)
    })
  }, [supabase])

  function set(key: string, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function slugify(str: string) {
    return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Le titre est requis.'); return }
    if (!form.category_id) { setError('Veuillez choisir une catégorie.'); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Non connecté.'); setLoading(false); return }

    const slug = slugify(form.title) + '-' + Date.now().toString(36)
    const { data, error: insertError } = await supabase.from('courses').insert({
      title: form.title,
      slug,
      description: form.description,
      short_description: form.short_description,
      category_id: form.category_id || null,
      level: form.level,
      language: form.language,
      price_xof: parseInt(form.price_xof) || 0,
      duration_hours: parseInt(form.duration_hours) || 0,
      thumbnail_url: form.thumbnail_url || null,
      instructor_id: user.id,
    }).select().single()

    setLoading(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    router.push(`/formateur/formations/${data.id}/modifier`)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nouvelle formation</h1>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-5">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Informations générales</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre de la formation *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Formation complète en Excel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Résumé court</label>
            <input
              type="text"
              value={form.short_description}
              onChange={e => set('short_description', e.target.value)}
              maxLength={200}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ce que l'apprenant va apprendre en une phrase"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description complète</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Décrivez en détail votre formation, les objectifs, le public cible..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
              <select
                value={form.category_id}
                onChange={e => set('category_id', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Sélectionner...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
              <select
                value={form.level}
                onChange={e => set('level', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Langue</label>
              <select
                value={form.language}
                onChange={e => set('language', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {COURSE_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durée (heures)</label>
              <input
                type="number"
                value={form.duration_hours}
                onChange={e => set('duration_hours', e.target.value)}
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Prix et publication</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix en FCFA (0 = gratuit)</label>
              <input
                type="number"
                value={form.price_xof}
                onChange={e => set('price_xof', e.target.value)}
                min="0"
                step="500"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 25000"
              />
            </div>
            <div className="flex items-end pb-1">
              <span className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 w-full text-center font-medium">XOF (FCFA)</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL de la miniature</label>
            <input
              type="url"
              value={form.thumbnail_url}
              onChange={e => set('thumbnail_url', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>

          <div className="rounded-xl bg-[#0B3D91]/5 border border-[#0B3D91]/15 p-4 text-sm text-gray-700 leading-relaxed">
            <p className="font-semibold text-[#0B3D91]">Publication par IBIG EDUFORM</p>
            <p className="mt-1">Après la création, ajoutez vos modules, leçons et quiz, puis cliquez sur « Soumettre pour validation ». IBIG EDUFORM vérifie la formation et la met en ligne. Vos revenus sont ensuite partagés selon votre convention de partenariat.</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? 'Création...' : 'Créer la formation'}
        </button>
      </form>
    </div>
  )
}
