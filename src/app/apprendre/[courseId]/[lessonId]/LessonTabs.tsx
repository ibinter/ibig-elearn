'use client'

import { useState } from 'react'
import { FileText, MessageSquare, BookOpen } from 'lucide-react'
import LessonNotes from '@/components/apprendre/LessonNotes'
import LessonQA from '@/components/apprendre/LessonQA'
import DiscussionPanel from '@/components/forum/DiscussionPanel'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface Props {
  lessonId: string
  courseId: string
  userId: string
}

const TABS = [
  { id: 'notes', label: 'Mes notes', icon: FileText },
  { id: 'qa', label: 'Questions & Réponses', icon: MessageSquare },
  { id: 'discussion', label: 'Discussion', icon: BookOpen },
]

export default function LessonTabs({ lessonId, courseId, userId }: Props) {
  const [active, setActive] = useState('notes')

  return (
    <div className="mt-10 border border-gray-100 rounded-2xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-100 bg-gray-50/50">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              active === tab.id
                ? 'border-[#0B3D91] text-[#0B3D91] bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/60'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white p-6">
        {active === 'notes' && (
          <div>
            <LessonNotes lessonId={lessonId} courseId={courseId} />
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link
                href={`/apprendre/${courseId}/notes`}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs text-[#0B3D91] hover:text-[#FFA500] transition-colors font-medium"
              >
                Exporter toutes mes notes en PDF
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
        {active === 'qa' && (
          <LessonQA lessonId={lessonId} courseId={courseId} userId={userId} />
        )}
        {active === 'discussion' && (
          <DiscussionPanel lessonId={lessonId} courseId={courseId} currentUserId={userId} />
        )}
      </div>
    </div>
  )
}
