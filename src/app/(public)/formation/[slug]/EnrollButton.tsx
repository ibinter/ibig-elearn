import { ShoppingCart, Play, LogIn } from 'lucide-react'

interface Props {
  courseId: string
  courseSlug: string
  isEnrolled: boolean
  isFree: boolean
  isLoggedIn: boolean
}

export default function EnrollButton({ courseId, courseSlug, isEnrolled, isFree, isLoggedIn }: Props) {
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

  // Toutes les inscriptions passent par le sélecteur de mode
  return (
    <a href={`/choisir-mode/${courseId}`}
      className={`flex items-center justify-center gap-2 w-full font-bold py-4 rounded-xl transition-colors ${
        isFree
          ? 'bg-green-600 hover:bg-green-700 text-white'
          : 'bg-[#FFA500] hover:bg-orange-500 text-black'
      }`}>
      {isFree ? <><Play className="w-5 h-5" /> S&apos;inscrire gratuitement</> : <><ShoppingCart className="w-5 h-5" /> S&apos;inscrire maintenant</>}
    </a>
  )
}
