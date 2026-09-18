import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, LayoutDashboard, Users, BookMarked, CreditCard, Award, Settings, Building2, Tag } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!profile || !['admin', 'coordinateur'].includes(profile.role)) redirect('/tableau-de-bord')

  const navItems = [
    { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/admin/formations', label: 'Formations', icon: BookMarked },
    { href: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
    { href: '/admin/paiements', label: 'Paiements', icon: CreditCard },
    { href: '/admin/certificats', label: 'Certificats', icon: Award },
    { href: '/admin/entreprise', label: 'Entreprise B2B', icon: Building2 },
    { href: '/admin/coupons', label: 'Coupons & Promos', icon: Tag },
    { href: '/admin/parametres', label: 'Paramètres', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden lg:flex w-60 flex-col bg-[#0B3D91] fixed inset-y-0 z-30">
        <div className="p-5 border-b border-blue-800">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">IBIG</span>
              <span className="font-bold text-[#FFA500] text-sm ml-0.5">E-LEARN</span>
            </div>
          </Link>
          <p className="text-blue-300 text-xs mt-1">Administration</p>
        </div>
        <div className="p-3 border-b border-blue-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {profile?.full_name?.charAt(0)}
            </div>
            <div>
              <p className="text-white text-xs font-semibold">{profile?.full_name}</p>
              <p className="text-blue-300 text-xs capitalize">{profile?.role}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-colors">
              <item.icon className="w-4 h-4" /> {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-blue-800">
          <Link href="/tableau-de-bord" className="flex items-center gap-2 text-blue-300 hover:text-white text-xs py-2 px-3">
            ← Espace apprenant
          </Link>
        </div>
      </aside>
      <div className="lg:ml-60 flex-1 flex flex-col">
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
