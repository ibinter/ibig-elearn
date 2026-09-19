'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { Menu, X, BookOpen, ChevronDown, User, LogOut, LayoutDashboard, BookMarked, Users, BarChart2, Trophy, Heart, FileText, Star, Layers, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'
import CurrencySelector from '@/components/ui/CurrencySelector'
import GlobalSearch from '@/components/search/GlobalSearch'
import NotificationBell from '@/components/ui/NotificationBell'
import DarkModeToggle from '@/components/ui/DarkModeToggle'

interface NavbarProps {
  user?: Profile | null
}

function CatalogueDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const items = [
    { href: '/catalogue', icon: Layers, label: 'Tout le catalogue', desc: '184+ formations certifiantes', color: 'text-[#0B3D91]' },
    { href: '/catalogue?featured=true', icon: Star, label: 'Formations vedettes', desc: 'Les plus populaires', color: 'text-[#FFA500]' },
    { href: '/parcours', icon: TrendingUp, label: 'Parcours métiers', desc: 'Progressions guidées', color: 'text-green-600' },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        onMouseEnter={() => setOpen(true)}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-gray-600 hover:text-[#0B3D91] font-medium text-sm transition-colors py-1"
      >
        Formations <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          onMouseLeave={() => setOpen(false)}
          className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50"
        >
          {items.map(item => (
            <Link key={item.href} href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
              <div className={`w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <item.icon className={`w-4.5 h-4.5 ${item.color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
            </Link>
          ))}
          <div className="border-t border-gray-100 mx-4 my-2" />
          <Link href="/catalogue" onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1 text-xs text-[#0B3D91] font-semibold py-2 hover:underline">
            Voir les 25+ domaines →
          </Link>
        </div>
      )}
    </div>
  )
}

export default function Navbar({ user }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const dashboardLink = () => {
    if (!user) return '/connexion'
    if (user.role === 'admin' || user.role === 'coordinateur') return '/admin'
    if (user.role === 'formateur') return '/formateur'
    return '/tableau-de-bord'
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 rounded-lg ibig-gradient flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-black text-[#0B3D91] text-base tracking-tight">IBIG</span>
              <span className="font-black text-[#FFA500] text-base tracking-tight -mt-1">E-LEARN</span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-5 flex-1">
            <CatalogueDropdown />
            <Link href="/blog" className="text-gray-600 hover:text-[#0B3D91] font-medium text-sm transition-colors whitespace-nowrap">
              Blog
            </Link>
            <Link href="/entreprise" className="text-gray-600 hover:text-[#0B3D91] font-medium text-sm transition-colors whitespace-nowrap">
              Entreprise
            </Link>
            <Link href="/a-propos" className="text-gray-600 hover:text-[#0B3D91] font-medium text-sm transition-colors whitespace-nowrap">
              À propos
            </Link>

            {/* Search — takes remaining space */}
            <div className="flex-1 min-w-0 max-w-xs">
              <GlobalSearch />
            </div>
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <DarkModeToggle />
            <CurrencySelector />
            {user && <NotificationBell />}

            {user ? (
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 py-1.5 pl-2 pr-3 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0B3D91] to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-[90px] truncate">{user.full_name.split(' ')[0]}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-sm font-bold text-gray-900 truncate">{user.full_name}</p>
                      <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                    </div>
                    <Link href={dashboardLink()} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setProfileOpen(false)}>
                      <LayoutDashboard className="w-4 h-4 text-[#0B3D91]" /> Tableau de bord
                    </Link>
                    {(user.role === 'formateur' || user.role === 'admin' || user.role === 'coordinateur') && (
                      <Link href="/formateur" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#0B3D91] font-semibold hover:bg-blue-50 transition-colors" onClick={() => setProfileOpen(false)}>
                        <BookOpen className="w-4 h-4" /> Espace formateur
                      </Link>
                    )}
                    {(user.role === 'admin' || user.role === 'coordinateur') && (
                      <Link href="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 font-semibold hover:bg-red-50 transition-colors" onClick={() => setProfileOpen(false)}>
                        <LayoutDashboard className="w-4 h-4" /> Administration
                      </Link>
                    )}
                    <div className="border-t border-gray-100 my-1" />
                    <Link href="/mes-formations" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setProfileOpen(false)}>
                      <BookMarked className="w-4 h-4 text-gray-400" /> Mes formations
                    </Link>
                    <Link href="/mes-favoris" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setProfileOpen(false)}>
                      <Heart className="w-4 h-4 text-gray-400" /> Mes favoris
                    </Link>
                    <Link href="/mes-stats" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setProfileOpen(false)}>
                      <BarChart2 className="w-4 h-4 text-gray-400" /> Mes statistiques
                    </Link>
                    <Link href="/mes-badges" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setProfileOpen(false)}>
                      <Trophy className="w-4 h-4 text-gray-400" /> Mes badges
                    </Link>
                    <Link href="/parrainage" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setProfileOpen(false)}>
                      <Users className="w-4 h-4 text-gray-400" /> Parrainage
                    </Link>
                    <Link href="/mes-notes" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setProfileOpen(false)}>
                      <FileText className="w-4 h-4 text-gray-400" /> Mes notes
                    </Link>
                    <Link href="/profil" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setProfileOpen(false)}>
                      <User className="w-4 h-4 text-gray-400" /> Mon profil
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    <button onClick={handleSignOut} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4" /> Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/connexion"
                  className="text-sm font-semibold text-gray-700 hover:text-[#0B3D91] px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap">
                  Connexion
                </Link>
                <Link href="/inscription"
                  className="text-sm font-bold text-white ibig-gradient px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap">
                  S&apos;inscrire gratuitement
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden ml-auto p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
          <div className="px-4 py-4 space-y-1">
            <div className="mb-3">
              <GlobalSearch className="w-full" />
            </div>
            <Link href="/catalogue" className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors" onClick={() => setMenuOpen(false)}>
              <Layers className="w-4 h-4 text-[#0B3D91]" /> Catalogue
            </Link>
            <Link href="/catalogue?featured=true" className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors" onClick={() => setMenuOpen(false)}>
              <Star className="w-4 h-4 text-[#FFA500]" /> Formations vedettes
            </Link>
            <Link href="/parcours" className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors" onClick={() => setMenuOpen(false)}>
              <TrendingUp className="w-4 h-4 text-green-600" /> Parcours métiers
            </Link>
            <Link href="/blog" className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors" onClick={() => setMenuOpen(false)}>
              <FileText className="w-4 h-4 text-gray-400" /> Blog
            </Link>
            <Link href="/entreprise" className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors" onClick={() => setMenuOpen(false)}>
              <Users className="w-4 h-4 text-gray-400" /> Entreprise
            </Link>
            <Link href="/a-propos" className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors" onClick={() => setMenuOpen(false)}>
              <BookOpen className="w-4 h-4 text-gray-400" /> À propos
            </Link>

            <div className="border-t border-gray-100 pt-3 mt-2 space-y-2">
              {user ? (
                <>
                  <Link href={dashboardLink()}
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl ibig-gradient text-white font-bold" onClick={() => setMenuOpen(false)}>
                    <LayoutDashboard className="w-4 h-4" /> Mon tableau de bord
                  </Link>
                  <button onClick={handleSignOut}
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-red-200 text-red-600 font-semibold">
                    <LogOut className="w-4 h-4" /> Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link href="/connexion"
                    className="block w-full text-center py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors" onClick={() => setMenuOpen(false)}>
                    Connexion
                  </Link>
                  <Link href="/inscription"
                    className="block w-full text-center py-3 px-4 rounded-xl ibig-gradient text-white font-bold shadow-sm" onClick={() => setMenuOpen(false)}>
                    S&apos;inscrire gratuitement
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
