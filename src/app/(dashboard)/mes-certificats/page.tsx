import { createClient } from '@/lib/supabase/server'
import { Award, Download, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function MesCertificatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: certificates } = await supabase
    .from('certificates')
    .select('*, course:courses(title, thumbnail_url, duration_hours, instructor:profiles(full_name))')
    .eq('user_id', user!.id)
    .order('issued_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Mes certificats</h1>
        <p className="text-gray-500">{certificates?.length ?? 0} certificat{(certificates?.length ?? 0) > 1 ? 's' : ''} obtenu{(certificates?.length ?? 0) > 1 ? 's' : ''}</p>
      </div>

      {certificates && certificates.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(certificates as any[]).map(cert => (
            <div key={cert.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Header doré */}
              <div className="bg-gradient-to-r from-[#0B3D91] to-[#1a6cc4] p-5 text-white relative">
                <div className="absolute top-3 right-3 opacity-20">
                  <Award className="w-16 h-16" />
                </div>
                <p className="text-xs text-blue-200 mb-1 uppercase tracking-widest">Certificat de réussite</p>
                <h3 className="font-bold text-sm leading-snug">{cert.course?.title}</h3>
              </div>
              <div className="p-5">
                <div className="text-xs text-gray-500 space-y-1 mb-4">
                  <p>Formateur : <span className="font-medium text-gray-700">{cert.course?.instructor?.full_name}</span></p>
                  <p>Délivré le : <span className="font-medium text-gray-700">{formatDate(cert.issued_at)}</span></p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-400 mb-1">Code de vérification</p>
                  <p className="font-mono text-xs font-bold text-[#0B3D91] break-all">{cert.verification_code}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/verify/${cert.verification_code}`}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold border border-[#0B3D91] text-[#0B3D91] py-2 rounded-lg hover:bg-[#0B3D91]/5 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" /> Vérifier
                  </Link>
                  <Link href={`/mes-certificats/${cert.id}/imprimer`}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-[#FFA500] text-black py-2 rounded-lg hover:bg-orange-500 transition-colors">
                    <Download className="w-3.5 h-3.5" /> Télécharger
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Award className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h3 className="font-bold text-gray-900 mb-2">Aucun certificat pour l&apos;instant</h3>
          <p className="text-gray-400 text-sm mb-6">Terminez une formation pour obtenir votre premier certificat vérifiable.</p>
          <Link href="/catalogue" className="ibig-gradient text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 inline-block">
            Explorer les formations
          </Link>
        </div>
      )}
    </div>
  )
}
