import Link from 'next/link'
import { Download, ArrowLeft, FileText, Users, BookOpen, Award } from 'lucide-react'

export default function AdminExportsPage() {
  const exports = [
    { label: 'Apprenants', description: 'Nom, email, pays, niveau, points, date d\'inscription', type: 'users', icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Inscriptions', description: 'Apprenant, formation, progression, date', type: 'enrollments', icon: BookOpen, color: 'bg-green-50 text-green-600' },
    { label: 'Certificats', description: 'Numéro de certificat, apprenant, formation, date', type: 'certificates', icon: Award, color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Exports CSV</h1>
          <p className="text-sm text-gray-500">Téléchargez les données de la plateforme</p>
        </div>
      </div>

      <div className="space-y-3">
        {exports.map(item => (
          <div key={item.type} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{item.label}</p>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
            <a
              href={`/api/admin/export?type=${item.type}`}
              className="flex items-center gap-2 bg-[#0B3D91] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-800 transition-colors flex-shrink-0"
            >
              <Download className="w-4 h-4" /> CSV
            </a>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold mb-0.5">Note</p>
          <p>Les exports CSV sont encodés en UTF-8 avec BOM pour une compatibilité optimale avec Excel et Google Sheets.</p>
        </div>
      </div>
    </div>
  )
}
