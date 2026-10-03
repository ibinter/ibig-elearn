import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import ExportPanel from './ExportPanel'

export default function AdminExportsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Exports &amp; Comptabilité</h1>
          <p className="text-sm text-gray-500">Téléchargez les données en CSV (compatible Excel / Google Sheets)</p>
        </div>
      </div>

      <ExportPanel />

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold mb-0.5">Encodage</p>
          <p>Tous les fichiers sont encodés en <strong>UTF-8 avec BOM</strong> pour une compatibilité optimale avec Microsoft Excel et Google Sheets.</p>
        </div>
      </div>
    </div>
  )
}
