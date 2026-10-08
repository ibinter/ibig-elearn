'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { Menu, X, PlusCircle, Search, Globe, BookOpen, ChevronDown, User, LogOut, LayoutDashboard, BookMarked, Users, BarChart2, Trophy, Heart, FileText, Star, Layers, TrendingUp, HeartHandshake } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import type { Profile } from '@/types'
import CurrencySelector from '@/components/ui/CurrencySelector'
import GlobalSearch from '@/components/search/GlobalSearch'
import NotificationBell from '@/components/ui/NotificationBell'
import DarkModeToggle from '@/components/ui/DarkModeToggle'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'
import { useLocale } from '@/i18n/client'

interface NavbarProps {
  user?: Profile | null
}

function CatalogueDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { t } = useLocale()

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const items = [
    { href: '/catalogue', icon: Layers, label: t.nav.catalog, desc: t.nav.catalogDesc, color: 'text-[#0B3D91]' },
    { href: '/catalogue?featured=true', icon: Star, label: t.nav.featured, desc: t.nav.featuredDesc, color: 'text-[#FFA500]' },
    { href: '/parcours', icon: TrendingUp, label: t.nav.paths, desc: t.nav.pathsDesc, color: 'text-green-600' },
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


function PreferencesMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { t } = useLocale()

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label="Préférences" title="Langue, devise et affichage"
        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-sm font-semibold transition-colors ${open ? 'bg-gray-100 text-[#0B3D91]' : 'text-gray-600 hover:bg-gray-100'}`}>
        <Globe className="w-5 h-5" />
        <span className="uppercase">{t.locale}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 space-y-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Langue</p>
            <LanguageSwitcher />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Devise</p>
            <CurrencySelector />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Affichage</p>
            <DarkModeToggle />
          </div>
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
  const { t } = useLocale()
  const pathname = usePathname()

  useEffect(() => { setMenuOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm safe-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 md:gap-6 h-14 md:h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image src="/logo-icon.webp" alt="IBIG E-LEARNING" width={40} height={40} className="block sm:hidden rounded-xl" priority />
            <Image src="/logo-full.webp" alt="IBIG E-LEARNING" width={200} height={56} className="hidden sm:block h-14 w-auto" priority />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6 flex-1 min-w-0">
            <CatalogueDropdown />
            <Link href="/coaching" className="text-gray-600 hover:text-[#0B3D91] font-medium text-sm transition-colors whitespace-nowrap">
              Coaching
            </Link>
            <Link href="/blog" className="hidden xl:inline text-gray-600 hover:text-[#0B3D91] font-medium text-sm transition-colors whitespace-nowrap">
              {t.nav.blog}
            </Link>
            <Link href="/entreprise" className="text-gray-600 hover:text-[#0B3D91] font-medium text-sm transition-colors whitespace-nowrap">
              {t.nav.enterprise}
            </Link>
            <Link href="/a-propos" className="hidden xl:inline text-gray-600 hover:text-[#0B3D91] font-medium text-sm transition-colors whitespace-nowrap">
              {t.locale === 'en' ? 'About' : 'À propos'}
            </Link>


          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <Link href="/devenir-partenaire"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B3D91] border border-[#0B3D91]/25 hover:bg-[#0B3D91]/5 px-3 py-2 rounded-xl transition-colors whitespace-nowrap"
              title="Formateurs partenaires IBIG EDUFORM : publiez vos formations">
              <PlusCircle className="w-4 h-4" />
              <span className="hidden xl:inline">Ajouter une formation</span>
              <span className="xl:hidden">Publier</span>
            </Link>
            <Link href="/recherche" aria-label="Rechercher" title="Rechercher"
              className="p-2.5 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-[#0B3D91] transition-colors">
              <Search className="w-5 h-5" />
            </Link>
            <PreferencesMenu />
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
                  {t.nav.login}
                </Link>
                <Link href="/inscription"
                  className="text-sm font-bold text-white ibig-gradient px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap">
                  <span className="hidden 2xl:inline">{t.locale === 'en' ? 'Sign up free' : "S'inscrire gratuitement"}</span>
                  <span className="2xl:hidden">{t.locale === 'en' ? 'Sign up' : "S'inscrire"}</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <span className="sm:hidden -ml-1 font-bold text-[15px] tracking-tight"><span className="text-[#0B3D91]">IBIG</span> <span className="text-[#FFA500]">E-LEARNING</span></span>
          <div className="md:hidden ml-auto flex items-center gap-1">
            {user && <NotificationBell />}
          <button className="p-2.5 rounded-xl text-gray-700 active:bg-gray-100 transition-colors" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[70] bg-white flex flex-col animate-page-in" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="flex items-center gap-3 px-4 h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] border-b border-gray-100 flex-shrink-0">
            <Image src="/logo-icon.webp" alt="" width={36} height={36} className="rounded-xl" />
            <span className="font-bold text-[15px] tracking-tight"><span className="text-[#0B3D91]">IBIG</span> <span className="text-[#FFA500]">E-LEARNING</span></span>
            <button className="ml-auto p-2.5 rounded-xl text-gray-700 active:bg-gray-100" aria-label="Fermer le menu" onClick={() => setMenuOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-1 bottom-nav-offset">
            <div className="mb-3">
              <GlobalSearch className="w-full" />
            </div>
            <div className="flex flex-wrap items-center gap-2 pb-3 mb-1 border-b border-gray-100">
              <LanguageSwitcher />
              <CurrencySelector />
              <div className="ml-auto"><DarkModeToggle /></div>
            </div>
            <Link href="/devenir-partenaire" className="flex items-center gap-3 py-3.5 px-3 rounded-xl bg-[#0B3D91]/5 border border-[#0B3D91]/15 text-[15px] text-[#0B3D91] font-semibold mb-2" onClick={() => setMenuOpen(false)}>
              <PlusCircle className="w-5 h-5" />
              <span className="flex-1">Ajouter une formation<span className="block text-xs font-normal text-gray-500">Formateurs partenaires IBIG EDUFORM</span></span>
            </Link>
            <Link href="/catalogue" className="flex items-center gap-2 py-3.5 px-3 rounded-xl text-[15px] text-gray-800 hover:bg-gray-50 active:bg-gray-100 font-medium transition-colors" onClick={() => setMenuOpen(false)}>
              <Layers className="w-4 h-4 text-[#0B3D91]" /> Catalogue
            </Link>
            <Link href="/catalogue?featured=true" className="flex items-center gap-2 py-3.5 px-3 rounded-xl text-[15px] text-gray-800 hover:bg-gray-50 active:bg-gray-100 font-medium transition-colors" onClick={() => setMenuOpen(false)}>
              <Star className="w-4 h-4 text-[#FFA500]" /> Formations vedettes
            </Link>
            <Link href="/parcours" className="flex items-center gap-2 py-3.5 px-3 rounded-xl text-[15px] text-gray-800 hover:bg-gray-50 active:bg-gray-100 font-medium transition-colors" onClick={() => setMenuOpen(false)}>
              <TrendingUp className="w-4 h-4 text-green-600" /> Parcours métiers
            </Link>
            <Link href="/coaching" className="flex items-center gap-2 py-3.5 px-3 rounded-xl text-[15px] text-gray-800 hover:bg-gray-50 active:bg-gray-100 font-medium transition-colors" onClick={() => setMenuOpen(false)}>
              <HeartHandshake className="w-4 h-4 text-rose-500" /> Coaching individuel
            </Link>
            <Link href="/blog" className="flex items-center gap-2 py-3.5 px-3 rounded-xl text-[15px] text-gray-800 hover:bg-gray-50 active:bg-gray-100 font-medium transition-colors" onClick={() => setMenuOpen(false)}>
              <FileText className="w-4 h-4 text-gray-400" /> Blog
            </Link>
            <Link href="/entreprise" className="flex items-center gap-2 py-3.5 px-3 rounded-xl text-[15px] text-gray-800 hover:bg-gray-50 active:bg-gray-100 font-medium transition-colors" onClick={() => setMenuOpen(false)}>
              <Users className="w-4 h-4 text-gray-400" /> Entreprise
            </Link>
            <Link href="/a-propos" className="flex items-center gap-2 py-3.5 px-3 rounded-xl text-[15px] text-gray-800 hover:bg-gray-50 active:bg-gray-100 font-medium transition-colors" onClick={() => setMenuOpen(false)}>
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
