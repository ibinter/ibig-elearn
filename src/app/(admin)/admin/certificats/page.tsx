import { createClient } from '@/lib/supabase/server'
import { Award, ExternalLink, Download } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function AdminCertificatsPage() {
  const supabase = await createClient()

  const { data: certificates } = await supabase
    .from('certificates')
    .select('*, user:profiles(full_name, email), course:courses(title)')
    .order('issued_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Certificats</h1>
        <p className="text-gray-500">{certificates?.length ?? 0} certificat(s) délivré(s)</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Apprenant</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Formation</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Code de vérification</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Délivré le</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(certificates as any[])?.map(cert => (
              <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full ibig-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {cert.user?.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{cert.user?.full_name}</p>
                      <p className="text-xs text-gray-400">{cert.user?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell max-w-[180px]">
                  <p className="truncate">{cert.course?.title}</p>
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs font-mono text-[#0B3D91] bg-blue-50 px-2 py-1 rounded">
                    {cert.verification_code}
                  </code>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{formatDate(cert.issued_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link href={`/verify/${cert.verification_code}`}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#0B3D91] transition-colors" title="Vérifier">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    {cert.pdf_url && (
                      <a href={cert.pdf_url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#FFA500] transition-colors" title="Télécharger PDF">
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {(!certificates || certificates.length === 0) && (
              <tr>
                <td colSpan={5} className="text-center py-12">
                  <Award className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Aucun certificat délivré pour l'instant</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
