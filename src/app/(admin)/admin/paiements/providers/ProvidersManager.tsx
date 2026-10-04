'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Globe, Star, Power, PowerOff, ArrowUp, ArrowDown, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Provider {
  id: string
  name: string
  label: string
  description: string
  logo_url?: string
  api_route: string
  is_active: boolean
  is_default: boolean
  position: number
  countries: string[]
  currencies: string[]
  methods: string[]
  region: 'africa' | 'europe' | 'global'
}

const REGION_COLORS = {
  africa:  { bg: 'bg-green-900/20', border: 'border-green-700/40', badge: 'bg-green-900 text-green-300' },
  europe:  { bg: 'bg-blue-900/20',  border: 'border-blue-700/40',  badge: 'bg-blue-900 text-blue-300' },
  global:  { bg: 'bg-purple-900/20',border: 'border-purple-700/40',badge: 'bg-purple-900 text-purple-300' },
}
const REGION_LABELS = { africa: '🌍 Afrique', europe: '🇪🇺 Europe/Diaspora', global: '🌐 Global' }

export default function ProvidersManager({ providers: initial }: { providers: Provider[] }) {
  const [providers, setProviders] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const update = async (id: string, patch: Partial<Provider>) => {
    setLoading(id)
    try {
      if (patch.is_default) {
        // Retirer l'ancien défaut d'abord
        await supabase.from('payment_providers').update({ is_default: false }).eq('is_default', true)
      }
      await supabase.from('payment_providers').update(patch).eq('id', id)
      setProviders(prev => prev.map(p =>
        p.id === id
          ? { ...p, ...patch }
          : patch.is_default ? { ...p, is_default: false } : p
      ))
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  const movePosition = async (id: string, dir: 'up' | 'down') => {
    const idx = providers.findIndex(p => p.id === id)
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === providers.length - 1)) return
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    const a = providers[idx]
    const b = providers[swapIdx]
    await Promise.all([
      supabase.from('payment_providers').update({ position: b.position }).eq('id', a.id),
      supabase.from('payment_providers').update({ position: a.position }).eq('id', b.id),
    ])
    const next = [...providers]
    next[idx] = { ...a, position: b.position }
    next[swapIdx] = { ...b, position: a.position }
    setProviders(next.sort((x, y) => x.position - y.position))
  }

  return (
    <div className="space-y-3">
      {providers.map((p, idx) => {
        const colors = REGION_COLORS[p.region]
        const isLoading = loading === p.id
        const isExpanded = expanded === p.id
        return (
          <div key={p.id} className={cn('rounded-2xl border overflow-hidden transition-all', colors.bg, colors.border)}>
            <div className="flex items-center gap-4 p-4">
              {/* Ordre */}
              <div className="flex flex-col gap-0.5">
                <button onClick={() => movePosition(p.id, 'up')} disabled={idx === 0} className="text-gray-500 hover:text-white disabled:opacity-20">
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => movePosition(p.id, 'down')} disabled={idx === providers.length - 1} className="text-gray-500 hover:text-white disabled:opacity-20">
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-semibold">{p.name}</span>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', colors.badge)}>
                    {REGION_LABELS[p.region]}
                  </span>
                  {p.is_default && (
                    <span className="flex items-center gap-1 text-xs bg-[#FFA500]/20 text-[#FFA500] px-2 py-0.5 rounded-full font-semibold">
                      <Star className="w-3 h-3" /> Défaut
                    </span>
                  )}
                  {!p.is_active && (
                    <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">inactif</span>
                  )}
                </div>
                <p className="text-gray-400 text-xs mt-0.5 truncate">{p.label}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Définir par défaut */}
                {!p.is_default && p.is_active && (
                  <button
                    onClick={() => update(p.id, { is_default: true })}
                    disabled={!!loading}
                    title="Définir comme provider par défaut"
                    className="text-xs text-gray-400 hover:text-[#FFA500] border border-gray-700 hover:border-[#FFA500]/50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Activer / Désactiver */}
                <button
                  onClick={() => update(p.id, { is_active: !p.is_active, ...(p.is_default && !p.is_active === false ? { is_default: false } : {}) })}
                  disabled={!!loading || (p.is_default && p.is_active)}
                  title={p.is_active ? 'Désactiver' : 'Activer'}
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40',
                    p.is_active
                      ? 'bg-green-900/30 text-green-400 border-green-700/50 hover:bg-red-900/30 hover:text-red-400 hover:border-red-700/50'
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-green-900/30 hover:text-green-400 hover:border-green-700/50'
                  )}
                >
                  {isLoading ? (
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : p.is_active ? (
                    <><Power className="w-3.5 h-3.5" /> Actif</>
                  ) : (
                    <><PowerOff className="w-3.5 h-3.5" /> Inactif</>
                  )}
                </button>

                {/* Détails */}
                <button onClick={() => setExpanded(isExpanded ? null : p.id)} className="text-gray-500 hover:text-white">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Détails expandés */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                <p className="text-gray-400 text-sm">{p.description}</p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500 mb-1.5 font-semibold uppercase tracking-wider">Pays couverts</p>
                    <div className="flex flex-wrap gap-1">
                      {p.countries.length === 0
                        ? <span className="text-gray-400">Tous</span>
                        : p.countries.map(c => (
                          <span key={c} className="bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">{c}</span>
                        ))
                      }
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1.5 font-semibold uppercase tracking-wider">Devises</p>
                    <div className="flex flex-wrap gap-1">
                      {p.currencies.map(c => (
                        <span key={c} className="bg-gray-800 text-[#FFA500] px-1.5 py-0.5 rounded font-mono">{c}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-gray-500 text-xs mb-1.5 font-semibold uppercase tracking-wider">Méthodes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.methods.map(m => (
                      <span key={m} className="flex items-center gap-1 text-xs bg-gray-800 text-gray-300 px-2.5 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3 text-green-400" /> {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-gray-600 font-mono bg-gray-900 rounded-lg px-3 py-2">
                  Route API : <span className="text-gray-400">{p.api_route}</span>
                </div>
              </div>
            )}
          </div>
        )
      })}

      <div className="mt-4 p-4 bg-gray-900 rounded-xl border border-gray-800 text-xs text-gray-500">
        <Globe className="w-4 h-4 inline mr-1.5 text-gray-400" />
        Le <span className="text-[#FFA500] font-semibold">provider par défaut</span> est présenté en premier à l'apprenant.
        Seuls les providers dont la route API est implémentée peuvent être activés.
        Pour brancher un nouveau provider, créer <code className="text-gray-300">src/app/api/payment/[id]/route.ts</code> et l'activer ici.
      </div>
    </div>
  )
}
