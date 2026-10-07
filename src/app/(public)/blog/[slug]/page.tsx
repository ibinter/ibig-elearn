import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight, Clock, Eye, ListOrdered, ChevronDown, Calendar } from 'lucide-react'
import { localizedArticles } from '@/lib/blog'
import { getLocale } from '@/i18n'
import { createClient } from '@/lib/supabase/server'
import { extractToc, formatArticleDate, isHtml, normalizeMarkdown, readingMinutes, toIsoDate } from '@/lib/blog-format'
import { SITE_URL } from '@/lib/site'
import ArticleBody from '@/components/blog/ArticleBody'
import ReadingProgress from '@/components/blog/ReadingProgress'
import ShareButtons from '@/components/blog/ShareButtons'

interface Props { params: Promise<{ slug: string }> }

type RelatedItem = { slug: string; title: string; category: string | null; minutes: number | null }

type ArticleView = {
  title: string
  excerpt: string | null
  category: string | null
  categoryClass: string
  cover: string | null
  author: string | null
  date: string | null
  isoDate: string | undefined
  minutes: number
  views: number | null
  content: string
  keywords: string[]
  related: RelatedItem[]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const supabase = await createClient()
  const { data: dbPost } = await supabase
    .from('blog_posts')
    .select('title, excerpt, cover_image, published_at')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (dbPost) {
    return {
      title: dbPost.title,
      description: dbPost.excerpt ?? undefined,
      alternates: { canonical: `/blog/${slug}` },
      openGraph: {
        title: dbPost.title,
        description: dbPost.excerpt ?? undefined,
        type: 'article',
        url: `/blog/${slug}`,
        publishedTime: toIsoDate(dbPost.published_at),
        images: dbPost.cover_image ? [dbPost.cover_image] : undefined,
      },
      twitter: { card: 'summary_large_image', title: dbPost.title, description: dbPost.excerpt ?? undefined },
    }
  }

  const articles = localizedArticles(await getLocale())
  const article = articles.find(a => a.slug === slug)
  if (!article) return { title: 'Article introuvable' }
  return {
    title: article.title,
    description: article.excerpt,
    keywords: article.keywords,
    authors: [{ name: article.author }],
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      url: `/blog/${slug}`,
      publishedTime: toIsoDate(article.date),
      authors: [article.author],
      tags: article.keywords,
    },
    twitter: { card: 'summary_large_image', title: article.title, description: article.excerpt },
  }
}

