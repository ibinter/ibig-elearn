'use client'

import Link from 'next/link'
import { Star, Users, BookOpen } from 'lucide-react'
import PriceDisplay from './PriceDisplay'
import WishlistButton from './WishlistButton'
import type { Course } from '@/types'

const levelLabel: Record<string, string> = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' }
const levelColor: Record<string, string> = {
  debutant: 'bg-green-100 text-green-700',
  intermediaire: 'bg-yellow-100 text-yellow-700',
  avance: 'bg-red-100 text-red-700',
}

export default function CourseCard({ course }: { course: Course }) {
  return (
    <Link href={`/formation/${course.slug}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col">
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full ibig-gradient flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-white/50" />
          </div>
        )}
        {course.is_featured && (
          <span className="absolute top-3 left-3 bg-[#FFA500] text-black text-xs font-bold px-2 py-1 rounded-full">⭐ Vedette</span>
        )}
        <span className={`absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded-full ${levelColor[course.level]}`}>
          {levelLabel[course.level]}
        </span>
        <WishlistButton courseId={course.id} className="absolute bottom-3 right-3" />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs font-medium text-[#0B3D91] mb-1">{(course.category as any)?.name}</p>
        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-[#0B3D91] transition-colors">{course.title}</h3>
        <p className="text-gray-500 text-xs mb-3 line-clamp-2 flex-1">{course.short_description}</p>
        <div className="flex items-center gap-1 mb-3">
          <Star className="w-4 h-4 text-[#FFA500] fill-[#FFA500]" />
          <span className="text-sm font-semibold text-gray-900">{course.rating_average.toFixed(1)}</span>
          <span className="text-xs text-gray-400">({course.rating_count})</span>
          <span className="text-gray-300 mx-1">·</span>
          <Users className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500">{course.enrollment_count.toLocaleString('fr-FR')}</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <PriceDisplay
            price_xof={course.price_xof}
            price_eur={course.price_eur}
            price_usd={course.price_usd}
            className="text-lg font-bold text-[#0B3D91]"
          />
          <span className="text-xs text-gray-500">{course.duration_hours}h</span>
        </div>
      </div>
    </Link>
  )
}
