import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Heart, BookOpen, Star } from 'lucide-react'
import PriceDisplay from '@/components/ui/PriceDisplay'
import WishlistButton from '@/components/ui/WishlistButton'

export default async function MesFavorisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: wishlist } = await supabase
    .from('wishlists')
    .select('course_id, course:courses(id, title, slug, short_description, thumbnail_url, price_xof, level, rating_avg, review_count, instructor:profiles(full_name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const courses = (wishlist ?? []).map((w: any) => w.course).filter(Boolean)

  const levelLabel: Record<string, string> = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
          <Heart className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes favoris</h1>
          <p className="text-sm text-gray-500">{courses.length} formation{courses.length !== 1 ? 's' : ''} sauvegardée{courses.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500">Aucune formation sauvegardée pour l&apos;instant.</p>
          <Link href="/catalogue" className="inline-flex items-center gap-2 ibig-gradient text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90">
            <BookOpen className="w-4 h-4" /> Parcourir le catalogue
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course: any) => (
            <div key={course.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
              <div className="relative aspect-video overflow-hidden bg-gray-100">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full ibig-gradient flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-white/60" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <WishlistButton courseId={course.id} />
                </div>
              </div>
              <div className="p-4 space-y-2">
                <Link href={`/formation/${course.slug}`}>
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 hover:text-[#0B3D91] transition-colors">{course.title}</h3>
                </Link>
                <p className="text-xs text-gray-500">{(course.instructor as any)?.full_name}</p>
                {course.rating_avg > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold text-gray-700">{Number(course.rating_avg).toFixed(1)}</span>
                    <span className="text-gray-400">({course.review_count})</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{levelLabel[course.level] ?? course.level}</span>
                  <PriceDisplay price_xof={course.price_xof} className="text-sm font-bold text-[#0B3D91]" />
                </div>
                <Link href={`/formation/${course.slug}`}
                  className="block w-full text-center ibig-gradient text-white text-xs font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity mt-2">
                  Voir la formation
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
