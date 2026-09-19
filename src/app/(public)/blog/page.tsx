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

export default async function BlogPage() {
  const supabase = await createClient()
  const { data: dbPosts } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_image, category, reading_time_minutes, views_count, published_at, author:profiles(full_name)')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(20)

  // Fallback to static articles if DB is empty
  const useDB = (dbPosts?.length ?? 0) > 0

  if (useDB) {
    const posts = dbPosts as BlogPost[]
    const featured = posts[0]
    const rest = posts.slice(1)

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Blog IBIG E-LEARN</h1>
          <p className="text-gray-500 max-w-xl">Conseils, actualités et ressources pour votre développement professionnel en Afrique.</p>
        </div>

        {/* Article vedette */}
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
