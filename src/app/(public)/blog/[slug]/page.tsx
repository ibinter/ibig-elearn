import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, Clock, User, Tag } from 'lucide-react'
import { articles } from '@/lib/blog'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = articles.find(a => a.slug === slug)
  if (!article) return { title: 'Article introuvable' }
  return {
    title: `${article.title} — IBIG E-LEARN Blog`,
    description: article.excerpt,
    keywords: article.keywords,
    openGraph: { title: article.title, description: article.excerpt, type: 'article' },
  }
}

export async function generateStaticParams() {
  return articles.map(a => ({ slug: a.slug }))
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const article = articles.find(a => a.slug === slug)
  if (!article) notFound()

  const related = articles.filter(a => a.slug !== slug).slice(0, 3)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0B3D91] mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour au blog
      </Link>

      <article>
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${article.categoryColor}`}>{article.category}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-5">{article.title}</h1>
          <p className="text-lg text-gray-600 mb-6 leading-relaxed">{article.excerpt}</p>
          <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 pb-8 border-b border-gray-200">
            <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {article.author}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {article.readTime}</span>
            <span>{new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </header>

        {/* Content */}
        <div
          className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-a:text-[#0B3D91] prose-a:no-underline hover:prose-a:underline prose-ul:text-gray-700 prose-li:my-1"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Tags */}
        {article.keywords?.length > 0 && (
          <div className="mt-10 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-2 items-center">
              <Tag className="w-4 h-4 text-gray-400" />
              {article.keywords.map(kw => (
                <span key={kw} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{kw}</span>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* CTA */}
      <div className="mt-12 ibig-gradient rounded-3xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-3">Prêt à vous former ?</h2>
        <p className="text-blue-100 mb-6">Découvrez nos formations et développez vos compétences avec les meilleurs experts africains.</p>
        <Link href="/catalogue"
          className="inline-block bg-[#FFA500] text-black font-bold px-8 py-3 rounded-xl hover:bg-yellow-400 transition-colors">
          Voir le catalogue
        </Link>
      </div>

      {/* Articles connexes */}
      {related.length > 0 && (
        <div className="mt-14">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Articles connexes</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {related.map(a => (
              <Link key={a.slug} href={`/blog/${a.slug}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 group">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.categoryColor} mb-3 inline-block`}>{a.category}</span>
                <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-2 group-hover:text-[#0B3D91] transition-colors line-clamp-3">{a.title}</h3>
                <p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {a.readTime}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
