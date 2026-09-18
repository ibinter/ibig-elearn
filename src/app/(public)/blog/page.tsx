import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { articles } from '@/lib/blog'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — IBIG E-LEARN',
  description: 'Conseils, actualités et ressources pour votre développement professionnel en Afrique francophone.',
  keywords: ['blog formation Afrique', 'conseils carrière Afrique', 'développement professionnel'],
}

const featured = articles[0]
const rest = articles.slice(1)

export default function BlogPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Blog IBIG E-LEARN</h1>
        <p className="text-gray-500 max-w-xl">Conseils, actualités et ressources pour votre développement professionnel en Afrique.</p>
      </div>

      {/* Article vedette */}
      <Link href={`/blog/${featured.slug}`} className="block ibig-gradient rounded-3xl p-8 text-white mb-10 relative overflow-hidden hover:opacity-95 transition-opacity">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3" />
        <div className="relative max-w-2xl">
          <span className="inline-block bg-[#FFA500] text-black text-xs font-bold px-3 py-1 rounded-full mb-4">À la une</span>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">{featured.title}</h2>
          <p className="text-blue-100 mb-5 leading-relaxed">{featured.excerpt}</p>
          <div className="flex items-center gap-4 text-blue-200 text-sm">
            <span>{featured.date}</span>
            <span>·</span>
            <span>{featured.readTime} de lecture</span>
          </div>
        </div>
      </Link>

      {/* Grille articles */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rest.map(article => (
          <Link key={article.slug} href={`/blog/${article.slug}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#0B3D91]/20 transition-all overflow-hidden flex flex-col group">
            <div className="h-40 ibig-gradient/10 bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl ibig-gradient flex items-center justify-center">
                <span className="text-2xl">
                  {article.category === 'Numérique' ? '💻' :
                   article.category === 'Formation' ? '📚' :
                   article.category === 'Entrepreneuriat' ? '🚀' :
                   article.category === 'Immobilier' ? '🏠' :
                   article.category === 'Mobile Money' ? '📱' : '💼'}
                </span>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${article.categoryColor}`}>
                  {article.category}
                </span>
                <span className="text-xs text-gray-400">{article.readTime}</span>
              </div>
              <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 flex-1 group-hover:text-[#0B3D91] transition-colors">{article.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-2">{article.excerpt}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{article.date}</span>
                <span className="flex items-center gap-1 text-xs font-semibold text-[#0B3D91] group-hover:gap-2 transition-all">
                  Lire <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Newsletter */}
      <div className="mt-12 bg-gray-50 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Restez informé</h2>
        <p className="text-gray-500 text-sm mb-5 max-w-md mx-auto">Recevez chaque semaine nos meilleurs articles et conseils pour votre carrière en Afrique.</p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="votre@email.com"
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm"
          />
          <button className="ibig-gradient text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm whitespace-nowrap">
            S'abonner
          </button>
        </div>
      </div>
    </div>
  )
}
