'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, LogOut, Menu, X, LayoutDashboard, GraduationCap, Award, User, Share2, BarChart2, MessageCircle, Trophy, Video, Target, Bell } from 'lucide-react'
import NotificationBell from '@/components/ui/NotificationBell'

type Props = {
  userName: string
  userInitial: string
  userRole: string
  userId: string
  isFormateur: boolean
}

export default function DashboardSidebar({ userName, userInitial, userRole, userId, isFormateur }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const navItems = [
    { href: '/tableau-de-bord', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
    { href: '/mes-formations', label: 'Mes formations', icon: GraduationCap },
    { href: '/mes-parcours', label: 'Mes parcours', icon: Target },
    { href: '/mes-certificats', label: 'Mes certificats', icon: Award },
    { href: '/profil', label: 'Mon profil', icon: User },
    { href: `/apprenant/${userId}`, label: 'Profil public', icon: Share2 },
    { href: '/messages', label: 'Messages', icon: MessageCircle },
    { href: '/fidelite', label: 'Programme fidélité', icon: Trophy },
    { href: '/sessions-live', label: 'Sessions live', icon: Video },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    ...(isFormateur ? [{ href: '/formateur', label: 'Espace Formateur', icon: BarChart2, exact: false }] : []),
  ]

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
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg ibig-gradient flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-[#0B3D91] text-base">IBIG</span>
            <span className="font-bold text-[#FFA500] text-base ml-0.5">E-LEARN</span>
          </div>
        </Link>
        <button onClick={() => setOpen(false)} className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full ibig-gradient flex items-center justify-center text-white font-bold flex-shrink-0">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{userName}</p>
            <p className="text-xs text-gray-400 capitalize">{userRole}</p>
          </div>
          <NotificationBell />
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = isActive(item.href, item.exact)
          return (
            <Link key={item.href} href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${active ? 'bg-[#0B3D91]/8 text-[#0B3D91]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#0B3D91] rounded-r-full" />}
              <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-[#0B3D91]' : 'text-gray-400'}`} />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mx-3 mb-3 rounded-xl bg-gradient-to-br from-[#FFA500]/10 to-[#0B3D91]/10 border border-[#FFA500]/20 p-3">
        <p className="text-xs font-bold text-gray-800 mb-0.5">💰 Gagnez des revenus</p>
        <p className="text-xs text-gray-500 mb-2">Promouvez IBIG et touchez des commissions</p>
        <a href="https://ibigpartners.com/rejoindre" target="_blank" rel="noopener noreferrer"
          className="block text-center text-xs font-semibold text-white ibig-gradient rounded-lg py-1.5 hover:opacity-90 transition-opacity">
          Rejoindre IBIG PARTNER →
        </a>
      </div>

      <div className="p-3 border-t border-gray-100">
        <Link href="/catalogue" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150 mb-0.5">
          <BookOpen className="w-5 h-5 text-gray-400" /> Découvrir des formations
        </Link>
        <form action="/api/auth/signout" method="post">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-150 w-full">
            <LogOut className="w-5 h-5" /> Déconnexion
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
        <button onClick={() => setOpen(true)} className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Menu">
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg ibig-gradient flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-[#0B3D91] text-sm">IBIG <span className="text-[#FFA500]">E-LEARN</span></span>
        </Link>
        <NotificationBell />
      </header>

      <div className={`lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)} />

      <aside className={`lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>
    </>
  )
}
