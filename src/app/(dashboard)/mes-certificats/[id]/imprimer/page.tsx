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
      {/* Boutons hors impression */}
      <div className="print:hidden bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-gray-600 font-medium">📜 Certificat officiel</span>
        <div className="flex items-center gap-2">
          {/* Partage LinkedIn */}
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://ibig-elearn.vercel.app/verify/${cert.verification_code}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[#0A66C2] text-white hover:bg-[#004182] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            LinkedIn
          </a>
          {/* Partage WhatsApp */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`🎓 J'ai obtenu mon certificat "${course?.title}" sur IBIG E-LEARN !\n\nVérifiez : https://ibig-elearn.vercel.app/verify/${cert.verification_code}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[#25D366] text-white hover:bg-[#128C7E] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            WhatsApp
          </a>
          <PrintButton />
        </div>
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
