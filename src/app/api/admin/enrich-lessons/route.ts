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
  const prompt = `Tu es un expert formateur de renommée mondiale, spécialiste du contexte africain (Afrique de l'Ouest, zone UEMOA/CEDEAO). Génère un contenu de leçon PREMIUM, COMPLET et ACCROCHEUR en Markdown pour :

**Cours :** ${courseTitle}
**Module :** ${moduleTitle}
**Leçon :** ${lessonTitle}
**Type :** ${lessonType}

RÈGLES ABSOLUES :
- Entre 900 et 1500 mots de contenu dense et actionnable
- NE PAS répéter le titre de la leçon en H1 (il est déjà affiché)
- Commencer directement par un H2 accrocheur ou une accroche forte
- Minimum 3 sections H2, chacune avec sous-sections H3
- Exemples CONCRETS avec noms africains, villes (Abidjan, Dakar, Lagos, Lomé...), montants en FCFA/XOF
- Au moins UN bloc de code, tableau ou formule mathématique si pertinent
- Au moins DEUX blockquotes (conseils pro, citations d'experts, points critiques)
- Listes à puces structurées avec explication de chaque point
- Une section "⚡ Points clés à retenir" avec 4-6 bullets synthétiques
- Une section "🎯 Exercice pratique" avec des actions concrètes et mesurables
- Contenu qui donne l'impression d'avoir un vrai formateur expert en face de soi
- Vocabulaire professionnel mais accessible, ton engageant et motivant
- Écrire UNIQUEMENT le contenu Markdown, sans commentaire ni méta-instruction

Ce contenu sera vu par des visiteurs non-inscrits : il doit leur donner ENVIE d'acheter la formation en démontrant la qualité et la valeur exceptionnelle du programme.`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2500,
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
  const excludeIds: string[] = body.excludeIds ?? [] // IDs déjà traités dans cette session

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

        // Sauter les leçons déjà traitées dans cette session (pagination)
        if (excludeIds.includes(lesson.id)) {
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

          const { error: updateErr } = await db
            .from('lessons')
            .update({ content })
            .eq('id', lesson.id)

          if (updateErr) throw new Error(`DB update failed: ${updateErr.message}`)

          results.push({ lesson: lesson.title, status: 'enrichi', id: lesson.id })
          updated++
          console.log(`[enrich] ✓ "${lesson.title}" (${updated}/${limit})`)
        } catch (err: any) {
          skipped++ // compter les erreurs comme traitées pour ne pas bloquer la boucle
          console.error(`[enrich] ✗ "${lesson.title}": ${err.message}`)
          results.push({ lesson: lesson.title, status: `erreur: ${err.message}`, id: lesson.id })
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
