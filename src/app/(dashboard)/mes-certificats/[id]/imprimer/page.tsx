import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import PrintButton from './PrintButton'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ImprimerCertificatPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: cert } = await supabase
    .from('certificates')
    .select('*, user:profiles(full_name, country), course:courses(title, duration_hours, instructor:profiles(full_name))')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!cert) notFound()

  const holder = (cert.user as any)?.full_name ?? 'Apprenant'
  const course = cert.course as any
  const verifyUrl = `https://ibig-elearn.vercel.app/verify/${cert.verification_code}`

  return (
    <>
      {/* Bouton hors impression */}
      <div className="print:hidden bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="text-sm text-gray-600">Aperçu du certificat</span>
        <PrintButton />
      </div>

      {/* Certificat A4 */}
      <div className="min-h-screen bg-gray-100 print:bg-white flex items-start justify-center py-8 print:py-0">
        <div id="certificate"
          className="w-[794px] min-h-[562px] bg-white shadow-2xl print:shadow-none relative overflow-hidden"
          style={{ fontFamily: 'Georgia, serif' }}>

          {/* Bordure décorative */}
          <div className="absolute inset-0 border-[12px] border-[#0B3D91] pointer-events-none" />
          <div className="absolute inset-[16px] border-[2px] border-[#FFA500]/60 pointer-events-none" />

          {/* Motifs de fond */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="absolute text-[#0B3D91]" style={{
                fontSize: '120px', top: `${i * 16}%`, left: `${(i % 3) * 33}%`, transform: 'rotate(-15deg)',
              }}>🏛️</div>
            ))}
          </div>

          <div className="relative px-14 py-10 flex flex-col items-center text-center">
            {/* Logo / En-tête */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#0B3D91] flex items-center justify-center">
                <span className="text-white text-lg font-black">I</span>
              </div>
              <div className="text-left">
                <p className="text-[#0B3D91] font-black text-xl leading-none tracking-tight">IBIG E-LEARN</p>
                <p className="text-[#FFA500] text-xs font-semibold tracking-widest uppercase">Plateforme panafricaine</p>
              </div>
            </div>

            <div className="w-20 h-px bg-[#FFA500] mb-6" />

            <p className="text-gray-500 text-sm uppercase tracking-[0.3em] mb-2">Certificat de réussite</p>
            <p className="text-gray-400 text-xs mb-8">Ce certificat est décerné à</p>

            {/* Nom du titulaire */}
            <h1 className="text-5xl font-bold text-[#0B3D91] mb-2"
              style={{ fontFamily: 'Georgia, serif', letterSpacing: '-1px' }}>
              {holder}
            </h1>

            <div className="w-48 h-px bg-gray-300 mb-6 mt-2" />

            <p className="text-gray-500 text-sm mb-3">pour avoir suivi et validé avec succès la formation</p>

            <div className="bg-gradient-to-r from-[#0B3D91]/5 to-[#FFA500]/5 border border-[#0B3D91]/20 rounded-xl px-8 py-4 mb-6 max-w-lg">
              <h2 className="text-xl font-bold text-gray-900 leading-snug">{course?.title}</h2>
              {course?.duration_hours && (
                <p className="text-sm text-gray-500 mt-1">{course.duration_hours} heures · Formateur : {course?.instructor?.full_name}</p>
              )}
            </div>

            <p className="text-sm text-gray-500 mb-8">
              Délivré le <strong className="text-gray-700">{formatDate(cert.issued_at)}</strong>
              {(cert.user as any)?.country && <> · {(cert.user as any).country}</>}
            </p>

            {/* Signatures & QR */}
            <div className="flex items-end justify-between w-full mt-4">
              <div className="text-center">
                <div className="w-32 h-px bg-gray-400 mb-2" />
                <p className="text-xs text-gray-500">Direction pédagogique</p>
                <p className="text-xs font-semibold text-gray-700">IBIG SARL</p>
              </div>

              {/* QR Code via API publique */}
              <div className="flex flex-col items-center gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(verifyUrl)}&size=80x80&margin=2`}
                  alt="QR vérification"
                  width={80}
                  height={80}
                  className="rounded-lg border border-gray-200"
                />
                <p className="text-[10px] text-gray-400">Vérifier l&apos;authenticité</p>
              </div>

              <div className="text-center">
                <div className="w-32 h-px bg-gray-400 mb-2" />
                <p className="text-xs text-gray-500">Formateur</p>
                <p className="text-xs font-semibold text-gray-700">{course?.instructor?.full_name}</p>
              </div>
            </div>

            {/* Code de vérification */}
            <div className="mt-6 bg-gray-50 rounded-lg px-4 py-2.5 w-full">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Code de vérification</p>
              <p className="font-mono text-xs font-bold text-[#0B3D91] tracking-widest">{cert.verification_code}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{verifyUrl}</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </>
  )
}
