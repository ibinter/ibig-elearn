export type QuestionType = 'mcq' | 'true_false' | 'multi' | 'short'

export type BankQuestion = {
  id: string; question: string; type: QuestionType; options: string[] | null; position: number; points: number
  correct_option: number | null; correct_options: number[] | null; accepted_answers: string[] | null; explanation: string | null
}

/** Question telle qu'envoyée au navigateur : jamais de bonne réponse. */
export type PublicQuestion = Pick<BankQuestion, 'id' | 'question' | 'type' | 'points'> & { options: string[] }

export type Answer = number | number[] | string | null

export const TRUE_FALSE = ['Vrai', 'Faux']

export const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

export function toPublic(q: BankQuestion): PublicQuestion {
  return { id: q.id, question: q.question, type: q.type, points: q.points ?? 1, options: q.type === 'true_false' ? TRUE_FALSE : (q.options ?? []) }
}

/** Corrige une réponse. Choix multiples : tout ou rien (pas de point pour une réponse partielle). */
export function isCorrect(q: BankQuestion, a: Answer): boolean {
  if (a == null) return false
  switch (q.type) {
    case 'multi': {
      const expected = new Set(q.correct_options ?? [])
      const given = new Set(Array.isArray(a) ? a : [])
      return expected.size > 0 && expected.size === given.size && [...expected].every(x => given.has(x))
    }
    case 'short': {
      if (typeof a !== 'string' || !a.trim()) return false
      const given = normalize(a)
      return (q.accepted_answers ?? []).some(x => normalize(x) === given)
    }
    default:
      return typeof a === 'number' && a === q.correct_option
  }
}

export function grade(questions: BankQuestion[], answers: Record<string, Answer>) {
  let points = 0, max = 0
  const detail = questions.map(q => {
    const pts = q.points ?? 1
    const ok = isCorrect(q, answers[q.id] ?? null)
    max += pts
    if (ok) points += pts
    return { id: q.id, correct: ok }
  })
  return { points, max, score: max ? Math.round((points / max) * 100) : 0, detail }
}

/** Correction à afficher après soumission. */
export function correction(q: BankQuestion) {
  return {
    id: q.id,
    correct_option: q.type === 'mcq' || q.type === 'true_false' ? q.correct_option : null,
    correct_options: q.type === 'multi' ? q.correct_options : null,
    accepted_answers: q.type === 'short' ? q.accepted_answers : null,
    explanation: q.explanation,
  }
}

/** Tirage aléatoire (Fisher-Yates) de n questions dans la banque. */
export function draw<T>(items: T[], n?: number | null) {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return n && n < a.length ? a.slice(0, n) : a
}

export const BANK_COLUMNS = 'id, question, type, options, position, points, correct_option, correct_options, accepted_answers, explanation'
