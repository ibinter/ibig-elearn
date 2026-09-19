import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, Clock, User, Tag, Eye } from 'lucide-react'
import { articles } from '@/lib/blog'
import { createClient } from '@/lib/supabase/server'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  // DB first
  const supabase = await createClient()
  const { data: dbPost } = await supabase
    .from('blog_posts')
    .select('title, excerpt, cover_image')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (dbPost) {
    return {
      title: `${dbPost.title} — IBIG E-LEARN Blog`,
      description: dbPost.excerpt ?? undefined,
      openGraph: { title: dbPost.title, description: dbPost.excerpt ?? undefined, type: 'article', images: dbPost.cover_image ? [dbPost.cover_image] : [] },
    }
  }

  const article = articles.find(a => a.slug === slug)
  if (!article) return { title: 'Article introuvable' }
  return {
    title: `${article.title} — IBIG E-LEARN Blog`,
    description: article.excerpt,
    keywords: article.keywords,
    openGraph: { title: article.title, description: article.excerpt, type: 'article' },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  // Essayer DB en premier
  const { data: dbPost } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, content, category, cover_image, reading_time_minutes, views_count, published_at, author:profiles(full_name)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (dbPost) {
    // Incrémenter les vues (fire-and-forget)
    supabase.from('blog_posts').update({ views_count: (dbPost.views_count ?? 0) + 1 }).eq('id', dbPost.id).then(() => {})

    const authorName = Array.isArray(dbPost.author)
      ? (dbPost.author[0] as any)?.full_name
      : (dbPost.author as any)?.full_name

    // Articles connexes (même catégorie, depuis DB)
    const { data: relatedPosts } = await supabase
      .from('blog_posts')
      .select('id, title, slug, category, reading_time_minutes')
      .eq('is_published', true)
      .eq('category', dbPost.category ?? '')
      .neq('id', dbPost.id)
      .limit(3)

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0B3D91] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour au blog
        </Link>

        {dbPost.cover_image && (
          <img src={dbPost.cover_image} alt={dbPost.title} className="w-full h-64 sm:h-96 object-cover rounded-2xl mb-8" />
        )}

        <article>
          <header className="mb-10">
            {dbPost.category && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700 mb-4 inline-block">{dbPost.category}</span>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-5">{dbPost.title}</h1>
            {dbPost.excerpt && <p className="text-lg text-gray-600 mb-6 leading-relaxed">{dbPost.excerpt}</p>}
            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 pb-8 border-b border-gray-200">
              {authorName && <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {authorName}</span>}
              {dbPost.reading_time_minutes && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {dbPost.reading_time_minutes} min de lecture</span>}
              {dbPost.published_at && <span>{new Date(dbPost.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
              <span className="flex items-center gap-1.5 ml-auto"><Eye className="w-4 h-4" /> {dbPost.views_count ?? 0} vues</span>
            </div>
          </header>

          <div
            className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-a:text-[#0B3D91] prose-a:no-underline hover:prose-a:underline prose-ul:text-gray-700 prose-li:my-1"
            dangerouslySetInnerHTML={{ __html: dbPost.content ?? '' }}
          />
        </article>

        {/* CTA */}
        <div className="mt-12 ibig-gradient rounded-3xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">Prêt à vous former ?</h2>
          <p className="text-blue-100 mb-6">Découvrez nos formations et développez vos compétences avec les meilleurs experts africains.</p>
          <Link href="/catalogue" className="inline-block bg-[#FFA500] text-black font-bold px-8 py-3 rounded-xl hover:bg-yellow-400 transition-colors">
            Voir le catalogue
          </Link>
        </div>

        {/* Articles connexes */}
        {(relatedPosts ?? []).length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Articles connexes</h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {(relatedPosts as any[]).map(a => (
                <Link key={a.slug} href={`/blog/${a.slug}`}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 group">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 mb-3 inline-block">{a.category}</span>
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-2 group-hover:text-[#0B3D91] transition-colors line-clamp-3">{a.title}</h3>
                  {a.reading_time_minutes && <p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {a.reading_time_minutes} min</p>}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Fallback aux articles statiques
  const article = articles.find(a => a.slug === slug)
  if (!article) notFound()

  const related = articles.filter(a => a.slug !== slug && a.category === article.category).slice(0, 3)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0B3D91] mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour au blog
      </Link>

      <article>
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

        <div
          className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-a:text-[#0B3D91] prose-a:no-underline hover:prose-a:underline prose-ul:text-gray-700 prose-li:my-1"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

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

      <div className="mt-12 ibig-gradient rounded-3xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-3">Prêt à vous former ?</h2>
        <p className="text-blue-100 mb-6">Découvrez nos formations et développez vos compétences avec les meilleurs experts africains.</p>
        <Link href="/catalogue" className="inline-block bg-[#FFA500] text-black font-bold px-8 py-3 rounded-xl hover:bg-yellow-400 transition-colors">
          Voir le catalogue
        </Link>
      </div>

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
