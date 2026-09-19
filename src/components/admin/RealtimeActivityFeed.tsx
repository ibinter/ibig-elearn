'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, CreditCard, BookOpen, Wifi, WifiOff } from 'lucide-react'

interface Activity {
  id: string
  type: 'payment' | 'enrollment' | 'user'
  label: string
  time: string
  amount?: number
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return "À l'instant"
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)}min`
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const typeConfig = {
  payment: { icon: CreditCard, color: 'text-green-600 bg-green-50', label: 'Paiement' },
  enrollment: { icon: BookOpen, color: 'text-blue-600 bg-blue-50', label: 'Inscription' },
  user: { icon: Users, color: 'text-purple-600 bg-purple-50', label: 'Nouvel utilisateur' },
}

interface Props {
  initialActivities: Activity[]
}

export default function RealtimeActivityFeed({ initialActivities }: Props) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [connected, setConnected] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const push = (a: Activity) => {
      setActivities(prev => [a, ...prev].slice(0, 20))
    }

    const paymentsChannel = supabase
      .channel('admin-realtime-payments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments', filter: 'status=eq.completed' },
        (p) => {
          push({
            id: p.new.id,
            type: 'payment',
            label: `Paiement de ${p.new.amount?.toLocaleString('fr')} ${p.new.currency}`,
            time: p.new.created_at,
            amount: p.new.amount,
          })
        }
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'enrollments' },
        (p) => {
          push({ id: p.new.id, type: 'enrollment', label: 'Nouvelle inscription à une formation', time: p.new.enrolled_at ?? new Date().toISOString() })
        }
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' },
        (p) => {
          push({ id: p.new.id, type: 'user', label: `${p.new.full_name ?? 'Nouvel utilisateur'} vient de s'inscrire`, time: p.new.created_at })
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED')
      })

    return () => { supabase.removeChannel(paymentsChannel) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <h3 className="font-bold text-gray-900 text-sm">Activité en direct</h3>
        <div className="flex items-center gap-1.5">
          {connected
            ? <><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /><span className="text-xs text-green-600 font-medium">Live</span></>
            : <><WifiOff className="w-3.5 h-3.5 text-gray-300" /><span className="text-xs text-gray-400">Connexion…</span></>
          }
        </div>
      </div>

      <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="py-10 text-center">
            <Wifi className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">En attente d'activité…</p>
          </div>
        ) : activities.map(a => {
          const cfg = typeConfig[a.type]
          const Icon = cfg.icon
          return (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">{a.label}</p>
                <p className="text-xs text-gray-400">{fmtTime(a.time)}</p>
              </div>
              {a.amount != null && (
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex-shrink-0">
                  +{a.amount.toLocaleString('fr')}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
