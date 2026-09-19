'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Menu, X, LayoutDashboard, Users, BookMarked, CreditCard, Award, Settings, Building2, Tag, Target, Bell, FileText, Mail, Star } from 'lucide-react'

type Props = {
  userName: string
  userInitial: string
  userRole: string
}

const NAV = [
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/admin/formations', label: 'Formations', icon: BookMarked },
  { href: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
  { href: '/admin/paiements', label: 'Paiements', icon: CreditCard },
  { href: '/admin/certificats', label: 'Certificats', icon: Award },
  { href: '/admin/entreprise', label: 'Entreprise B2B', icon: Building2 },
  { href: '/admin/parcours', label: 'Parcours', icon: Target },
  { href: '/admin/coupons', label: 'Coupons & Promos', icon: Tag },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
  { href: '/admin/newsletter', label: 'Newsletter', icon: Mail },
  { href: '/admin/temoignages', label: 'Témoignages', icon: Star },
  { href: '/admin/parametres', label: 'Paramètres', icon: Settings },
]

export default function AdminSidebar({ userName, userInitial, userRole }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-blue-800 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm">IBIG</span>
            <span className="font-bold text-[#FFA500] text-sm ml-0.5">E-LEARN</span>
          </div>
        </Link>
        <button onClick={() => setOpen(false)} className="lg:hidden p-1 rounded-lg text-blue-300 hover:text-white hover:bg-white/10 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-3 border-b border-blue-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {userInitial}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{userName}</p>
            <p className="text-blue-300 text-xs capitalize">{userRole}</p>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xs font-bold text-[#FFA500] bg-[#FFA500]/15 px-2 py-0.5 rounded-full">Administration</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = isActive(item.href, item.exact)
          return (
            <Link key={item.href} href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${active ? 'bg-white/15 text-white' : 'text-blue-200 hover:bg-white/10 hover:text-white'}`}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#FFA500] rounded-r-full" />}
              <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#FFA500]' : 'text-blue-300'}`} />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-blue-800">
        <Link href="/tableau-de-bord" className="flex items-center gap-2 text-blue-300 hover:text-white text-xs py-2 px-3 rounded-xl hover:bg-white/10 transition-all duration-150">
          ← Espace apprenant
        </Link>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:flex w-60 flex-col bg-[#0B3D91] fixed inset-y-0 z-30">
        <SidebarContent />
      </aside>

      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[#0B3D91] px-4 py-3 flex items-center justify-between">
        <button onClick={() => setOpen(true)} className="p-2 rounded-xl text-blue-200 hover:bg-white/10 hover:text-white transition-colors" aria-label="Menu">
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold text-white text-sm">IBIG <span className="text-[#FFA500]">E-LEARN</span></span>
        </Link>
        <div className="w-9" />
      </header>

      <div className={`lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)} />

      <aside className={`lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-[#0B3D91] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>
    </>
  )
}
