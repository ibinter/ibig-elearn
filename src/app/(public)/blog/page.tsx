import Link from 'next/link'
import { ArrowRight, Clock, Eye } from 'lucide-react'
import { articles } from '@/lib/blog'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — IBIG E-LEARN',
  description: 'Conseils, actualités et ressources pour votre développement professionnel en Afrique francophone.',
  keywords: ['blog formation Afrique', 'conseils carrière Afrique', 'développement professionnel'],
}

type BlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image: string | null
  category: string | null
  reading_time_minutes: number | null
  views_count: number
  published_at: string | null
  author: { full_name: string } | { full_name: string }[] | null
}

const PAGE_SIZE = 9

interface PageProps {
  searchParams: Promise<{ categorie?: string; page?: string }>
}

export default async function BlogPage({ searchParams }: PageProps) {
  const { categorie, page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const supabase = await createClient()

  let query = supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_image, category, reading_time_minutes, views_count, published_at, author:profiles(full_name)', { count: 'exact' })
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  if (categorie) query = query.eq('category', categorie)

  const { data: dbPosts, count: totalCount } = await query
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  // Catégories disponibles
  const { data: categoriesRaw } = await supabase
    .from('blog_posts')
    .select('category')
    .eq('is_published', true)
    .not('category', 'is', null)

  const categories = [...new Set((categoriesRaw ?? []).map(r => r.category).filter(Boolean))] as string[]

  const totalPages = Math.ceil((totalCount ?? 0) / PAGE_SIZE)

  // Fallback to static articles if DB is empty
  const useDB = (dbPosts?.length ?? 0) > 0

  if (useDB) {
    const posts = dbPosts as BlogPost[]
    const featured = page === 1 && !categorie ? posts[0] : null
    const rest = featured ? posts.slice(1) : posts

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Blog IBIG E-LEARN</h1>
          <p className="text-gray-500 max-w-xl">Conseils, actualités et ressources pour votre développement professionnel en Afrique.</p>
        </div>

        {/* Filtres catégories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Link href="/blog"
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!categorie ? 'bg-[#0B3D91] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              Tous
            </Link>
            {categories.map(cat => (
              <Link key={cat} href={`/blog?categorie=${encodeURIComponent(cat)}`}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${categorie === cat ? 'bg-[#0B3D91] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {cat}
              </Link>
            ))}
          </div>
        )}

        {/* Article vedette */}
        {featured && (
          <Link href={`/blog/${featured.slug}`}
            className="block ibig-gradient rounded-3xl p-8 text-white mb-10 relative overflow-hidden hover:opacity-95 transition-opacity group">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3" />
            {featured.cover_image && (
              <div className="absolute inset-0 opacity-20">
                <img src={featured.cover_image} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="relative max-w-2xl">
              <span className="inline-block bg-[#FFA500] text-black text-xs font-bold px-3 py-1 rounded-full mb-4">À la une</span>
              {featured.category && (
                <span className="ml-2 inline-block bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full mb-4">{featured.category}</span>
              )}
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">{featured.title}</h2>
              {featured.excerpt && <p className="text-blue-100 mb-5 leading-relaxed">{featured.excerpt}</p>}
              <div className="flex items-center gap-4 text-blue-200 text-sm">
                {featured.author && <span>par {Array.isArray(featured.author) ? featured.author[0]?.full_name : featured.author.full_name}</span>}
                {featured.published_at && <span>{new Date(featured.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                {featured.reading_time_minutes && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {featured.reading_time_minutes} min</span>}
                {featured.views_count > 0 && <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {featured.views_count.toLocaleString('fr')}</span>}
              </div>
            </div>
          </Link>
        )}

        {/* Grille articles */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
              {post.cover_image ? (
                <div className="aspect-video overflow-hidden bg-gray-100">
                  <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <div className="aspect-video ibig-gradient flex items-center justify-center">
                  <span className="text-white/40 text-4xl">✍️</span>
                </div>
              )}
              <div className="p-5">
                {post.category && (
                  <span className="text-xs text-[#0B3D91] font-semibold bg-blue-50 px-2 py-0.5 rounded-full">{post.category}</span>
                )}
                <h3 className="font-bold text-gray-900 mt-2 mb-2 leading-snug group-hover:text-[#0B3D91] transition-colors line-clamp-2">{post.title}</h3>
                {post.excerpt && <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-3">{post.excerpt}</p>}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{Array.isArray(post.author) ? (post.author[0]?.full_name ?? 'IBIG E-LEARN') : (post.author?.full_name ?? 'IBIG E-LEARN')}</span>
                  <div className="flex items-center gap-2">
                    {post.reading_time_minutes && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.reading_time_minutes} min</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            {page > 1 && (
              <Link href={`/blog?${categorie ? `categorie=${encodeURIComponent(categorie)}&` : ''}page=${page - 1}`}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                ← Précédent
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Link key={p} href={`/blog?${categorie ? `categorie=${encodeURIComponent(categorie)}&` : ''}page=${p}`}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold transition-colors ${p === page ? 'bg-[#0B3D91] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {p}
              </Link>
            ))}
            {page < totalPages && (
              <Link href={`/blog?${categorie ? `categorie=${encodeURIComponent(categorie)}&` : ''}page=${page + 1}`}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Suivant →
              </Link>
            )}
          </div>
        )}
      </div>
    )
  }

  // Static fallback
  const featured = articles[0]
  const rest = articles.slice(1)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Blog IBIG E-LEARN</h1>
        <p className="text-gray-500 max-w-xl">Conseils, actualités et ressources pour votre développement professionnel en Afrique.</p>
      </div>

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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rest.map(article => (
          <Link key={article.slug} href={`/blog/${article.slug}`}
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
            <div className="aspect-video ibig-gradient flex items-center justify-center">
              <span className="text-white/40 text-4xl">✍️</span>
            </div>
            <div className="p-5">
              <span className="text-xs text-[#0B3D91] font-semibold bg-blue-50 px-2 py-0.5 rounded-full">{article.category}</span>
              <h3 className="font-bold text-gray-900 mt-2 mb-2 leading-snug group-hover:text-[#0B3D91] transition-colors line-clamp-2">{article.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-3">{article.excerpt}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{article.author}</span>
                <span>{article.readTime} de lecture</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
