import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B3D91]/5 via-white to-[#FFA500]/5 flex flex-col">
      <header className="p-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg ibig-gradient flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-[#0B3D91] text-lg">IBIG</span>
          <span className="font-bold text-[#FFA500] text-lg -ml-1">E-LEARN</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
      <footer className="p-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} IBIG SARL · IBIG EDUFORM
      </footer>
    </div>
  )
}
