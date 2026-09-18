import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, LayoutDashboard, GraduationCap, Award, User, LogOut, Share2, BarChart2, MessageCircle, Trophy, Video } from 'lucide-react'
import MobileNav from '@/components/layout/MobileNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const isFormateur = ['formateur', 'admin', 'coordinateur'].includes(profile?.role ?? '')

  const navItems = [
    { href: '/tableau-de-bord', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/mes-formations', label: 'Mes formations', icon: GraduationCap },
    { href: '/mes-certificats', label: 'Mes certificats', icon: Award },
    { href: '/profil', label: 'Mon profil', icon: User },
    { href: `/apprenant/${user.id}`, label: 'Profil public', icon: Share2 },
    { href: '/messages', label: 'Messages', icon: MessageCircle },
    { href: '/fidelite', label: 'Programme fidélité', icon: Trophy },
    { href: '/sessions-live', label: 'Sessions live', icon: Video },
    ...(isFormateur ? [{ href: '/formateur', label: 'Espace Formateur', icon: BarChart2 }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-gray-200 fixed inset-y-0 z-30">
        <div className="p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg ibig-gradient flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-[#0B3D91] text-base">IBIG</span>
              <span className="font-bold text-[#FFA500] text-base ml-0.5">E-LEARN</span>
            </div>
          </Link>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0B3D91] flex items-center justify-center text-white font-bold">
              {profile?.full_name?.charAt(0) ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{profile?.full_name}</p>
              <p className="text-xs text-gray-400 capitalize">{profile?.role}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-[#0B3D91]/5 hover:text-[#0B3D91] transition-colors">
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bannière IBIG PARTNER */}
        <div className="mx-3 mb-3 rounded-xl bg-gradient-to-br from-[#FFA500]/10 to-[#0B3D91]/10 border border-[#FFA500]/20 p-3">
          <p className="text-xs font-bold text-gray-800 mb-0.5">💰 Gagnez des revenus</p>
          <p className="text-xs text-gray-500 mb-2">Promouvez IBIG et touchez des commissions</p>
          <a
            href="https://ibigpartners.com/rejoindre"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-xs font-semibold text-white ibig-gradient rounded-lg py-1.5 hover:opacity-90 transition-opacity"
          >
            Rejoindre IBIG PARTNER →
          </a>
        </div>

        <div className="p-3 border-t border-gray-100">
          <Link href="/catalogue" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors mb-1">
            <BookOpen className="w-5 h-5" /> Découvrir des formations
          </Link>
          <form action="/api/auth/signout" method="post">
            <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full">
              <LogOut className="w-5 h-5" /> Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 px-6 py-4 lg:hidden flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg ibig-gradient flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[#0B3D91]">IBIG <span className="text-[#FFA500]">E-LEARN</span></span>
          </Link>
        </header>
        <main className="flex-1 p-6 pb-20 lg:pb-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  )
}
