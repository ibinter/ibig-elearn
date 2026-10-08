import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Award, Download, ExternalLink, FileText, Clock, AlertTriangle, CheckCircle2, History } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { linkedInAddUrl } from '@/lib/openbadges'
import RenewButton from './RenewButton'

export const metadata = { title: 'Mes certificats' }

type Cert = {
  id: string; course_id: string; certificate_number: string; issued_at: string; expires_at: string | null
  is_revoked: boolean; superseded_at: string | null; course_title: string | null; instructor_name: string | null
  course: { title: string; duration_hours: number | null } | null
}

const DAY = 86400_000

export default async function MesCertificatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data } = await supabase
    .from('certificates')
    .select('id, course_id, certificate_number, issued_at, expires_at, is_revoked, superseded_at, course_title, instructor_name, course:courses(title, duration_hours)')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false })

  const all = (data ?? []) as unknown as Cert[]
  const current = all.filter(c => !c.superseded_at)
  const history = all.filter(c => c.superseded_at)
  const now = Date.now()
  const state = (c: Cert) => {
    if (c.is_revoked) return { key: 'revoked', label: 'Révoqué', cls: 'bg-red-50 text-red-700', icon: AlertTriangle }
    if (!c.expires_at) return { key: 'permanent', label: 'Valide (permanent)', cls: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 }
    const left = new Date(c.expires_at).getTime() - now
    if (left <= 0) return { key: 'expired', label: `Expiré le ${formatDate(c.expires_at)}`, cls: 'bg-red-50 text-red-700', icon: AlertTriangle }
    if (left <= 30 * DAY) return { key: 'soon', label: `Expire le ${formatDate(c.expires_at)}`, cls: 'bg-amber-50 text-amber-700', icon: Clock }
    return { key: 'valid', label: `Valide jusqu'au ${formatDate(c.expires_at)}`, cls: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 }
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes certificats</h1>
          <p className="text-gray-500 text-sm">{current.length} certificat{current.length > 1 ? 's' : ''} · vérifiables en ligne et au format Open Badges</p>
        </div>
        {all.length > 0 && (
          <Link href="/mes-certificats/releve" className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-800 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-gray-50">
            <FileText className="w-4 h-4 text-[#0B3D91]" /> Relevé de formation (PDF)
          </Link>
        )}
      </div>

      {current.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {current.map(cert => {
            const st = state(cert)
            const title = cert.course?.title ?? cert.course_title ?? 'Formation'
            const renewable = cert.expires_at && !cert.is_revoked && new Date(cert.expires_at).getTime() - now <= 30 * DAY
            return (
              <div key={cert.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <div className="bg-gradient-to-r from-[#0B3D91] to-[#1a6cc4] p-5 text-white relative">
                  <Award className="absolute top-3 right-3 w-14 h-14 opacity-20" />
                  <p className="text-[11px] text-blue-200 mb-1 uppercase tracking-widest">Certificat de réussite</p>
                  <h3 className="font-bold text-sm leading-snug pr-10">{title}</h3>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <span className={`self-start inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${st.cls}`}>
                    <st.icon className="w-3.5 h-3.5" /> {st.label}
                  </span>
                  <div className="mt-3 text-xs text-gray-500 space-y-1">
                    {cert.instructor_name && <p>Formateur : <span className="font-medium text-gray-700" data-no-translate>{cert.instructor_name}</span></p>}
                    <p>Délivré le : <span className="font-medium text-gray-700">{formatDate(cert.issued_at)}</span></p>
                    <p>N° <span className="font-mono font-bold text-[#0B3D91]">{cert.certificate_number}</span></p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link href={`/certificat/${cert.certificate_number}`}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold border border-[#0B3D91] text-[#0B3D91] py-2 rounded-lg hover:bg-[#0B3D91]/5">
                      <ExternalLink className="w-3.5 h-3.5" /> Vérifier
                    </Link>
                    {renewable ? <RenewButton courseId={cert.course_id} /> : (
                      <Link href={`/mes-certificats/${cert.id}/imprimer`}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-[#FFA500] text-black py-2 rounded-lg hover:bg-orange-500">
                        <Download className="w-3.5 h-3.5" /> Télécharger
                      </Link>
                    )}
                  </div>
                  {st.key !== 'expired' && st.key !== 'revoked' && (
                    <a href={linkedInAddUrl({ courseTitle: title, issuedAt: cert.issued_at, certNumber: cert.certificate_number })} target="_blank" rel="noopener"
                      className="mt-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#0A66C2] py-1.5 rounded-lg hover:bg-[#0A66C2]/5">
                      <span className="w-4 h-4 rounded-sm bg-[#0A66C2] text-white text-[10px] font-black leading-4 text-center" aria-hidden="true">in</span> Ajouter à LinkedIn
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Award className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h3 className="font-bold text-gray-900 mb-2">Aucun certificat pour l&apos;instant</h3>
          <p className="text-gray-400 text-sm mb-6">Terminez une formation pour obtenir votre premier certificat vérifiable.</p>
          <Link href="/catalogue" className="ibig-gradient text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 inline-block">Explorer les formations</Link>
        </div>
      )}

      {history.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 font-bold text-gray-900"><History className="w-5 h-5 text-gray-400" /> Historique des certifications</div>
          <ul className="divide-y divide-gray-50">
            {history.map(c => (
              <li key={c.id} className="px-5 py-3 flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block font-medium text-gray-800 truncate">{c.course?.title ?? c.course_title}</span>
                  <span className="block text-xs text-gray-400">Délivré le {formatDate(c.issued_at)}{c.expires_at ? ` · valable jusqu'au ${formatDate(c.expires_at)}` : ''}</span>
                </span>
                <Link href={`/certificat/${c.certificate_number}`} className="text-xs font-mono text-gray-500 hover:text-[#0B3D91]">{c.certificate_number}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
