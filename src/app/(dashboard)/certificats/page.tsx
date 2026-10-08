import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Award, ExternalLink, Calendar, Star, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function CertificatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: certs } = await supabase
    .from('certificates')
    .select('id, certificate_number, issued_at, course_title, instructor_name, final_score, completion_time_h, is_revoked, courses:course_id(slug, thumbnail_url)')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#FFA500]/10 flex items-center justify-center">
          <Award className="w-5 h-5 text-[#FFA500]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes certificats</h1>
          <p className="text-sm text-gray-500">{certs?.length ?? 0} certificat{(certs?.length ?? 0) !== 1 ? 's' : ''} obtenu{(certs?.length ?? 0) !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {!certs?.length ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-600">Aucun certificat pour l'instant</p>
          <p className="text-sm text-gray-400 mt-1">Terminez une formation pour obtenir votre certificat</p>
          <Link href="/formations" className="mt-4 inline-block bg-[#0B3D91] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0a3480] transition-colors">
            Explorer les formations
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {certs.map(cert => {
            const course = cert.courses as any
            const issuedDate = new Date(cert.issued_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
            return (
              <div key={cert.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex gap-0 ${cert.is_revoked ? 'opacity-60 border-red-200' : 'border-gray-100'}`}>
                {/* Bande latérale */}
                <div className="w-1.5 bg-gradient-to-b from-[#0B3D91] to-[#FFA500] flex-shrink-0" />

                {/* Cover miniature */}
                {course?.thumbnail_url && (
                  <div className="w-24 flex-shrink-0 bg-gray-100 hidden sm:block">
                    <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex-1 p-5 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 truncate">{cert.course_title}</h3>
                      {cert.is_revoked && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex-shrink-0">Révoqué</span>
                      )}
                    </div>
                    {cert.instructor_name && (
                      <p className="text-sm text-gray-500 mb-3">par {cert.instructor_name}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{issuedDate}</span>
                      {cert.completion_time_h != null && (
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{Number(cert.completion_time_h).toFixed(0)}h de formation</span>
                      )}
                      {cert.final_score != null && (
                        <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-[#FFA500]" />{Number(cert.final_score).toFixed(0)} %</span>
                      )}
                    </div>
                    <p className="font-mono text-xs text-gray-400 mt-2">{cert.certificate_number}</p>
                  </div>

                  <Link
                    href={`/certificat/${cert.certificate_number}`}
                    target="_blank"
                    className="flex-shrink-0 flex items-center gap-1.5 bg-[#0B3D91] text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-[#0a3480] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Voir
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
