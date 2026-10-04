import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'coordinateur'].includes(me.role)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { userId, role } = await request.json()
  const VALID_ROLES = ['apprenant', 'formateur', 'coordinateur', 'admin']
  if (!userId || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

  // Empêcher l'auto-modification via API
  if (userId === user.id) {
    return NextResponse.json({ error: 'Impossible de modifier son propre rôle' }, { status: 403 })
  }

  // Charger le rôle actuel de la cible
  const { data: target } = await supabase.from('profiles').select('role').eq('id', userId).single()
  if (!target) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  // Seul un admin peut toucher au rôle d'un admin (promotion ou rétrogradation)
  if ((role === 'admin' || target.role === 'admin') && me.role !== 'admin') {
    return NextResponse.json({ error: 'Seul un admin peut modifier le rôle d\'un admin' }, { status: 403 })
  }

  // Empêcher de rétrograder le dernier admin
  if (target.role === 'admin' && role !== 'admin') {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
    if ((count ?? 0) <= 1) {
      return NextResponse.json({ error: 'Impossible de rétrograder le dernier administrateur' }, { status: 403 })
    }
  }

  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
