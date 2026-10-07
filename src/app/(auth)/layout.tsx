import Link from 'next/link'
import Image from 'next/image'
import { Award, Smartphone, Users } from 'lucide-react'

const POINTS = [
  { icon: Award, title: 'Certificats vérifiables', text: 'Reconnus par les employeurs dans 14 pays' },
  { icon: Smartphone, title: 'Paiement Mobile Money', text: 'Orange Money, MTN, Wave, Moov ou carte' },
  { icon: Users, title: 'Experts africains', text: 'Formateurs et coachs partenaires IBIG EDUFORM' },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col text-white overflow-x-clip">
      {/* ── Fond photo plein écran ── */}
      <div className="fixed inset-0 -z-10" aria-hidden="true">
        <picture>
          <source media="(max-width: 767px)" srcSet="/images/auth-bg-mobile.webp" />
          <img src="/images/auth-bg.webp" alt="" className="w-full h-full object-cover object-center scale-105" fetchPriority="high" />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-b from-[#06142f]/80 via-[#0B3D91]/70 to-[#06142f]/90 lg:bg-gradient-to-r lg:from-[#06142f]/95 lg:via-[#0B3D91]/80 lg:to-[#0B3D91]/35" />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#FFA500]/20 blur-3xl" />
      </div>

      <header className="px-4 sm:px-8 pt-[calc(1rem+env(safe-area-inset-top))] pb-2">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <Image src="/logo-icon.webp" alt="" width={40} height={40} className="rounded-xl shadow-lg" priority />
          <span className="font-extrabold text-lg tracking-tight">IBIG <span className="text-[#FFA500]">E-LEARNING</span></span>
        </Link>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 lg:py-10 grid lg:grid-cols-2 gap-10 items-center">
        {/* Accroche (ordinateur) */}
        <section className="hidden lg:block max-w-lg">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#FFA500] bg-white/10 backdrop-blur px-3 py-1.5 rounded-full border border-white/15">
            Plateforme panafricaine de formation
          </p>
          <h2 className="mt-5 text-5xl font-extrabold leading-[1.05] tracking-tight">
            Formez-vous.<br />Certifiez-vous.<br /><span className="text-[#FFA500]">Progressez.</span>
          </h2>
          <p className="mt-5 text-lg text-blue-100/90 leading-relaxed">
            Des formations certifiantes et du coaching conçus pour les professionnels d&apos;Afrique francophone, à suivre depuis votre téléphone.
          </p>
          <ul className="mt-8 space-y-4">
            {POINTS.map(p => (
              <li key={p.title} className="flex items-start gap-3.5">
                <span className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur border border-white/15 flex items-center justify-center flex-shrink-0">
                  <p.icon className="w-5 h-5 text-[#FFA500]" />
                </span>
                <span>
                  <span className="block font-semibold">{p.title}</span>
                  <span className="block text-sm text-blue-100/80">{p.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Formulaire */}
        <div className="w-full flex flex-col items-center lg:items-end text-gray-900">
          <p className="lg:hidden mb-5 text-center text-white text-[22px] font-extrabold leading-tight drop-shadow">
            Formez-vous. Certifiez-vous. <span className="text-[#FFA500]">Progressez.</span>
          </p>
          <div className="w-full flex justify-center lg:justify-end [&>div]:shadow-2xl [&>div]:shadow-black/30">
            {children}
          </div>
        </div>
      </main>

      <footer className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2 text-center text-xs text-blue-100/70">
        © {new Date().getFullYear()} IBIG SARL · IBIG EDUFORM
      </footer>
    </div>
  )
}
