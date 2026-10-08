import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SITE_URL } from '@/lib/site'
import PrintButton from './PrintButton'

export const metadata = { title: 'Relevé de formation' }

const fr = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

/** Relevé officiel : toutes les formations suivies, heures, résultats et certificats (imprimable / PDF). */
export default async function RelevePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [{ data: profile }, { data: enrollments }, { data: certs }] = await Promise.all([
    supabase.from('profiles').select('full_name, email, country, job_title').eq('id', user.id).single(),
    supabase.from('enrollments')
      .select('course_id, enrolled_at, completed_at, progress_percent, course:courses(title, duration_hours, category:categories(name))')
      .eq('user_id', user.id).order('enrolled_at'),
    supabase.from('certificates').select('course_id, certificate_number, issued_at, expires_at, final_score, superseded_at, is_revoked')
      .eq('user_id', user.id).is('superseded_at', null),
  ])

  type Row = { course_id: string; enrolled_at: string; completed_at: string | null; progress_percent: number | null; course: { title: string; duration_hours: number | null; category: { name: string } | null } | null }
  const rows = (enrollments ?? []) as unknown as Row[]
  const certBy = new Map((certs ?? []).map(c => [c.course_id, c]))
  const done = rows.filter(r => r.completed_at || (r.progress_percent ?? 0) >= 100)
  const hours = done.reduce((s, r) => s + (r.course?.duration_hours ?? 0), 0)
  const today = new Date()
  const ref = `REL-${user.id.slice(0, 8).toUpperCase()}-${today.toISOString().slice(0, 10).replace(/-/g, '')}`

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-4 print:hidden">
        <Link href="/mes-certificats" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0B3D91]"><ArrowLeft className="w-4 h-4" /> Mes certificats</Link>
        <PrintButton />
      </div>

      <article className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10 print:shadow-none print:border-0 print:rounded-none print:p-0 text-gray-900">
        <header className="flex items-start justify-between gap-4 border-b-2 border-[#0B3D91] pb-5">
          <div>
            <img src="/logo-full.webp" alt="IBIG E-LEARNING" className="h-10 w-auto" />
            <p className="mt-2 text-xs text-gray-500">IBIG SARL — IBIG EDUFORM · Abidjan, Côte d&apos;Ivoire</p>
          </div>
          <div className="text-right">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B3D91] uppercase tracking-wide">Relevé de formation</h1>
            <p className="text-xs text-gray-500 mt-1">Établi le {fr(today.toISOString())} · Réf. <span className="font-mono">{ref}</span></p>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400">Titulaire</p>
            <p className="font-bold text-base" data-no-translate>{profile?.full_name ?? '—'}</p>
            <p className="text-gray-600" data-no-translate>{profile?.email}</p>
            {profile?.job_title && <p className="text-gray-600">{profile.job_title}</p>}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { v: rows.length, l: 'Formations suivies' },
              { v: done.length, l: 'Terminées' },
              { v: `${hours} h`, l: 'Heures validées' },
            ].map(k => (
              <div key={k.l} className="rounded-xl bg-gray-50 p-3 print:border print:border-gray-200">
                <p className="text-lg font-extrabold text-[#0B3D91]">{k.v}</p>
                <p className="text-[11px] text-gray-500 leading-tight">{k.l}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#0B3D91] text-white text-left text-xs">
                <th className="px-3 py-2 font-semibold">Formation</th>
                <th className="px-3 py-2 font-semibold">Durée</th>
                <th className="px-3 py-2 font-semibold">Début</th>
                <th className="px-3 py-2 font-semibold">Fin</th>
                <th className="px-3 py-2 font-semibold">Résultat</th>
                <th className="px-3 py-2 font-semibold">Certificat</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">Aucune formation suivie.</td></tr>}
              {rows.map(r => {
                const c = certBy.get(r.course_id)
                const finished = r.completed_at || (r.progress_percent ?? 0) >= 100
                const expired = c?.expires_at && new Date(c.expires_at) < today
                return (
                  <tr key={r.course_id} className="border-b border-gray-100 align-top">
                    <td className="px-3 py-2.5">
                      <p className="font-semibold">{r.course?.title ?? 'Formation'}</p>
                      {r.course?.category?.name && <p className="text-[11px] text-gray-400">{r.course.category.name}</p>}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{r.course?.duration_hours ?? 0} h</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{fr(r.enrolled_at)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{finished ? fr(r.completed_at ?? c?.issued_at ?? null) : '—'}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {finished ? <span className="font-semibold text-emerald-700">Validée{c?.final_score != null ? ` · ${c.final_score} %` : ''}</span> : <span className="text-gray-500">En cours · {r.progress_percent ?? 0} %</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {c ? (
                        <>
                          <p className="font-mono text-xs">{c.certificate_number}</p>
                          <p className={`text-[11px] ${c.is_revoked || expired ? 'text-red-600' : 'text-gray-400'}`}>
                            {c.is_revoked ? 'Révoqué' : c.expires_at ? (expired ? `Expiré le ${fr(c.expires_at)}` : `Valide jusqu'au ${fr(c.expires_at)}`) : 'Permanent'}
                          </p>
                        </>
                      ) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <footer className="mt-8 pt-4 border-t border-gray-200 text-[11px] text-gray-500 leading-relaxed">
          Chaque certificat mentionné peut être vérifié en ligne sur <span className="text-[#0B3D91]">{SITE_URL.replace('https://', '')}/certificat/&lt;numéro&gt;</span>.
          Ce relevé est généré à partir des données de la plateforme IBIG E-LEARNING à la date indiquée.
        </footer>
      </article>
    </div>
  )
}
