import Link from 'next/link'
import { Lock, Star, CheckCircle, Zap, Users, Award } from 'lucide-react'

interface Props {
  courseSlug: string
  courseTitle: string
  lessonTitle: string
  coursePrice?: number
  modulesCount?: number
  lessonsCount?: number
}

export default function LessonPaywall({
  courseSlug,
  courseTitle,
  lessonTitle,
  coursePrice,
  modulesCount,
  lessonsCount,
}: Props) {
  const formattedPrice = coursePrice
    ? new Intl.NumberFormat('fr-FR').format(coursePrice) + ' FCFA'
    : null

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-16 bg-white">
      <div className="max-w-lg w-full text-center">

        {/* Icône cadenas */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#0B3D91] to-[#1a56cc] flex items-center justify-center shadow-xl shadow-[#0B3D91]/25">
          <Lock className="w-9 h-9 text-white" />
        </div>

        {/* Message principal */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Contenu réservé aux inscrits
        </h2>
        <p className="text-gray-500 mb-2 text-[15px]">
          La leçon <span className="font-semibold text-gray-700">"{lessonTitle}"</span> fait partie de la formation complète.
        </p>
        <p className="text-gray-500 text-[15px] mb-8">
          Inscrivez-vous pour accéder à l'intégralité du contenu et progresser à votre rythme.
        </p>

        {/* Avantages */}
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 mb-8 text-left space-y-3">
          {[
            { icon: CheckCircle, text: 'Accès illimité à toutes les leçons', color: 'text-emerald-500' },
            { icon: Zap, text: 'Contenu pratique avec exemples africains', color: 'text-[#FFA500]' },
            { icon: Users, text: 'Forum et Q&A avec d\'autres apprenants', color: 'text-[#0B3D91]' },
            { icon: Award, text: 'Certificat de completion reconnu', color: 'text-purple-500' },
            ...(lessonsCount ? [{ icon: Star, text: `${lessonsCount} leçons${modulesCount ? ` en ${modulesCount} modules` : ''}`, color: 'text-pink-500' }] : []),
          ].map(({ icon: Icon, text, color }, i) => (
            <div key={i} className="flex items-center gap-3">
              <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
              <span className="text-gray-700 text-[14px]">{text}</span>
            </div>
          ))}
        </div>

        {/* Prix + CTA */}
        {formattedPrice && (
          <p className="text-sm text-gray-400 mb-3">
            Formation complète à partir de{' '}
            <span className="text-2xl font-bold text-gray-900">{formattedPrice}</span>
          </p>
        )}

        <Link
          href={`/formation/${courseSlug}#inscription`}
          className="inline-flex items-center justify-center gap-2 w-full py-4 px-8 bg-gradient-to-r from-[#0B3D91] to-[#1a56cc] text-white font-bold text-base rounded-xl shadow-lg shadow-[#0B3D91]/30 hover:shadow-[#0B3D91]/50 hover:scale-[1.02] transition-all"
        >
          <Zap className="w-5 h-5" />
          S'inscrire à la formation
        </Link>

        <Link
          href={`/formation/${courseSlug}`}
          className="inline-flex items-center justify-center mt-3 text-sm text-gray-500 hover:text-[#0B3D91] transition-colors"
        >
          Voir le programme complet →
        </Link>
      </div>
    </div>
  )
}
