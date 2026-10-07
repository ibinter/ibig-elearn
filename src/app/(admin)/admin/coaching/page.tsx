import { createClient } from '@/lib/supabase/server'
import { HeartHandshake } from 'lucide-react'
import { BOOKING_STATUS } from '@/lib/coaching'

export const metadata = { title: 'Coaching' }

type Row = {
  id: string; status: string; starts_at: string; price_xof: number; cancel_reason: string | null
  offer: { title: string } | null; coach: { full_name: string } | null; learner: { full_name: string; email: string } | null
}

export default async function AdminCoachingPage() {
  const supabase = await createClient()
  const [{ data }, { count: offers }, { data: earnings }] = await Promise.all([
    supabase.from('coaching_bookings')
      .select('id, status, starts_at, price_xof, cancel_reason, offer:coaching_offers(title), coach:profiles!coaching_bookings_coach_id_fkey(full_name), learner:profiles!coaching_bookings_learner_id_fkey(full_name, email)')
      .neq('status', 'expired').order('starts_at', { ascending: false }).limit(200),
    supabase.from('coaching_offers').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('instructor_earnings').select('gross_amount_xof, platform_amount_xof').not('coaching_booking_id', 'is', null).eq('status', 'credited'),
  ])
  const rows = (data ?? []) as unknown as Row[]
  const paidIds = new Set<string>()
  const { data: pays } = await supabase.from('payments').select('coaching_booking_id').eq('status', 'completed').not('coaching_booking_id', 'is', null)
  for (const p of pays ?? []) paidIds.add(p.coaching_booking_id as string)
  const toRefund = rows.filter(r => r.status === 'cancelled' && paidIds.has(r.id))
  const gross = (earnings ?? []).reduce((s, e) => s + Number(e.gross_amount_xof), 0)
  const platform = (earnings ?? []).reduce((s, e) => s + Number(e.platform_amount_xof), 0)
  const fmt = (n: number) => n.toLocaleString('fr-FR')

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 rounded-xl bg-[#0B3D91]/10 text-[#0B3D91] flex items-center justify-center"><HeartHandshake className="w-5 h-5" /></span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coaching individuel</h1>
          <p className="text-gray-500 text-sm mt-0.5">Séances réservées, revenus et remboursements</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['Offres en ligne', fmt(offers ?? 0)],
          ['Séances confirmées', fmt(rows.filter(r => ['confirmed', 'completed'].includes(r.status)).length)],
          ['CA coaching', `${fmt(gross)} FCFA`],
          ['Part IBIG EDUFORM', `${fmt(platform)} FCFA`],
        ].map(([k, v]) => (
          <div key={k} className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500">{k}</p>
            <p className="mt-1 text-xl font-extrabold text-gray-900">{v}</p>
          </div>
        ))}
      </div>

      {toRefund.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-bold text-amber-900">{toRefund.length} remboursement(s) à traiter</p>
          <p className="text-sm text-amber-800">Séances payées puis annulées. Remboursez depuis GeniusPay, puis passez le paiement en « Remboursé » dans Paiements : la part du coach est alors retirée automatiquement.</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Offre</th><th className="px-4 py-3">Coach</th><th className="px-4 py-3">Apprenant</th><th className="px-4 py-3">Prix</th><th className="px-4 py-3">Statut</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aucune séance pour l&apos;instant.</td></tr>}
              {rows.map(r => {
                const st = BOOKING_STATUS[r.status] ?? BOOKING_STATUS.confirmed
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(r.starts_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Africa/Abidjan' })}</td>
                    <td className="px-4 py-3 min-w-[180px]">{r.offer?.title}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{r.coach?.full_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{r.learner?.full_name}<span className="block text-xs text-gray-400">{r.learner?.email}</span></td>
                    <td className="px-4 py-3 whitespace-nowrap">{r.price_xof ? `${fmt(r.price_xof)} FCFA` : 'Gratuit'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                      {r.status === 'cancelled' && paidIds.has(r.id) && <span className="block text-[11px] text-amber-700 mt-1">À rembourser</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
