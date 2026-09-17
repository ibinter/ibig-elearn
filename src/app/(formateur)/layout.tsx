import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, BookOpen, Users, BarChart2, PlusCircle, LogOut } from 'lucide-react'

const NAV = [
  { href: '/formateur', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/formateur/formations', label: 'Mes formations', icon: BookOpen },
  { href: '/formateur/formations/nouvelle', label: 'Nouvelle formation', icon: PlusCircle },
  { href: '/formateur/apprenants', label: 'Apprenants', icon: Users },
  { href: '/formateur/statistiques', label: 'Statistiques', icon: BarChart2 },
]

export default async function FormateurLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!profile || !['formateur', 'coordinateur', 'admin'].includes(profile.role)) {
    redirect('/tableau-de-bord')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0">
        <div className="p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-black text-blue-700">IBIG</span>
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-semibold">FORMATEUR</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-sm transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-3 px-3">{profile.full_name}</div>
          <form action="/api/auth/signout" method="POST">
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 px-3 py-2 w-full transition-colors">
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
