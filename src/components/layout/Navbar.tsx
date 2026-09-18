'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, BookOpen, ChevronDown, User, LogOut, LayoutDashboard, BookMarked, Users, BarChart2, Trophy, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'
import CurrencySelector from '@/components/ui/CurrencySelector'
import GlobalSearch from '@/components/search/GlobalSearch'
import NotificationBell from '@/components/ui/NotificationBell'

interface NavbarProps {
  user?: Profile | null
}

export default function Navbar({ user }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 rounded-lg ibig-gradient flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-[#0B3D91] text-lg leading-none">IBIG</span>
              <span className="font-bold text-[#FFA500] text-lg leading-none ml-1">E-LEARN</span>
            </div>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/catalogue" className="text-gray-600 hover:text-[#0B3D91] font-medium text-sm transition-colors">
              Catalogue
            </Link>
            <Link href="/catalogue?featured=true" className="text-gray-600 hover:text-[#0B3D91] font-medium text-sm transition-colors">
              Formations vedettes
            </Link>
            <Link href="/blog" className="text-gray-600 hover:text-[#0B3D91] font-medium text-sm transition-colors">
              Blog
            </Link>
            <Link href="/entreprise" className="text-gray-600 hover:text-[#0B3D91] font-medium text-sm transition-colors">
              Entreprise
            </Link>
            <Link href="/a-propos" className="text-gray-600 hover:text-[#0B3D91] font-medium text-sm transition-colors">
              À propos
            </Link>
          </div>

          {/* Search */}
          <div className="hidden lg:block flex-1 max-w-xs mx-6">
            <GlobalSearch />
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <CurrencySelector />
            {user && <NotificationBell />}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0B3D91] flex items-center justify-center text-white text-sm font-semibold">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">{user.full_name}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <Link href={dashboardLink()} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>
                      <LayoutDashboard className="w-4 h-4" /> Tableau de bord
                    </Link>
                    {(user.role === 'formateur' || user.role === 'admin' || user.role === 'coordinateur') && (
                      <Link href="/formateur" className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#0B3D91] font-semibold hover:bg-blue-50" onClick={() => setProfileOpen(false)}>
                        <BookOpen className="w-4 h-4" /> Espace formateur
                      </Link>
                    )}
                    {(user.role === 'admin' || user.role === 'coordinateur') && (
                      <Link href="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 font-semibold hover:bg-red-50" onClick={() => setProfileOpen(false)}>
                        <LayoutDashboard className="w-4 h-4" /> Administration
                      </Link>
                    )}
                    <Link href="/mes-formations" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>
                      <BookMarked className="w-4 h-4" /> Mes formations
                    </Link>
                    <Link href="/classement" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>
                      <span className="text-base">🏆</span> Classement
                    </Link>
                    <Link href="/mes-favoris" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>
                      <Heart className="w-4 h-4" /> Mes favoris
                    </Link>
                    <Link href="/mes-stats" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>
                      <BarChart2 className="w-4 h-4" /> Mes statistiques
                    </Link>
                    <Link href="/mes-badges" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>
                      <Trophy className="w-4 h-4" /> Mes badges
                    </Link>
                    <Link href="/parrainage" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>
                      <Users className="w-4 h-4" /> Parrainage
                    </Link>
                    <Link href="/profil" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>
                      <User className="w-4 h-4" /> Mon profil
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    <button onClick={handleSignOut} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                      <LogOut className="w-4 h-4" /> Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/connexion" className="text-sm font-medium text-gray-700 hover:text-[#0B3D91] px-3 py-2 transition-colors">
                  Connexion
                </Link>
                <Link href="/inscription" className="text-sm font-semibold text-white ibig-gradient px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
                  S&apos;inscrire gratuitement
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            <GlobalSearch className="mb-3" />
            <Link href="/catalogue" className="block py-2.5 px-3 rounded-lg text-gray-700 hover:bg-gray-50 font-medium" onClick={() => setMenuOpen(false)}>Catalogue</Link>
            <Link href="/a-propos" className="block py-2.5 px-3 rounded-lg text-gray-700 hover:bg-gray-50 font-medium" onClick={() => setMenuOpen(false)}>À propos</Link>
            <Link href="/contact" className="block py-2.5 px-3 rounded-lg text-gray-700 hover:bg-gray-50 font-medium" onClick={() => setMenuOpen(false)}>Contact</Link>
            <div className="border-t border-gray-200 pt-3 mt-2 space-y-2">
              {user ? (
                <>
                  <Link href={dashboardLink()} className="block w-full text-center py-2.5 px-4 rounded-lg bg-[#0B3D91] text-white font-semibold" onClick={() => setMenuOpen(false)}>Tableau de bord</Link>
                  <button onClick={handleSignOut} className="block w-full text-center py-2.5 px-4 rounded-lg border border-red-200 text-red-600 font-medium">Déconnexion</button>
                </>
              ) : (
                <>
                  <Link href="/connexion" className="block w-full text-center py-2.5 px-4 rounded-lg border border-gray-200 text-gray-700 font-medium" onClick={() => setMenuOpen(false)}>Connexion</Link>
                  <Link href="/inscription" className="block w-full text-center py-2.5 px-4 rounded-lg bg-[#0B3D91] text-white font-semibold" onClick={() => setMenuOpen(false)}>S&apos;inscrire</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
