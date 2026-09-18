import { createClient } from '@/lib/supabase/server'
import StarRating from './StarRating'
import { formatDate } from '@/lib/utils'

interface Props {
  courseId: string
  ratingAvg: number
  reviewCount: number
}

export default async function ReviewsList({ courseId, ratingAvg, reviewCount }: Props) {
  const supabase = await createClient()
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, user:profiles(full_name, country)')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
    .limit(20)

  // Distribution des notes
  const dist = [5, 4, 3, 2, 1].map(n => ({
    star: n,
    count: reviews?.filter(r => r.rating === n).length ?? 0,
  }))

  if (!reviews?.length) return (
    <div className="text-center py-8 text-gray-400">
      <p className="text-sm">Aucun avis pour l&apos;instant. Soyez le premier à noter !</p>
    </div>
  )

  return (
    <div>
      {/* Résumé global */}
      <div className="flex items-start gap-8 mb-8 p-6 bg-gray-50 rounded-2xl">
        <div className="text-center flex-shrink-0">
          <div className="text-5xl font-black text-gray-900">{Number(ratingAvg).toFixed(1)}</div>
          <StarRating value={Math.round(ratingAvg)} readonly size="sm" />
          <p className="text-xs text-gray-400 mt-1">{reviewCount} avis</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {dist.map(d => (
            <div key={d.star} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-4 text-right">{d.star}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-[#FFA500] transition-all"
                  style={{ width: reviewCount > 0 ? `${(d.count / reviewCount) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-xs text-gray-400 w-4">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Liste des avis */}
      <div className="space-y-4">
        {(reviews as any[]).map(r => (
          <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0B3D91] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {r.user?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{r.user?.full_name}</span>
                  {r.user?.country && <span className="text-xs text-gray-400">{r.user.country}</span>}
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
                </div>
                <StarRating value={r.rating} readonly size="sm" />
                {r.comment && <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{r.comment}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