async function loadArticle(slug: string): Promise<ArticleView | null> {
  const supabase = await createClient()

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

    const { data: relatedPosts } = await supabase
      .from('blog_posts')
      .select('id, title, slug, category, reading_time_minutes')
      .eq('is_published', true)
      .eq('category', dbPost.category ?? '')
      .neq('id', dbPost.id)
      .limit(3)

    const raw = dbPost.content ?? ''
    const content = isHtml(raw) ? raw : normalizeMarkdown(raw)

    return {
      title: dbPost.title,
      excerpt: dbPost.excerpt,
      category: dbPost.category,
      categoryClass: 'bg-blue-50 text-[#0B3D91]',
      cover: dbPost.cover_image,
      author: authorName ?? null,
      date: formatArticleDate(dbPost.published_at),
      isoDate: toIsoDate(dbPost.published_at),
      minutes: readingMinutes(raw),
      views: dbPost.views_count ?? 0,
      content,
      keywords: [],
      related: ((relatedPosts ?? []) as any[]).map(a => ({
        slug: a.slug, title: a.title, category: a.category, minutes: a.reading_time_minutes,
      })),
    }
  }

  const articles = localizedArticles(await getLocale())
  const article = articles.find(a => a.slug === slug)
  if (!article) return null

  return {
    title: article.title,
    excerpt: article.excerpt,
    category: article.category,
    categoryClass: article.categoryColor,
    cover: null,
    author: article.author,
    date: formatArticleDate(article.date),
    isoDate: toIsoDate(article.date),
    minutes: readingMinutes(article.content),
    views: null,
    content: normalizeMarkdown(article.content),
    keywords: article.keywords ?? [],
    related: articles
      .filter(a => a.slug !== slug && a.category === article.category)
      .concat(articles.filter(a => a.slug !== slug && a.category !== article.category))
      .slice(0, 3)
      .map(a => ({ slug: a.slug, title: a.title, category: a.category, minutes: readingMinutes(a.content) })),
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const a = await loadArticle(slug)
  if (!a) notFound()

  const toc = isHtml(a.content) ? [] : extractToc(a.content)
  const url = `${SITE_URL}/blog/${slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${url}#article`,
        mainEntityOfPage: url,
        headline: a.title,
        description: a.excerpt ?? undefined,
        image: a.cover ?? `${SITE_URL}/logo-full.webp`,
        datePublished: a.isoDate,
        dateModified: a.isoDate,
        inLanguage: 'fr',
        keywords: a.keywords.join(', ') || undefined,
        articleSection: a.category ?? undefined,
        author: { '@type': 'Organization', name: a.author ?? 'IBIG E-LEARNING', url: SITE_URL },
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: a.title, item: url },
        ],
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ReadingProgress />

      <article className="bg-white">
        {/* ── En-tête ── */}
        <header className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 sm:pt-10">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#0B3D91] transition-colors -ml-1 px-1 py-1">
            <ArrowLeft className="w-4 h-4" /> Blog
          </Link>

          {a.category && (
            <div className="mt-5"><span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${a.categoryClass}`}>{a.category}</span></div>
          )}

          <h1 className="mt-3 text-[28px] leading-[1.18] sm:text-[40px] sm:leading-[1.12] font-extrabold tracking-tight text-[#0B1E4B] break-words">
            {a.title}
          </h1>

          {a.excerpt && (
            <p className="mt-4 text-[17px] sm:text-xl leading-relaxed text-gray-600">{a.excerpt}</p>
          )}

          <div className="mt-6 flex items-center gap-3 pb-6 border-b border-gray-100">
            <div className="w-10 h-10 rounded-full ibig-gradient flex items-center justify-center text-white font-bold flex-shrink-0">
              {(a.author ?? 'I').charAt(0)}
            </div>
            <div className="min-w-0 text-sm leading-tight">
              <p className="font-semibold text-gray-900 truncate">{a.author ?? 'IBIG E-LEARNING'}</p>
              <p className="mt-1 text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                {a.date && <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{a.date}</span>}
                <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{a.minutes} min de lecture</span>
                {a.views !== null && <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{a.views} vues</span>}
              </p>
            </div>
          </div>
        </header>

        {a.cover && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6">
            <img src={a.cover} alt="" className="w-full aspect-[16/9] object-cover rounded-2xl" />
          </div>
        )}

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          {/* ── Sommaire ── */}
          {toc.length >= 3 && (
            <details className="group mb-8 rounded-2xl border border-gray-100 bg-gray-50/70">
              <summary className="flex items-center gap-2 px-4 py-3.5 cursor-pointer list-none select-none font-semibold text-gray-900 text-[15px]">
                <ListOrdered className="w-4 h-4 text-[#0B3D91]" />
                Sommaire
                <span className="text-gray-400 font-normal text-sm">· {toc.length} parties</span>
                <ChevronDown className="w-4 h-4 text-gray-400 ml-auto transition-transform group-open:rotate-180" />
              </summary>
              <ol className="px-4 pb-4 space-y-1">
                {toc.map((t, i) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} className="flex gap-3 py-1.5 text-[15px] text-gray-700 hover:text-[#0B3D91]">
                      <span className="text-[#FFA500] font-bold tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                      <span className="leading-snug">{t.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </details>
          )}

          {/* ── Corps ── */}
          <div id="article-content">
            <ArticleBody content={a.content} />
          </div>

          {/* ── Mots-clés & partage ── */}
          <div className="mt-10 pt-6 border-t border-gray-100 space-y-5">
            {a.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {a.keywords.map(kw => (
                  <span key={kw} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">#{kw}</span>
                ))}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-3">Cet article vous a été utile ? Partagez-le</p>
              <ShareButtons title={a.title} />
            </div>
          </div>

          {/* ── CTA ── */}
          <div className="mt-10 ibig-gradient rounded-2xl p-6 sm:p-8 text-white">
            <h2 className="text-xl sm:text-2xl font-bold leading-snug">Passez de la lecture à l&apos;action</h2>
            <p className="mt-2 text-blue-100 text-[15px] leading-relaxed">
              Des formations certifiantes, conçues pour l&apos;Afrique francophone, payables en Mobile Money.
            </p>
            <Link href="/catalogue" className="mt-5 inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-[#FFA500] text-black font-bold px-6 py-3 rounded-xl hover:bg-yellow-400 transition-colors">
              Voir les formations <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </article>

      {/* ── À lire aussi ── */}
      {a.related.length > 0 && (
        <section className="bg-gray-50 border-t border-gray-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
            <h2 className="text-lg font-bold text-gray-900 mb-4">À lire aussi</h2>
            <div className="space-y-3">
              {a.related.map(r => (
                <Link key={r.slug} href={`/blog/${r.slug}`}
                  className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 hover:border-[#0B3D91]/30 hover:shadow-sm transition-all group">
                  <div className="min-w-0 flex-1">
                    {r.category && <p className="text-[11px] font-bold uppercase tracking-wide text-[#FFA500] mb-1">{r.category}</p>}
                    <h3 className="font-semibold text-gray-900 text-[15px] leading-snug line-clamp-2 group-hover:text-[#0B3D91] transition-colors">{r.title}</h3>
                    {r.minutes && <p className="mt-1 text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {r.minutes} min</p>}
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#0B3D91] flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
