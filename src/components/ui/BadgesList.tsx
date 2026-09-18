'use client'

interface Badge {
  id: string
  emoji: string
  label: string
  description: string
  earned: boolean
}

interface Props {
  points: number
  streakDays: number
  completedLessons: number
  completedCourses: number
  certificatesCount: number
  referralsCount?: number
}

export default function BadgesList({
  points, streakDays, completedLessons, completedCourses, certificatesCount, referralsCount = 0
}: Props) {
  const badges: Badge[] = [
    { id: 'first_lesson', emoji: '🎓', label: 'Première leçon', description: 'Terminez votre première leçon', earned: completedLessons >= 1 },
    { id: 'first_course', emoji: '🏅', label: 'Premier diplômé', description: 'Terminez votre première formation', earned: completedCourses >= 1 },
    { id: 'streak_3', emoji: '🔥', label: 'Sur la lancée', description: '3 jours de suite', earned: streakDays >= 3 },
    { id: 'streak_7', emoji: '⚡', label: 'Une semaine', description: '7 jours de suite', earned: streakDays >= 7 },
    { id: 'streak_30', emoji: '💎', label: 'Un mois', description: '30 jours de suite', earned: streakDays >= 30 },
    { id: 'lessons_10', emoji: '📚', label: 'Bibliothèque', description: '10 leçons terminées', earned: completedLessons >= 10 },
    { id: 'lessons_50', emoji: '🦉', label: 'Savant', description: '50 leçons terminées', earned: completedLessons >= 50 },
    { id: 'courses_3', emoji: '🌟', label: 'Multi-diplômé', description: '3 formations terminées', earned: completedCourses >= 3 },
    { id: 'points_500', emoji: '🎯', label: '500 points', description: 'Accumulez 500 points', earned: points >= 500 },
    { id: 'points_2000', emoji: '🚀', label: '2000 points', description: 'Accumulez 2000 points', earned: points >= 2000 },
    { id: 'cert_1', emoji: '📜', label: 'Certifié', description: 'Obtenez votre premier certificat', earned: certificatesCount >= 1 },
    { id: 'cert_3', emoji: '🏆', label: 'Expert certifié', description: '3 certificats obtenus', earned: certificatesCount >= 3 },
    { id: 'referral_1', emoji: '🤝', label: 'Ambassadeur', description: 'Parrainez un ami', earned: referralsCount >= 1 },
    { id: 'referral_5', emoji: '👑', label: 'Super parrain', description: 'Parrainez 5 amis', earned: referralsCount >= 5 },
  ]

  const earned = badges.filter(b => b.earned)
  const locked = badges.filter(b => !b.earned)

  return (
    <div className="space-y-6">
      {earned.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Badges obtenus <span className="text-[#0B3D91] ml-1">({earned.length})</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {earned.map(b => (
              <div key={b.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
                <span className="text-3xl mb-2">{b.emoji}</span>
                <p className="font-semibold text-gray-900 text-sm">{b.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">
            À débloquer ({locked.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {locked.map(b => (
              <div key={b.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center text-center opacity-50">
                <span className="text-3xl mb-2 grayscale">{b.emoji}</span>
                <p className="font-semibold text-gray-500 text-sm">{b.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
