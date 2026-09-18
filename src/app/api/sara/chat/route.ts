import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { messages, courseTitle, lessonTitle, lessonContent } = await req.json()

  if (!messages?.length) return NextResponse.json({ error: 'Messages requis' }, { status: 400 })

  const systemPrompt = `Tu es SARA, l'assistante pédagogique IA de la plateforme IBIG E-LEARN — une plateforme panafricaine de formation en ligne.

Ton rôle : aider les apprenants à comprendre les concepts de leur formation, répondre à leurs questions, et les encourager dans leur parcours.

Contexte actuel :
- Formation : ${courseTitle ?? 'Non précisée'}
- Leçon en cours : ${lessonTitle ?? 'Non précisée'}
${lessonContent ? `- Contenu de la leçon :\n${lessonContent.slice(0, 2000)}` : ''}

Directives :
- Réponds toujours en français
- Sois pédagogue, bienveillante et encourageante
- Si une question dépasse le contenu de la leçon, réponds de façon générale mais reste pertinente
- Garde tes réponses concises (max 3-4 paragraphes)
- Utilise des exemples concrets adaptés au contexte africain quand c'est pertinent
- Ne fais jamais les exercices à la place de l'apprenant — guide-le plutôt
- Tu peux utiliser des emojis avec modération pour rendre l'échange plus chaleureux`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  return NextResponse.json({ reply: text })
}
