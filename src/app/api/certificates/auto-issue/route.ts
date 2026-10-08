import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { issueCertificate } from '@/lib/certificates'

// Appelée par le lecteur quand l'apprenant termine une formation (100 %)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { courseId } = await req.json().catch(() => ({}))
  if (!courseId) return NextResponse.json({ error: 'courseId requis' }, { status: 400 })

  const result = await issueCertificate(createAdminClient(), user.id, String(courseId))
  if (!result.issued && result.reason === 'not_enrolled') return NextResponse.json({ error: 'Inscription introuvable' }, { status: 404 })
  return NextResponse.json(result)
}
