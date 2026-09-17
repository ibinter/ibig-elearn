import { createClient } from '@/lib/supabase/server'
import { CheckCircle, XCircle, Award, User, BookOpen, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { code } = await params
  return { title: `Vérification certificat ${code}` }
}

export default async function VerifyCertificatePage({ params }: PageProps) {
  const { code } = await params
  const supabase = await createClient()

  const { data: cert } = await supabase
    .from('certificates')
    .select('*, user:profiles(full_name, country), course:courses(title, duration_hours, instructor:profiles(full_name))')
    .eq('verification_code', code.toUpperCase())
    .single()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B3D91]/5 to-[#FFA500]/5 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl ibig-gradient flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-[#0B3D91] text-xl">IBIG <span className="text-[#FFA500]">E-LEARN</span></span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {cert ? (
            <>
              {/* Valid */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-3" />
                <h1 className="text-2xl font-bold">Certificat valide</h1>
                <p className="text-green-100 text-sm mt-1">Ce certificat est authentique et émis par IBIG E-LEARN</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-[#0B3D91]/5 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Code de vérification</p>
                  <p className="font-mono font-bold text-[#0B3D91] text-lg">{cert.verification_code}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Titulaire</p>
                      <p className="font-semibold text-gray-900 text-sm">{(cert.user as any)?.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Date d&apos;émission</p>
                      <p className="font-semibold text-gray-900 text-sm">{formatDate(cert.issued_at)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-[#FFA500] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Formation</p>
                    <p className="font-semibold text-gray-900 text-sm">{(cert.course as any)?.title}</p>
                    <p className="text-xs text-gray-400">Formateur : {(cert.course as any)?.instructor?.full_name}</p>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4 text-center">
                  <p className="text-xs text-gray-400">Vérifié par IBIG SARL — IBIG EDUFORM · ibiglearn.com</p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Invalid */}
              <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6 text-white text-center">
                <XCircle className="w-16 h-16 mx-auto mb-3" />
                <h1 className="text-2xl font-bold">Certificat invalide</h1>
                <p className="text-red-100 text-sm mt-1">Ce code ne correspond à aucun certificat dans notre base</p>
              </div>
              <div className="p-6 text-center">
                <p className="text-gray-500 mb-2 text-sm">Code recherché :</p>
                <p className="font-mono text-gray-900 font-bold text-lg mb-4">{code.toUpperCase()}</p>
                <p className="text-gray-400 text-xs mb-6">
                  Vérifiez l&apos;exactitude du code ou contactez-nous à <a href="mailto:contact@ibiglearn.com" className="text-[#0B3D91] hover:underline">contact@ibiglearn.com</a>
                </p>
                <Link href="/" className="ibig-gradient text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity inline-block">
                  Retour à l&apos;accueil
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
