import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { lessonId, count = 5 } = await req.json()
  if (!lessonId) return NextResponse.json({ error: 'lessonId requis' }, { status: 400 })

  // Récupérer la leçon
  const { data: lesson } = await supabase
    .from('lessons')
    .select('title, description, content, type')
    .eq('id', lessonId)
    .single()

  if (!lesson) return NextResponse.json({ error: 'Leçon introuvable' }, { status: 404 })

  const content = [lesson.title, lesson.description, lesson.content]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 4000)

  const prompt = `Tu es un expert pédagogique. À partir du contenu de leçon ci-dessous, génère exactement ${count} questions de quiz variées (mix QCM et vrai/faux).

CONTENU DE LA LEÇON :
${content}

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après, avec ce format exact :
[
  {
    "question": "Texte de la question ?",
    "type": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_option": 0,
    "explanation": "Explication courte de la bonne réponse"
  },
  {
    "question": "Affirmation vraie ou fausse ?",
    "type": "true_false",
    "options": ["Vrai", "Faux"],
    "correct_option": 0,
    "explanation": "Explication courte"
  }
]

Règles :
- Pour "mcq" : 4 options, correct_option est l'index (0-3) de la bonne réponse
- Pour "true_false" : 2 options ["Vrai","Faux"], correct_option est 0 ou 1
- Questions claires, précises, pertinentes par rapport au contenu
- Explications concises (1-2 phrases max)
- Mélange de difficultés (facile, moyen, difficile)`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    // Extraire le JSON (peut être entouré de backticks)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON found')
    const questions = JSON.parse(jsonMatch[0])
    return NextResponse.json({ questions })
  } catch {
    return NextResponse.json({ error: 'Erreur de parsing', raw: text }, { status: 500 })
  }
}
