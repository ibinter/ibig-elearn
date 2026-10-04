'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronRight, ChevronLeft, Check, BookOpen, Target, User, Sparkles } from 'lucide-react'

interface Props {
  userId: string
  profile: { full_name: string; country: string; job_title?: string; goals?: string[] }
  categories: { id: string; name: string; slug: string }[]
}

const GOALS = [
  { id: 'career', label: '💼 Évoluer dans ma carrière', desc: 'Progresser dans mon poste actuel ou changer de métier' },
  { id: 'skills', label: '🛠️ Acquérir de nouvelles compétences', desc: 'Apprendre des outils, langages ou techniques' },
  { id: 'business', label: '🚀 Créer ou développer mon activité', desc: 'Entrepreneuriat, freelance, startup' },
  { id: 'certification', label: '🎓 Obtenir une certification', desc: 'Valider mes compétences officiellement' },
  { id: 'curiosity', label: '🌍 Me cultiver', desc: 'Apprendre par passion et curiosité' },
]

const FREQUENCIES = [
  { id: 'daily', label: 'Chaque jour', sub: '15-30 min' },
  { id: 'weekly3', label: '3× par semaine', sub: '1h par session' },
  { id: 'weekly', label: '1× par semaine', sub: '2h par session' },
  { id: 'flexible', label: 'Selon ma disponibilité', sub: 'À mon rythme' },
]

const LEVELS = [
  { id: 'debutant', label: '🌱 Débutant', desc: 'Je découvre ce domaine' },
  { id: 'intermediaire', label: '📈 Intermédiaire', desc: 'J\'ai quelques bases' },
  { id: 'avance', label: '🔥 Avancé', desc: 'Je cherche à me perfectionner' },
]

export default function OnboardingWizard({ userId, profile, categories }: Props) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    job_title: profile.job_title ?? '',
    goals: (profile.goals ?? []) as string[],
    interests: [] as string[],
    frequency: '',
    level: '',
  })
  const router = useRouter()
  const supabase = createClient()

  const steps = [
    { title: 'Bienvenue !', icon: Sparkles },
    { title: 'Vos objectifs', icon: Target },
    { title: 'Vos centres d\'intérêt', icon: BookOpen },
    { title: 'Votre profil', icon: User },
  ]

  const toggleGoal = (id: string) => {
    setForm(f => ({
      ...f,
      goals: f.goals.includes(id) ? f.goals.filter(g => g !== id) : [...f.goals, id],
    }))
  }

  const toggleInterest = (id: string) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(id) ? f.interests.filter(i => i !== id) : [...f.interests, id],
    }))
  }

  const finish = async () => {
    setSaving(true)
    await supabase.from('profiles').update({
      job_title: form.job_title || null,
      goals: form.goals,
      interests: form.interests,
      learning_frequency: form.frequency || null,
      preferred_level: form.level || null,
      onboarding_completed: true,
    }).eq('id', userId)

    // XP de bienvenue (+25 XP)
    await supabase.rpc('award_xp', { p_user_id: userId, p_xp: 25, p_event: 'onboarding_completed', p_ref_id: null })

    router.push('/tableau-de-bord')
  }

  const canNext = () => {
    if (step === 1) return form.goals.length > 0
    if (step === 2) return form.interests.length > 0
    return true
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B3D91] via-[#1a5cbf] to-[#0B3D91] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Étapes */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'bg-green-400 text-white' :
                i === step ? 'bg-white text-[#0B3D91]' :
                'bg-white/20 text-white/50'
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${i < step ? 'bg-green-400' : 'bg-white/20'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Step 0 : Accueil */}
          {step === 0 && (
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-[#0B3D91]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-[#0B3D91]" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Bienvenue, {profile.full_name?.split(' ')[0]} ! 🎉
              </h1>
              <p className="text-gray-500 mb-6">
                Prenons 2 minutes pour personnaliser votre expérience d'apprentissage. Nous allons adapter nos recommandations à vos objectifs.
              </p>
              <div className="grid grid-cols-3 gap-3 mb-8 text-center">
                {[
                  { emoji: '🎯', label: 'Formations ciblées' },
                  { emoji: '⚡', label: 'Parcours adapté' },
                  { emoji: '🏆', label: 'Progression gamifiée' },
                ].map(f => (
                  <div key={f.label} className="bg-gray-50 rounded-xl p-3">
                    <div className="text-2xl mb-1">{f.emoji}</div>
                    <p className="text-xs font-medium text-gray-600">{f.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1 : Objectifs */}
          {step === 1 && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Quels sont vos objectifs ?</h2>
              <p className="text-sm text-gray-500 mb-6">Sélectionnez tout ce qui vous correspond</p>
              <div className="space-y-3">
                {GOALS.map(g => (
                  <button key={g.id} onClick={() => toggleGoal(g.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      form.goals.includes(g.id)
                        ? 'border-[#0B3D91] bg-blue-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{g.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{g.desc}</p>
                      </div>
                      {form.goals.includes(g.id) && (
                        <div className="w-6 h-6 bg-[#0B3D91] rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 : Intérêts */}
          {step === 2 && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Vos domaines d'intérêt</h2>
              <p className="text-sm text-gray-500 mb-6">Choisissez au moins un domaine</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map(c => (
                  <button key={c.id} onClick={() => toggleInterest(c.id)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                      form.interests.includes(c.id)
                        ? 'border-[#0B3D91] bg-[#0B3D91] text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 : Profil */}
          {step === 3 && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Finalisez votre profil</h2>
              <p className="text-sm text-gray-500 mb-6">Ces informations restent privées</p>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Votre métier (optionnel)</label>
                  <input
                    value={form.job_title}
                    onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))}
                    placeholder="Ex: Développeur, RH, Entrepreneur…"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0B3D91]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Fréquence d'apprentissage souhaitée</label>
                  <div className="grid grid-cols-2 gap-2">
                    {FREQUENCIES.map(f => (
                      <button key={f.id} onClick={() => setForm(p => ({ ...p, frequency: f.id }))}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          form.frequency === f.id ? 'border-[#0B3D91] bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                        }`}>
                        <p className="text-sm font-semibold text-gray-900">{f.label}</p>
                        <p className="text-xs text-gray-400">{f.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Votre niveau général</label>
                  <div className="space-y-2">
                    {LEVELS.map(l => (
                      <button key={l.id} onClick={() => setForm(f => ({ ...f, level: l.id }))}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center justify-between ${
                          form.level === l.id ? 'border-[#0B3D91] bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                        }`}>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{l.label}</p>
                          <p className="text-xs text-gray-400">{l.desc}</p>
                        </div>
                        {form.level === l.id && <Check className="w-4 h-4 text-[#0B3D91] flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="px-8 pb-8 flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Retour
              </button>
            )}
            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#0B3D91] text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-[#0a3480] disabled:opacity-40 transition-colors">
                Continuer <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#0B3D91] to-[#FFA500] text-white px-4 py-3 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all">
                {saving ? 'Sauvegarde…' : <>Commencer à apprendre 🚀</>}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-white/50 text-xs mt-4">
          <button onClick={finish} className="hover:text-white/80 transition-colors">
            Passer cette étape
          </button>
        </p>
      </div>
    </div>
  )
}
