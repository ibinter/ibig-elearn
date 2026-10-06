import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 300 // 5 minutes (Vercel Pro / hobby max)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const BATCH_SIZE = 10 // leçons par appel (paramètre ?limit= pour traiter par vague)

async function generateLessonContent(
  lessonTitle: string,
  lessonType: string,
  moduleTitle: string,
  courseTitle: string
): Promise<string> {
  const prompt = `Tu es un expert formateur africain. Génère un contenu de leçon TRÈS RICHE et PROFESSIONNEL en Markdown pour :

**Cours :** ${courseTitle}
**Module :** ${moduleTitle}
**Leçon :** ${lessonTitle}
**Type :** ${lessonType}

Le contenu doit :
- Être entre 600 et 1200 mots
- Utiliser des titres H2 et H3
- Inclure des exemples concrets (contexte africain/PME quand pertinent)
- Inclure des blocs de code ou formules si applicable
- Inclure des listes à puces pour les points clés
- Inclure au moins une blockquote (conseil pro)
- Se terminer par un résumé "Ce qu'il faut retenir" et un "Exercice pratique"
- Être directement utile et actionnable
- Écrire uniquement le contenu Markdown, sans intro ni meta-commentaire

Écris un contenu de haute qualité qui donne envie de s'inscrire à la formation.`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  return (message.content[0] as any).text ?? ''
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Vérifier que l'utilisateur est admin (via client cookie)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  // Client service-role pour bypasser RLS sur les données
  const db = createAdminClient()

  const body = await req.json().catch(() => ({}))
  const courseId: string | null = body.courseId ?? null
  const forceAll: boolean = body.forceAll ?? false
  const limit: number = body.limit ?? 20 // max leçons à traiter par appel

  // Récupérer les cours concernés via service-role (bypass RLS)
  let coursesQuery = db.from('courses').select('id, title').eq('is_published', true)
  if (courseId) coursesQuery = coursesQuery.eq('id', courseId)
  const { data: courses } = await coursesQuery

  const results: { lesson: string; status: string }[] = []
  let updated = 0
  let skipped = 0

  for (const course of courses ?? []) {
    const { data: modules } = await db
      .from('modules')
      .select('id, title')
      .eq('course_id', course.id)
      .order('position')

    for (const module of modules ?? []) {
      const { data: lessons } = await db
        .from('lessons')
        .select('id, title, type, content')
        .eq('module_id', module.id)
        .order('position')

      for (const lesson of lessons ?? []) {
        // Toujours sauter les types purement média (pas de texte à générer)
        if (['video', 'audio', 'code'].includes(lesson.type)) {
          skipped++
          continue
        }

        // Sauter les leçons déjà riches sauf si forceAll
        if (!forceAll && lesson.content && lesson.content.length >= 400) {
          skipped++
          continue
        }

        if (updated >= limit) {
          // On a atteint la limite pour cet appel — stopper et signaler qu'il reste du travail
          break
        }

        try {
          const content = await generateLessonContent(
            lesson.title,
            lesson.type,
            module.title,
            course.title
          )

          await db
            .from('lessons')
            .update({ content })
            .eq('id', lesson.id)

          results.push({ lesson: lesson.title, status: 'enrichi' })
          updated++
        } catch (err: any) {
          results.push({ lesson: lesson.title, status: `erreur: ${err.message}` })
        }
      }
      if (updated >= limit) break
    }
    if (updated >= limit) break
  }

  return NextResponse.json({
    success: true,
    updated,
    skipped,
    total: updated + skipped,
    results,
  })
}
