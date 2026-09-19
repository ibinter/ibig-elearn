'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, BookOpen, Users, BarChart2, PlusCircle, LogOut, Video, Bell, Menu, X, DollarSign, Tag, MessageSquare, Banknote } from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
}

type Props = {
  userName: string
  userInitial: string
}

const NAV: NavItem[] = [
  { href: '/formateur', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/formateur/formations', label: 'Mes formations', icon: BookOpen },
  { href: '/formateur/formations/nouvelle', label: 'Nouvelle formation', icon: PlusCircle },
  { href: '/formateur/apprenants', label: 'Apprenants', icon: Users },
  { href: '/formateur/statistiques', label: 'Statistiques', icon: BarChart2 },
  { href: '/formateur/revenus', label: 'Revenus', icon: DollarSign },
  { href: '/formateur/sessions-live', label: 'Sessions live', icon: Video },
  { href: '/formateur/coupons', label: 'Codes promo', icon: Tag },
  { href: '/formateur/messagerie', label: 'Messagerie', icon: MessageSquare },
  { href: '/formateur/virements', label: 'Virements', icon: Banknote },
  { href: '/formateur/notifier', label: 'Notifier', icon: Bell },
]

export default function FormateurSidebar({ userName, userInitial }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href
    if (item.href === '/formateur/formations' && pathname.startsWith('/formateur/formations/nouvelle')) return false
    return pathname.startsWith(item.href)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-black text-[#0B3D91]">IBIG</span>
          <span className="text-xs bg-[#FFA500]/15 text-[#FFA500] px-2 py-0.5 rounded-full font-semibold">FORMATEUR</span>
        </Link>
        <button onClick={() => setOpen(false)} className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User */}
      <div className="px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full ibig-gradient flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {userInitial}
          </div>
          <p className="text-sm font-medium text-gray-700 truncate">{userName}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = isActive(item)
          return (
            <Link key={item.href} href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${active ? 'bg-[#0B3D91]/8 text-[#0B3D91]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#0B3D91] rounded-r-full" />}
              <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#0B3D91]' : 'text-gray-400'}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        <Link href="/tableau-de-bord" className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#0B3D91] px-3 py-2 rounded-xl hover:bg-gray-50 transition-all duration-150 mb-1">
          ← Espace apprenant
        </Link>
        <form action="/api/auth/signout" method="POST">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-150 w-full">
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-gray-200 fixed inset-y-0 z-30">
        <SidebarContent />
      </aside>

      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setOpen(true)} className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-black text-[#0B3D91] text-sm">IBIG <span className="text-[#FFA500]">FORMATEUR</span></span>
        <div className="w-9" />
      </header>

      <div className={`lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)} />

      <aside className={`lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>
    </>
  )
}
