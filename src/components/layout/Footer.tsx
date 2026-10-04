import Link from 'next/link'
import Image from 'next/image'
import { getT } from '@/i18n'

export default async function Footer() {
  const t = await getT()

  return (
    <footer className="bg-[#0B3D91] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <Image src="/logo-full.webp" alt="IBIG E-LEARNING" width={160} height={48} className="h-12 w-auto" />
            </div>
            <p className="text-blue-200 text-sm leading-relaxed mb-4">
              {t.footer.tagline}
            </p>
            <div className="flex gap-3">
              {['f', 'in', 'yt', 'x'].map(s => (
                <a key={s} href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-xs font-bold text-white">{s}</a>
              ))}
            </div>
          </div>

          {/* Formations */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t.footer.learn}</h3>
            <ul className="space-y-2">
              {[
                { label: t.footer.catalog, href: '/catalogue' },
                { label: t.footer.paths, href: '/parcours' },
                { label: t.footer.certifications, href: '/certifications' },
                { label: t.footer.becomeInstructor, href: '/devenir-formateur' },
                { label: t.footer.enterprise, href: '/entreprise' },
              ].map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="text-blue-200 hover:text-white text-sm transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Liens utiles */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t.footer.company}</h3>
            <ul className="space-y-2">
              {[
                { label: t.footer.about, href: '/a-propos' },
                { label: t.footer.blog, href: '/blog' },
{ label: t.footer.faq, href: '/faq' },
                { label: t.footer.contact, href: '/contact' },
                { label: t.locale === 'en' ? 'Verify certificate' : 'Vérifier un certificat', href: '/verify' },
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
              <li>✉️ contact@ibig-elearning.com</li>
              <li className="pt-2">
                <span className="text-white font-medium">{t.locale === 'en' ? 'Accepted payments' : 'Paiements acceptés'}</span>
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
          <p className="text-blue-300 text-sm">© {new Date().getFullYear()} IBIG SARL — IBIG EDUFORM. {t.footer.rights}</p>
          <div className="flex gap-4">
            <Link href="/cgu" className="text-blue-300 hover:text-white text-sm">{t.footer.cgu}</Link>
            <Link href="/cgv" className="text-blue-300 hover:text-white text-sm">{t.footer.cgv}</Link>
            <Link href="/confidentialite" className="text-blue-300 hover:text-white text-sm">{t.footer.privacy}</Link>
            <Link href="/mentions-legales" className="text-blue-300 hover:text-white text-sm">{t.footer.mentions}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
