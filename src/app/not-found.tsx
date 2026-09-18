import Link from 'next/link'
import { BookOpen, Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Illustration */}
        <div className="mb-8">
          <div className="w-24 h-24 rounded-3xl ibig-gradient flex items-center justify-center mx-auto mb-4 shadow-lg">
            <BookOpen className="w-12 h-12 text-white" />
          </div>
          <div className="text-8xl font-extrabold text-gray-100 select-none leading-none mb-2">404</div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">Page introuvable</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.<br />
          Revenez à l&apos;accueil pour continuer votre apprentissage.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/accueil"
            className="flex items-center justify-center gap-2 ibig-gradient text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
            <Home className="w-4 h-4" /> Accueil
          </Link>
          <Link href="/catalogue"
            className="flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors">
            <Search className="w-4 h-4" /> Voir les formations
          </Link>
        </div>

        <Link href="javascript:history.back()"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mt-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour à la page précédente
        </Link>
      </div>
    </div>
  )
}
