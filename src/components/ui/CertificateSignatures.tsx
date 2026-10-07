type Props = {
  instructorName: string | null | undefined
  instructorSignature?: string | null
  instructorTitle?: string | null
  compact?: boolean
}

const SCRIPT = { fontFamily: '"Brush Script MT", "Segoe Script", "Lucida Handwriting", cursive' }

/** Double signature des attestations : Formateur Partenaire + IBIG EDUFORM. */
export default function CertificateSignatures({ instructorName, instructorSignature, instructorTitle, compact }: Props) {
  const name = instructorName || 'Formateur'
  const sig = instructorSignature || instructorName || ''
  const line = compact ? 'w-32' : 'w-40'
  return (
    <div className="w-full">
      <div className="flex items-end justify-around gap-6">
        <div className="text-center min-w-0">
          <p className={`${compact ? 'text-2xl' : 'text-3xl'} text-[#0B3D91] leading-none mb-1 truncate`} style={SCRIPT} data-no-translate>{sig}</p>
          <div className={`h-px ${line} bg-gray-300 mx-auto mb-1`} />
          <p className="text-sm font-semibold text-gray-700" data-no-translate>{name}</p>
          <p className="text-xs text-gray-400">{instructorTitle ? `${instructorTitle} · ` : ''}Formateur partenaire</p>
        </div>
        <div className="text-center min-w-0">
          <p className={`${compact ? 'text-2xl' : 'text-3xl'} text-[#0B3D91] leading-none mb-1`} style={SCRIPT} data-no-translate>IBIG EDUFORM</p>
          <div className={`h-px ${line} bg-gray-300 mx-auto mb-1`} />
          <p className="text-sm font-semibold text-gray-700">IBIG EDUFORM</p>
          <p className="text-xs text-gray-400">Direction pédagogique — IBIG SARL</p>
        </div>
      </div>
      <p className="mt-3 text-center text-[10px] uppercase tracking-widest text-gray-400">Certificat cosigné par le formateur partenaire et IBIG EDUFORM</p>
    </div>
  )
}
