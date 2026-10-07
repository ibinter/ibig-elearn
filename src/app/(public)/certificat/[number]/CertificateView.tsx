'use client'

import { CheckCircle, XCircle, Award, Calendar, Clock, Star, Printer } from 'lucide-react'
import Link from 'next/link'
import { SITE_URL } from '@/lib/site'
import CertificateSignatures from '@/components/ui/CertificateSignatures'

interface Cert {
  id: string
  certificate_number: string
  issued_at: string
  expires_at: string | null
  learner_name: string
  course_title: string
  instructor_name: string | null
  courses?: { slug?: string; cover_url?: string | null; instructor?: { full_name?: string | null; signature_name?: string | null; professional_title?: string | null } | null } | null
  final_score: number | null
  completion_time_h: number | null
  is_revoked: boolean
  revoked_at: string | null
}

export default function CertificateView({ cert }: { cert: Cert }) {
  const isValid = !cert.is_revoked && (!cert.expires_at || new Date(cert.expires_at) > new Date())
  const issuedDate = new Date(cert.issued_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      {/* Barre de vérification */}
      <div className={`w-full py-3 px-4 flex items-center justify-center gap-2 text-sm font-semibold print:hidden ${
        isValid ? 'bg-green-50 text-green-700 border-b border-green-200' : 'bg-red-50 text-red-700 border-b border-red-200'
      }`}>
        {isValid
          ? <><CheckCircle className="w-4 h-4" /> Certificat valide — émis par IBIG E-LEARN</>
          : <><XCircle className="w-4 h-4" /> {cert.is_revoked ? 'Certificat révoqué' : 'Certificat expiré'}</>
        }
      </div>

      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 print:bg-white print:py-0">
        {/* Certificat */}
        <div id="certificate" className="w-full max-w-3xl bg-white rounded-3xl shadow-xl overflow-hidden print:shadow-none print:rounded-none">
          {/* En-tête doré */}
          <div className="bg-gradient-to-r from-[#0B3D91] to-[#1a5cbf] px-10 py-8 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',
              backgroundSize: '20px 20px',
            }} />
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="w-8 h-8 text-[#FFA500]" />
                <span className="text-[#FFA500] font-bold text-lg tracking-widest uppercase">Certificat de réussite</span>
              </div>
              <p className="text-blue-200 text-sm">IBIG E-LEARN — Plateforme panafricaine de formation</p>
            </div>
          </div>

          {/* Corps */}
          <div className="px-10 py-10 text-center border-x-4 border-[#FFA500]/30">
            <p className="text-gray-500 text-sm mb-2">Ce certificat est décerné à</p>
            <h1 className="text-4xl font-bold text-[#0B3D91] mb-6">{cert.learner_name}</h1>
            <p className="text-gray-600 mb-2">pour avoir complété avec succès la formation</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">« {cert.course_title} »</h2>

            {/* Méta */}
            <div className="flex flex-wrap justify-center gap-6 mb-10">
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-[#0B3D91]" />
                <span>Délivré le {issuedDate}</span>
              </div>
              {cert.completion_time_h != null && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-[#0B3D91]" />
                  <span>{cert.completion_time_h.toFixed(0)}h de formation</span>
                </div>
              )}
              {cert.final_score != null && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Star className="w-4 h-4 text-[#FFA500]" />
                  <span>Score final : {cert.final_score.toFixed(0)} %</span>
                </div>
              )}
            </div>

            {/* Signatures */}
            <div className="mb-8">
              <CertificateSignatures
                instructorName={cert.courses?.instructor?.full_name ?? cert.instructor_name}
                instructorSignature={cert.courses?.instructor?.signature_name}
                instructorTitle={cert.courses?.instructor?.professional_title} />
            </div>
          </div>

          {/* Pied : QR + numéro */}
          <div className="bg-gray-50 px-10 py-6 flex items-center justify-between gap-6 border-t border-gray-100 print:bg-white">
            {/* QR code via API publique */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${
                encodeURIComponent(`${SITE_URL}/certificat/${cert.certificate_number}`)
              }`}
              alt="QR code de vérification"
              className="w-[90px] h-[90px] flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">Numéro de certificat</p>
              <p className="font-mono font-bold text-gray-800 text-sm">{cert.certificate_number}</p>
              <p className="text-xs text-gray-400 mt-1">
                Vérifiez l'authenticité sur <span className="text-[#0B3D91]">ibig-elearning.com/certificat/{cert.certificate_number}</span>
              </p>
            </div>
            {isValid
              ? <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
              : <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
            }
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#0B3D91] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#0a3480] transition-colors"
          >
            <Printer className="w-4 h-4" />
            Télécharger / Imprimer
          </button>
          {cert.courses?.slug && (
            <Link href={`/formation/${cert.courses.slug}`}
              className="flex items-center gap-2 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              Voir la formation
            </Link>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          body { margin: 0; }
          @page { size: A4 landscape; margin: 10mm; }
          .print\\:hidden { display: none !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
          .print\\:py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
        }
      `}</style>
    </>
  )
}
