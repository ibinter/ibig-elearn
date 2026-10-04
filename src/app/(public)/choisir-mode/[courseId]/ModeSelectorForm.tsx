'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Play, ShoppingCart, Zap, BookOpen, Trophy, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type Mode = 'autonome' | 'guide' | 'certifiant'

interface Props {
  courseId: string
  courseSlug: string
  priceXof: number
  isFree: boolean
  hasCertificate: boolean
  isAlreadyEnrolled: boolean
  currentMode: string | null
}

const MODES: {
  id: Mode
  label: string
  emoji: string
  tagline: string
  description: string
  features: string[]
  color: string
  border: string
  recommended?: boolean
}[] = [
  {
    id: 'autonome',
    label: 'Autonome',
    emoji: '⚡',
    tagline: 'Apprenez à votre rythme',
    description: 'Accédez à tout le contenu librement, sans contrainte d\'ordre.',
    features: ['Toutes les leçons débloquées', 'Progression libre', 'Quiz optionnels', 'Idéal pour réviser'],
    color: 'text-blue-700',
    border: 'border-blue-300',
  },
  {
    id: 'guide',
    label: 'Guidé',
    emoji: '📚',
    tagline: 'Suivez un parcours structuré',
    description: 'Les modules se débloquent progressivement. Validez chaque étape avant d\'avancer.',
    features: ['Modules débloqués séquentiellement', 'Quiz requis pour avancer', 'Progression guidée', 'Meilleure rétention'],
    color: 'text-[#0B3D91]',
    border: 'border-[#0B3D91]',
    recommended: true,
  },
  {
    id: 'certifiant',
    label: 'Certifiant',
    emoji: '🏆',
    tagline: 'Obtenez votre certificat IBIG',
    description: 'Parcours complet avec examen final. Validez vos compétences et obtenez un certificat reconnu.',
    features: ['Parcours guidé strict', 'Examen final ≥80%', 'Certificat IBIG officiel', 'Comptabilisé sur LinkedIn'],
    color: 'text-[#FFA500]',
    border: 'border-[#FFA500]',
  },
]

export default function ModeSelectorForm({
  courseId, courseSlug, priceXof, isFree, hasCertificate,
  isAlreadyEnrolled, currentMode,
}: Props) {
  const [selected, setSelected] = useState<Mode>((currentMode as Mode) ?? 'guide')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleConfirm = async () => {
    setLoading(true)

    // Si déjà inscrit → juste mettre à jour le mode
    if (isAlreadyEnrolled) {
      await supabase
        .from('enrollments')
        .update({ mode: selected })
        .eq('course_id', courseId)

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('enrollments')
          .update({ mode: selected })
          .eq('user_id', user.id)
          .eq('course_id', courseId)
      }
      router.push(`/apprendre/${courseId}/intro`)
      return
    }

    // Formation gratuite → inscription directe avec mode
    if (isFree) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/connexion'); return }

      const { error } = await supabase.from('enrollments').insert({
        user_id: user.id,
        course_id: courseId,
        status: 'active',
        paid_amount: 0,
        paid_currency: 'XOF',
        payment_method: 'free',
        mode: selected,
      })
      if (!error) {
        router.push(`/apprendre/${courseId}/intro`)
      } else {
        setLoading(false)
      }
      return
    }

    // Formation payante → aller au paiement avec le mode en query param
    router.push(`/paiement/${courseId}?mode=${selected}`)
  }

  const availableModes = MODES.filter(m => m.id !== 'certifiant' || hasCertificate)

  return (
    <div className="space-y-4">
      {/* Cartes modes */}
      <div className="grid gap-3">
        {availableModes.map(m => {
          const isSelected = selected === m.id
          return (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={cn(
                'w-full text-left p-5 rounded-2xl border-2 transition-all bg-white relative',
                isSelected ? `${m.border} shadow-md` : 'border-gray-200 hover:border-gray-300'
              )}
            >
              {m.recommended && (
                <span className="absolute top-3 right-3 text-[10px] bg-[#0B3D91] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                  Recommandé
                </span>
              )}
              <div className="flex items-start gap-4">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-colors',
                  isSelected ? 'bg-gray-100' : 'bg-gray-50'
                )}>
                  {m.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn('font-bold text-base', isSelected ? m.color : 'text-gray-900')}>{m.label}</span>
                    {isSelected && <CheckCircle className={cn('w-4 h-4', m.color)} />}
                  </div>
                  <p className="text-gray-500 text-xs mb-2">{m.tagline}</p>
                  <p className="text-gray-600 text-sm mb-3">{m.description}</p>
                  <ul className="flex flex-wrap gap-x-4 gap-y-1">
                    {m.features.map(f => (
                      <li key={f} className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="text-green-500">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Note mode certifiant */}
      {selected === 'certifiant' && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-700 flex items-start gap-2">
          <Trophy className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Le mode Certifiant inclut un examen final chronométré (60 min, ≥80% requis). Vous pouvez changer de mode à tout moment depuis vos paramètres.</span>
        </div>
      )}

      {/* Note mode autonome */}
      {selected === 'autonome' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 flex items-start gap-2">
          <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>En mode Autonome, toutes les leçons sont accessibles immédiatement. Vous pouvez passer en mode Certifiant à tout moment.</span>
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-4 bg-[#0B3D91] hover:bg-[#0a3480] text-white font-bold text-base rounded-2xl transition-colors disabled:opacity-60 mt-2"
      >
        {loading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Chargement…</>
        ) : isAlreadyEnrolled ? (
          <><BookOpen className="w-5 h-5" /> Changer pour le mode {MODES.find(m => m.id === selected)?.label}</>
        ) : isFree ? (
          <><Play className="w-5 h-5" /> S&apos;inscrire gratuitement — Mode {MODES.find(m => m.id === selected)?.label}</>
        ) : (
          <><ShoppingCart className="w-5 h-5" /> Continuer vers le paiement</>
        )}
      </button>

      {!isAlreadyEnrolled && (
        <p className="text-center text-xs text-gray-400">
          Vous pourrez changer de mode à tout moment depuis votre espace apprenant.
        </p>
      )}
    </div>
  )
}
