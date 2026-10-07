'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Layers, Search, GraduationCap, User, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  isLoggedIn: boolean
  dashboardHref: string
}

export default function PublicTabBar({ isLoggedIn, dashboardHref }: Props) {
  const pathname = usePathname()

  const items = [
    { href: '/', label: 'Accueil', icon: Home, match: (p: string) => p === '/' || p === '/accueil' },
    { href: '/catalogue', label: 'Formations', icon: Layers, match: (p: string) => p.startsWith('/catalogue') || p.startsWith('/formation') || p.startsWith('/parcours') },
    { href: '/recherche', label: 'Rechercher', icon: Search, match: (p: string) => p.startsWith('/recherche') },
    isLoggedIn
      ? { href: '/mes-formations', label: 'Mes cours', icon: GraduationCap, match: (p: string) => p.startsWith('/mes-formations') }
      : { href: '/inscription', label: "S'inscrire", icon: GraduationCap, match: (p: string) => p.startsWith('/inscription') },
    isLoggedIn
      ? { href: dashboardHref, label: 'Mon espace', icon: User, match: (p: string) => p.startsWith(dashboardHref) }
      : { href: '/connexion', label: 'Connexion', icon: LogIn, match: (p: string) => p.startsWith('/connexion') },
  ]

  return (
    <nav
      aria-label="Navigation principale"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 safe-bottom shadow-[0_-1px_12px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-stretch h-16">
        {items.map(item => {
          const active = item.match(pathname)
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className="relative flex-1 flex flex-col items-center justify-center gap-0.5"
            >
              <span
                className={cn(
                  'absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-b-full bg-[#0B3D91] transition-all duration-300',
                  active ? 'w-8 opacity-100' : 'w-0 opacity-0'
                )}
              />
              <span className={cn(
                'flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200',
                active ? 'bg-[#0B3D91]/10' : ''
              )}>
                <item.icon
                  className={active ? 'text-[#0B3D91]' : 'text-gray-400'}
                  strokeWidth={active ? 2.4 : 1.8}
                  style={{ width: 20, height: 20 }}
                />
              </span>
              <span className={cn('text-[10.5px] font-medium', active ? 'text-[#0B3D91]' : 'text-gray-500')}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
