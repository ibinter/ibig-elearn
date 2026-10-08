'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen, Menu, X, ChevronLeft, ChevronRight,
  LayoutDashboard, Users, BookMarked, CreditCard, Award, Settings,
  Building2, Tag, Target, Bell, FileText, Mail, Star, BarChart3,
  Download, Zap, Video, Palette, Shield, HelpCircle, AlertTriangle, Handshake, HeartHandshake , Briefcase } from 'lucide-react'

type Props = {
  userName: string
  userInitial: string
  userRole: string
  collapsed?: boolean
  onCollapse?: (v: boolean) => void
}

const NAV = [
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/admin/formations', label: 'Formations', icon: BookMarked },
  { href: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
  { href: '/admin/paiements', label: 'Paiements', icon: CreditCard },
  { href: '/admin/certificats', label: 'Certificats', icon: Award },
  { href: '/admin/entreprise', label: 'Entreprise B2B', icon: Building2 },
  { href: '/admin/organisations', label: 'Espaces entreprise', icon: Briefcase },
  { href: '/admin/competences', label: 'Compétences', icon: Target },
  { href: '/admin/lti', label: 'Intégration LTI', icon: Zap },
  { href: '/admin/parcours', label: 'Parcours', icon: Target },
  { href: '/admin/coupons', label: 'Coupons & Promos', icon: Tag },
  { href: '/admin/partenaires', label: 'Formateurs partenaires', icon: Handshake },
  { href: '/admin/coaching', label: 'Coaching', icon: HeartHandshake },
  { href: '/admin/approbations', label: 'Approbations', icon: BookOpen },
  { href: '/admin/virements', label: 'Virements', icon: CreditCard },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
  { href: '/admin/newsletter', label: 'Newsletter', icon: Mail },
  { href: '/admin/temoignages', label: 'Témoignages', icon: Star },
  { href: '/admin/rapports', label: 'Rapports avancés', icon: BarChart3 },
  { href: '/admin/exports', label: 'Exports comptables', icon: Download },
  { href: '/admin/relances', label: 'Relances inactivité', icon: Zap },
  { href: '/admin/badges', label: 'Badges', icon: Award },
  { href: '/admin/sessions-live', label: 'Classes virtuelles', icon: Video },
  { href: '/admin/marque-blanche', label: 'Marque blanche', icon: Palette },
  { href: '/admin/sso', label: 'SSO Entreprise', icon: Shield },
  { href: '/admin/antitricherie', label: 'Anti-triche', icon: AlertTriangle },
  { href: '/admin/superadmin', label: 'Accès admin', icon: Shield },
  { href: '/admin/parametres', label: 'Paramètres', icon: Settings },
  { href: '/admin/guide', label: 'Guide admin', icon: HelpCircle },
]

const COLLAPSED_W = 'w-[68px]'
const EXPANDED_W = 'w-60'

export default function AdminSidebar({ userName, userInitial, userRole, collapsed = false, onCollapse }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const desktopNavRef = useRef<HTMLElement>(null)
  const mobileNavRef = useRef<HTMLElement>(null)
  const desktopScrollRef = useRef(0)
  const mobileScrollRef = useRef(0)

  const setCollapsed = (v: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof v === 'function' ? v(collapsed) : v
    onCollapse?.(next)
  }

  // Sauvegarde le scroll avant le changement de route
  useEffect(() => {
    const desktopNav = desktopNavRef.current
    const mobileNav = mobileNavRef.current
    const saveDesktop = () => { desktopScrollRef.current = desktopNav?.scrollTop ?? 0 }
    const saveMobile = () => { mobileScrollRef.current = mobileNav?.scrollTop ?? 0 }
    desktopNav?.addEventListener('scroll', saveDesktop, { passive: true })
    mobileNav?.addEventListener('scroll', saveMobile, { passive: true })
    return () => {
      desktopNav?.removeEventListener('scroll', saveDesktop)
      mobileNav?.removeEventListener('scroll', saveMobile)
    }
  }, [])

  // Restaure le scroll après le changement de route (sans fermer le mobile)
  useEffect(() => {
    if (desktopNavRef.current) desktopNavRef.current.scrollTop = desktopScrollRef.current
    if (mobileNavRef.current) mobileNavRef.current.scrollTop = mobileScrollRef.current
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  /* ── Sidebar desktop ── */
  const DesktopSidebar = () => (
    <aside
      className={`hidden lg:flex flex-col bg-[#0B3D91] fixed inset-y-0 z-30 transition-all duration-300 ease-in-out ${collapsed ? COLLAPSED_W : EXPANDED_W}`}
    >
      {/* Header */}
      <div className={`border-b border-blue-800 flex items-center h-14 flex-shrink-0 ${collapsed ? 'justify-center px-0' : 'px-4 justify-between'}`}>
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm whitespace-nowrap">
              IBIG <span className="text-[#FFA500]">E-LEARNING</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={`p-1.5 rounded-lg text-blue-300 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0 ${collapsed ? 'absolute -right-3 top-4 bg-[#0B3D91] border border-blue-700 shadow-md rounded-full' : ''}`}
          aria-label={collapsed ? 'Développer' : 'Réduire'}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* User */}
      <div className={`border-b border-blue-800 flex-shrink-0 ${collapsed ? 'py-3 flex justify-center' : 'p-3'}`}>
        {collapsed ? (
          <div title={userName} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
            {userInitial}
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Nav */}
      <nav ref={desktopNavRef} className={`flex-1 overflow-y-auto overflow-x-hidden py-2 ${collapsed ? 'px-2 space-y-1' : 'px-2 space-y-0.5'}`}>
        {NAV.map(item => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`relative flex items-center rounded-xl text-sm font-medium transition-all duration-150
                ${collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}
                ${active ? 'bg-white/15 text-white' : 'text-blue-200 hover:bg-white/10 hover:text-white'}`}
            >
              {active && !collapsed && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#FFA500] rounded-r-full" />
              )}
              <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#FFA500]' : 'text-blue-300'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t border-blue-800 flex-shrink-0 ${collapsed ? 'py-3 flex justify-center' : 'p-3'}`}>
        {collapsed ? (
          <Link href="/tableau-de-bord" title="Espace apprenant"
            className="p-2 rounded-xl text-blue-300 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center">
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <Link href="/tableau-de-bord"
            className="flex items-center gap-2 text-blue-300 hover:text-white text-xs py-2 px-3 rounded-xl hover:bg-white/10 transition-all duration-150">
            ← Espace apprenant
          </Link>
        )}
      </div>
    </aside>
  )

  /* ── Header mobile ── */
  const MobileHeader = () => (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[#0B3D91] px-4 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] flex items-center justify-between h-[calc(3.5rem+env(safe-area-inset-top))]">
      <button
        onClick={() => setMobileOpen(true)}
        className="p-2 rounded-xl text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
        aria-label="Menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      <Link href="/" className="flex items-center gap-2">
        <span className="font-bold text-white text-sm">IBIG <span className="text-[#FFA500]">E-LEARNING</span></span>
      </Link>
      <div className="w-9" />
    </header>
  )

  /* ── Drawer mobile ── */
  const MobileDrawer = () => (
    <>
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className={`lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-[#0B3D91] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header drawer */}
        <div className="border-b border-blue-800 flex items-center justify-between px-4 h-14 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm">IBIG <span className="text-[#FFA500]">E-LEARNING</span></span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-blue-300 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User */}
        <div className="p-3 border-b border-blue-800 flex-shrink-0">
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

        {/* Nav — statique au clic (pas de fermeture auto) */}
        <nav ref={mobileNavRef} className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
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

        <div className="p-3 border-t border-blue-800 flex-shrink-0">
          <Link href="/tableau-de-bord" className="flex items-center gap-2 text-blue-300 hover:text-white text-xs py-2 px-3 rounded-xl hover:bg-white/10 transition-all duration-150">
            ← Espace apprenant
          </Link>
        </div>
      </aside>
    </>
  )

  return (
    <>
      <DesktopSidebar />
      <MobileHeader />
      <MobileDrawer />
    </>
  )
}
