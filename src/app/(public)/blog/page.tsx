import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'

export const metadata = { title: 'Blog — IBIG E-LEARN', description: 'Conseils, actualités et ressources pour votre développement professionnel en Afrique.' }

const articles = [
  {
    id: 1,
    category: 'Conseils carrière',
    title: 'Comment se reconvertir professionnellement en Afrique : le guide complet',
    excerpt: 'La reconversion professionnelle est une démarche de plus en plus courante sur le continent africain. Voici les étapes clés pour réussir votre transition.',
    date: '15 septembre 2026',
    readTime: '8 min',
    color: 'bg-blue-50 text-blue-700',
  },
  {
    id: 2,
    category: 'Numérique',
    title: 'Les 5 compétences numériques indispensables en 2026',
    excerpt: 'La transformation digitale de l\'Afrique crée des opportunités immenses. Découvrez les compétences numériques les plus recherchées par les employeurs.',
    date: '10 septembre 2026',
    readTime: '5 min',
    color: 'bg-purple-50 text-purple-700',
  },
  {
    id: 3,
    category: 'Formation',
    title: 'Apprendre en ligne vs formation présentielle : que choisir ?',
    excerpt: 'Les deux modes ont leurs avantages. Cet article vous aide à choisir le format adapté à votre situation, votre rythme de vie et vos objectifs professionnels.',
    date: '5 septembre 2026',
    readTime: '6 min',
    color: 'bg-green-50 text-green-700',
  },
  {
    id: 4,
    category: 'Entrepreneuriat',
    title: 'Créer son entreprise en Côte d\'Ivoire : les étapes en 2026',
    excerpt: 'De l\'idée à l\'immatriculation, tout ce que vous devez savoir pour lancer votre activité en Côte d\'Ivoire avec les nouvelles réformes administratives.',
    date: '28 août 2026',
    readTime: '10 min',
    color: 'bg-orange-50 text-orange-700',
  },
  {
    id: 5,
    category: 'Immobilier',
    title: 'Le marché immobilier africain : tendances et opportunités 2026',
    excerpt: 'Le secteur immobilier en Afrique subsaharienne connaît une croissance soutenue. Analyse des marchés les plus porteurs et des stratégies d\'investissement.',
    date: '20 août 2026',
    readTime: '7 min',
    color: 'bg-red-50 text-red-700',
  },
  {
    id: 6,
    category: 'Mobile Money',
    title: 'Comment le Mobile Money révolutionne la formation en ligne en Afrique',
    excerpt: 'Grâce au paiement mobile, des millions d\'Africains peuvent désormais accéder à des formations certifiantes sans carte bancaire ni compte bancaire.',
    date: '12 août 2026',
    readTime: '4 min',
    color: 'bg-yellow-50 text-yellow-700',
  },
]

export default function BlogPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Blog IBIG E-LEARN</h1>
        <p className="text-gray-500 max-w-xl">Conseils, actualités et ressources pour votre développement professionnel en Afrique.</p>
      </div>

      {/* Article vedette */}
      <div className="ibig-gradient rounded-3xl p-8 text-white mb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3" />
        <div className="relative max-w-2xl">
          <span className="inline-block bg-[#FFA500] text-black text-xs font-bold px-3 py-1 rounded-full mb-4">À la une</span>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
            L'Afrique francophone et la révolution de l'apprentissage en ligne
          </h2>
          <p className="text-blue-100 mb-5 leading-relaxed">
            Comment la pandémie, la 4G et les solutions de paiement mobile transforment durablement le secteur de la formation professionnelle sur le continent.
          </p>
          <div className="flex items-center gap-4 text-blue-200 text-sm">
            <span>1er septembre 2026</span>
            <span>·</span>
            <span>12 min de lecture</span>
          </div>
        </div>
      </div>

      {/* Grille articles */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map(article => (
          <div key={article.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
            <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-gray-300" />
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${article.color}`}>
                  {article.category}
                </span>
                <span className="text-xs text-gray-400">{article.readTime}</span>
              </div>
              <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 flex-1">{article.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-2">{article.excerpt}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{article.date}</span>
                <button className="flex items-center gap-1 text-xs font-semibold text-[#0B3D91] hover:text-blue-800 transition-colors">
                  Lire <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
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
