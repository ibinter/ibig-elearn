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

    // Envoyer email bienvenu aux nouveaux utilisateurs (OAuth et email/password)
    if (data?.user) {
      const createdAt = new Date(data.user.created_at).getTime()
      const confirmedAt = data.user.email_confirmed_at ? new Date(data.user.email_confirmed_at).getTime() : 0
      // Nouveau si créé < 30min OU confirmation email dans les 10min (1ère connexion via lien)
      const isNew = Date.now() - createdAt < 30 * 60_000
        || (confirmedAt > 0 && Date.now() - confirmedAt < 10 * 60_000)
      if (isNew) {
        fetch(`${origin}/api/email/bienvenu`, {
          method: 'POST',
          headers: { 'Cookie': cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ') },
        }).catch(() => null)
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
