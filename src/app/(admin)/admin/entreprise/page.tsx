import { createClient } from '@/lib/supabase/server'
import { Building2, Mail, Phone, Users, Calendar, MessageSquare } from 'lucide-react'
import B2BStatusActions from './B2BStatusActions'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new:             { label: 'Nouveau',          color: 'bg-blue-100 text-blue-700' },
  contacted:       { label: 'Contacté',         color: 'bg-yellow-100 text-yellow-700' },
  proposal_sent:   { label: 'Devis envoyé',     color: 'bg-purple-100 text-purple-700' },
  won:             { label: 'Gagné ✓',          color: 'bg-green-100 text-green-700' },
  lost:            { label: 'Perdu',            color: 'bg-red-100 text-red-700' },
}

export default async function AdminEntreprisePage() {
  const supabase = await createClient()

  const { data: requests } = await supabase
    .from('b2b_requests')
    .select('*')
    .order('created_at', { ascending: false })

  const stats = {
    total: requests?.length ?? 0,
    new: requests?.filter(r => r.status === 'new').length ?? 0,
    won: requests?.filter(r => r.status === 'won').length ?? 0,
    inProgress: requests?.filter(r => ['contacted', 'proposal_sent'].includes(r.status)).length ?? 0,
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#0B3D91]" /> Demandes Entreprise (B2B)
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gérez les demandes de formation corporate</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total demandes', value: stats.total, color: 'text-gray-900' },
          { label: 'Nouveaux', value: stats.new, color: 'text-blue-600' },
          { label: 'En cours', value: stats.inProgress, color: 'text-yellow-600' },
          { label: 'Gagnés', value: stats.won, color: 'text-green-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Liste */}
      {(requests?.length ?? 0) === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune demande entreprise pour l'instant.</p>
          <p className="text-xs text-gray-400 mt-1">Les demandes soumises via /entreprise apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests!.map(req => {
            const statusCfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.new
            return (
              <div key={req.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="font-bold text-gray-900 text-lg">{req.company}</h2>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                      {req.learners_count && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          <Users className="w-3 h-3" /> {req.learners_count} apprenants
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                      <span className="font-medium">{req.contact_name}</span>
                      {req.sector && <span className="text-gray-400">{req.sector}</span>}
                      {req.company_size && <span className="text-gray-400">{req.company_size}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(req.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mb-4 text-sm">
                  <a href={`mailto:${req.email}`} className="flex items-center gap-2 text-[#0B3D91] hover:underline">
                    <Mail className="w-4 h-4" /> {req.email}
                  </a>
                  <a href={`tel:${req.phone}`} className="flex items-center gap-2 text-gray-700 hover:text-[#0B3D91]">
                    <Phone className="w-4 h-4" /> {req.phone}
                  </a>
                </div>

                {req.message && (
                  <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-700">
                    <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{req.message}</p>
                  </div>
                )}

                <B2BStatusActions requestId={req.id} currentStatus={req.status} currentNotes={req.notes} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
