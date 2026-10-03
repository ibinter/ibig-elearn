import { createClient } from '@/lib/supabase/server'
import { Mail, Zap, Clock } from 'lucide-react'
import RelancesPanel from './RelancesPanel'

export default async function RelancesPage() {
  const supabase = await createClient()

  const [{ data: courses }, { data: campaigns }] = await Promise.all([
    supabase.from('courses').select('id, title').eq('is_published', true).order('title'),
    supabase
      .from('relance_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const totalSent = campaigns?.reduce((s, c) => s + (c.sent_count ?? 0), 0) ?? 0
  const lastCampaign = campaigns?.[0]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Mail className="w-6 h-6 text-[#0B3D91]" /> Relances d'inactivité
        </h1>
        <p className="text-gray-500 text-sm mt-1">Ré-engagez les apprenants inactifs par email personnalisé</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-[#0B3D91]">{campaigns?.length ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">Campagnes envoyées</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{totalSent}</div>
          <div className="text-xs text-gray-500 mt-1">Emails envoyés</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-700 text-sm font-mono">
            {lastCampaign ? new Date(lastCampaign.created_at).toLocaleDateString('fr-FR') : '—'}
          </div>
          <div className="text-xs text-gray-500 mt-1">Dernière campagne</div>
        </div>
      </div>

      {/* Panel de configuration + prévisualisation */}
      <RelancesPanel courses={courses ?? []} />

      {/* Historique campagnes */}
      {!!campaigns?.length && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#0B3D91]" />
            <h2 className="font-semibold text-gray-900">Historique des campagnes</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {campaigns.map(c => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400">
                    Seuil : {c.threshold_days}j · Segment : {c.segment} · {c.recipients_count} ciblés
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-bold text-green-600">{c.sent_count} envoyés</span>
                  <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('fr-FR')}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
