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
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100 safe-bottom shadow-[0_-1px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
            >
              {/* Top active indicator */}
              <span
                className={cn(
                  'absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-b-full bg-[#0B3D91] transition-all duration-300',
                  active ? 'w-8 opacity-100' : 'w-0 opacity-0'
                )}
              />

              {/* Icon with background pill when active */}
              <span className={cn(
                'flex items-center justify-center w-8 h-6 rounded-lg transition-all duration-200',
                active ? 'bg-[#0B3D91]/10 scale-110' : 'scale-100'
              )}>
                <item.icon
                  className={cn('w-4.5 h-4.5 transition-colors duration-200', active ? 'text-[#0B3D91]' : 'text-gray-400')}
                  strokeWidth={active ? 2.5 : 1.8}
                  style={{ width: '18px', height: '18px' }}
                />
              </span>

              <span className={cn(
                'text-[10px] font-medium transition-colors duration-200',
                active ? 'text-[#0B3D91]' : 'text-gray-400'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
