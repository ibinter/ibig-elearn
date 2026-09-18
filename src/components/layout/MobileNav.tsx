'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, GraduationCap, MessageCircle, Trophy, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/tableau-de-bord', label: 'Accueil', icon: LayoutDashboard },
  { href: '/mes-formations', label: 'Formations', icon: GraduationCap },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/fidelite', label: 'Points', icon: Trophy },
  { href: '/profil', label: 'Profil', icon: User },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 safe-bottom">
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
                active ? 'text-[#0B3D91]' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <item.icon className={cn('w-5 h-5', active && 'text-[#0B3D91]')} strokeWidth={active ? 2.5 : 1.8} />
              <span className={cn('text-[10px] font-medium', active ? 'text-[#0B3D91]' : 'text-gray-400')}>{item.label}</span>
              {active && <span className="absolute bottom-0 w-8 h-0.5 bg-[#0B3D91] rounded-full" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
