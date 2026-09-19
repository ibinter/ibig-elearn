import { createClient } from '@/lib/supabase/server'
import { Shield, CheckCircle, XCircle, Award, User, BookOpen, Calendar } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

interface Props { params: Promise<{ code: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  return {
    title: `Vérification certificat ${code} — IBIG E-LEARN`,
    description: 'Vérification de l\'authenticité d\'un certificat IBIG E-LEARN.',
  }
}

export default async function VerifyCertificatePage({ params }: Props) {
  const { code } = await params
  const supabase = await createClient()

  const { data: cert } = await supabase
    .from('certificates')
    .select('id, issued_at, credential_id, course:courses(title, slug, thumbnail_url, duration_hours), user:profiles(full_name, country)')
    .eq('credential_id', code.toUpperCase())
    .single()

  const valid = !!cert

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        {valid ? (
          <div className="text-center space-y-6">
            {/* Badge validé */}
            <div className="relative inline-flex">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full ibig-gradient flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">Certificat authentique</h1>
              <p className="text-green-600 font-medium text-sm mt-1">Ce certificat est valide et authentique</p>
            </div>

            {/* Carte certificat */}
            <div className="bg-white rounded-3xl border-2 border-green-200 shadow-lg overflow-hidden text-left">
              {/* Header gradient */}
              <div className="ibig-gradient p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-8 h-8 text-[#FFA500]" />
                  <div>
                    <p className="text-blue-200 text-xs font-medium">IBIG E-LEARN</p>
                    <p className="font-bold">Certificat de complétion</p>
                  </div>
                </div>
                <p className="text-blue-100 text-xs">Code : <code className="bg-white/10 px-2 py-0.5 rounded font-mono">{code.toUpperCase()}</code></p>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Délivré à</p>
                    <p className="font-bold text-gray-900">{(cert.user as any)?.full_name}</p>
                    {(cert.user as any)?.country && <p className="text-xs text-gray-400">{(cert.user as any)?.country}</p>}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Formation complétée</p>
                    <p className="font-bold text-gray-900">{(cert.course as any)?.title}</p>
                    {(cert.course as any)?.duration_hours > 0 && (
                      <p className="text-xs text-gray-400">{(cert.course as any)?.duration_hours}h de formation</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Date de délivrance</p>
                    <p className="font-bold text-gray-900">
                      {new Date(cert.issued_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-green-50 border-t border-green-100 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-xs text-green-700 font-medium">Certificat vérifié et authentifié par IBIG E-LEARN</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/catalogue"
                className="ibig-gradient text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm text-center">
                Explorer le catalogue
              </Link>
              <Link href="/verify"
                className="border border-gray-200 text-gray-700 font-medium px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm text-center">
                Vérifier un autre certificat
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Certificat introuvable</h1>
              <p className="text-gray-500 text-sm mt-2">
                Le code <code className="bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-700">{code.toUpperCase()}</code> ne correspond à aucun certificat dans notre base de données.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left">
              <p className="text-sm font-semibold text-amber-800 mb-2">Vérifiez :</p>
              <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                <li>Que le code a été saisi correctement (majuscules, sans espaces)</li>
                <li>Que le document provient bien d'IBIG E-LEARN</li>
                <li>Que la formation a bien été complétée avant cette vérification</li>
              </ul>
            </div>
            <Link href="/verify"
              className="inline-block ibig-gradient text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm">
              Réessayer
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
