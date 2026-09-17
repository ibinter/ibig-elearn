'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShoppingCart, Play, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  courseId: string
  courseSlug: string
  isEnrolled: boolean
  isFree: boolean
  isLoggedIn: boolean
}

export default function EnrollButton({ courseId, courseSlug, isEnrolled, isFree, isLoggedIn }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  if (isEnrolled) {
    return (
      <a href={`/apprendre/${courseId}/intro`}
        className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl transition-colors">
        <Play className="w-5 h-5" /> Continuer la formation
      </a>
    )
  }

  if (!isLoggedIn) {
    return (
      <a href={`/connexion?redirectTo=/formation/${courseSlug}`}
        className="flex items-center justify-center gap-2 w-full ibig-gradient text-white font-semibold py-4 rounded-xl hover:opacity-90 transition-opacity">
        <LogIn className="w-5 h-5" /> Se connecter pour s&apos;inscrire
      </a>
    )
  }

  const handleFreeEnroll = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/connexion'); return }

    await supabase.from('enrollments').insert({
      user_id: user.id,
      course_id: courseId,
      status: 'active',
      paid_amount: 0,
      paid_currency: 'XOF',
      payment_method: 'free',
    })
    router.push(`/apprendre/${courseId}/intro`)
  }

  if (isFree) {
    return (
      <button onClick={handleFreeEnroll} disabled={loading}
        className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl transition-colors disabled:opacity-60">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
        {loading ? 'Inscription...' : 'S\'inscrire gratuitement'}
      </button>
    )
  }

  return (
    <a href={`/paiement/${courseId}`}
      className="flex items-center justify-center gap-2 w-full bg-[#FFA500] hover:bg-orange-500 text-black font-bold py-4 rounded-xl transition-colors">
      <ShoppingCart className="w-5 h-5" /> S&apos;inscrire maintenant
    </a>
  )
}
