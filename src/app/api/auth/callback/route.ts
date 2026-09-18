import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/tableau-de-bord'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    // Envoyer email bienvenu aux nouveaux utilisateurs Google OAuth
    if (data?.user) {
      const createdAt = new Date(data.user.created_at).getTime()
      const isNew = Date.now() - createdAt < 60_000 // créé il y a moins d'1 min
      if (isNew) {
        // Fire-and-forget — non bloquant
        const baseUrl = origin
        fetch(`${baseUrl}/api/email/bienvenu`, {
          method: 'POST',
          headers: {
            'Cookie': cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; '),
          },
        }).catch(() => null)
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
