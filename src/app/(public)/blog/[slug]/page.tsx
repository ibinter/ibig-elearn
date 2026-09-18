import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Calendar, User, BookOpen } from 'lucide-react'
import { getArticleBySlug, articles } from '@/lib/blog'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return articles.map(a => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) return { title: 'Article introuvable' }
  const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ibiglearn.com'
  return {
    title: article.title,
    description: article.excerpt,
    keywords: article.keywords,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.date,
      authors: [article.author],
      siteName: 'IBIG E-LEARN',
    },
    alternates: { canonical: `${BASE}/blog/${slug}` },
  }
}

function renderMarkdown(content: string) {
  return content
    .split('\n')
    .map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-2">{line.slice(4)}</h3>
      if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold text-gray-900 mt-8 mb-3">{line.slice(3)}</h2>
      if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-[#FFA500] pl-4 py-1 my-4 text-gray-600 italic bg-[#FFA500]/5 rounded-r-lg">{line.slice(2)}</blockquote>
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold text-gray-900 mt-3 mb-1">{line.slice(2, -2)}</p>
      if (line.startsWith('- ')) return <li key={i} className="ml-4 text-gray-700 list-disc">{line.slice(2)}</li>
      if (line.trim() === '') return <div key={i} className="h-2" />
      // Inline bold
      const parts = line.split(/\*\*(.+?)\*\*/)
      if (parts.length > 1) {
        return (
          <p key={i} className="text-gray-700 leading-relaxed">
            {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
          </p>
        )
      }
      return <p key={i} className="text-gray-700 leading-relaxed">{line}</p>
    })
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) notFound()

  const related = articles.filter(a => a.slug !== slug && a.category === article.category).slice(0, 2)
  const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ibiglearn.com'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    author: { '@type': 'Organization', name: article.author },
    publisher: { '@type': 'Organization', name: 'IBIG E-LEARN', url: BASE },
    datePublished: article.date,
    keywords: article.keywords.join(', '),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-[#0B3D91]">Accueil</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-[#0B3D91]">Blog</Link>
          <span>/</span>
          <span className="text-gray-900 truncate max-w-[200px]">{article.title}</span>
        </div>

        {/* Header article */}
        <div className="mb-8">
          <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${article.categoryColor}`}>
            {article.category}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-4">{article.title}</h1>
          <p className="text-lg text-gray-600 leading-relaxed mb-5">{article.excerpt}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 border-t border-b border-gray-100 py-3">
            <span className="flex items-center gap-1.5"><User className="w-4 h-4" />{article.author}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{article.date}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{article.readTime} de lecture</span>
          </div>
        </div>

        {/* Contenu */}
        <div className="prose-content space-y-1">
          {renderMarkdown(article.content)}
        </div>

        {/* CTA formation */}
        <div className="mt-10 ibig-gradient rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <BookOpen className="w-8 h-8 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-lg mb-1">Passez à l'action avec IBIG E-LEARN</h3>
              <p className="text-blue-100 text-sm mb-4">Formations certifiantes, paiement Mobile Money, accès depuis votre téléphone.</p>
              <Link
                href="/catalogue"
                className="inline-block bg-[#FFA500] text-black font-bold px-5 py-2 rounded-xl text-sm hover:bg-yellow-400 transition-colors"
              >
                Voir les formations →
              </Link>
            </div>
          </div>
        </div>

        {/* Articles liés */}
        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="font-bold text-gray-900 mb-4">Articles dans la même catégorie</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {related.map(a => (
                <Link key={a.slug} href={`/blog/${a.slug}`} className="border border-gray-200 rounded-xl p-4 hover:border-[#0B3D91]/30 hover:bg-gray-50 transition-all">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.categoryColor}`}>{a.category}</span>
                  <p className="font-semibold text-sm text-gray-900 mt-2 leading-snug">{a.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{a.readTime} · {a.date}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <Link href="/blog" className="flex items-center gap-2 text-[#0B3D91] text-sm font-medium hover:underline">
            <ArrowLeft className="w-4 h-4" /> Retour au blog
          </Link>
        </div>
      </div>
    </>
  )
}
