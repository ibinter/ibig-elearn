import Link from 'next/link'
import { BookOpen, Globe } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#0B3D91] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-white text-lg">IBIG</span>
                <span className="font-bold text-[#FFA500] text-lg ml-1">E-LEARN</span>
              </div>
            </div>
            <p className="text-blue-200 text-sm leading-relaxed mb-4">
              La référence de la formation professionnelle en ligne en Afrique francophone. Apprenez à votre rythme, certifiez-vous, évoluez.
            </p>
            <div className="flex gap-3">
              {['f', 'in', 'yt', 'x'].map(s => (
                <a key={s} href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-xs font-bold text-white">{s}</a>
              ))}
            </div>
          </div>

          {/* Formations */}
          <div>
            <h3 className="font-semibold text-white mb-4">Formations</h3>
            <ul className="space-y-2">
              {['Formation professionnelle', 'Numérique & Informatique', 'Immobilier & Foncier', 'BTP & Travaux publics', 'Commerce & E-commerce', 'Gestion & Entrepreneuriat'].map(cat => (
                <li key={cat}>
                  <Link href={`/catalogue?categorie=${cat}`} className="text-blue-200 hover:text-white text-sm transition-colors">{cat}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Liens utiles */}
          <div>
            <h3 className="font-semibold text-white mb-4">Liens utiles</h3>
            <ul className="space-y-2">
              {[
                { label: 'À propos de nous', href: '/a-propos' },
                { label: 'Devenir formateur', href: '/devenir-formateur' },
                { label: 'Certifications', href: '/certifications' },
                { label: 'Blog', href: '/blog' },
                { label: 'Contact', href: '/contact' },
                { label: 'Vérifier un certificat', href: '/verify' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-blue-200 hover:text-white text-sm transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-blue-200">
              <li>📍 Abidjan Cocody Riviera Palmeraie</li>
              <li>📞 +225 XX XX XX XX XX</li>
              <li>✉️ contact@ibiglearn.com</li>
              <li className="pt-2">
                <span className="text-white font-medium">Paiements acceptés</span>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {['Orange Money', 'MTN Money', 'Wave', 'Visa / Mastercard'].map(p => (
                    <span key={p} className="text-xs bg-white/10 px-2 py-1 rounded">{p}</span>
                  ))}
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-blue-300 text-sm">© {new Date().getFullYear()} IBIG SARL — IBIG EDUFORM. Tous droits réservés.</p>
          <div className="flex gap-4">
            <Link href="/cgu" className="text-blue-300 hover:text-white text-sm">CGU</Link>
            <Link href="/cgv" className="text-blue-300 hover:text-white text-sm">CGV</Link>
            <Link href="/confidentialite" className="text-blue-300 hover:text-white text-sm">Confidentialité</Link>
            <Link href="/mentions-legales" className="text-blue-300 hover:text-white text-sm">Mentions légales</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
