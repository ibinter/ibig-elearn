import { createAdminClient } from '@/lib/supabase/admin'

type Notice = { title: string; body: string; link?: string }

/**
 * Notification interne (cloche du tableau de bord), insérée avec la clé service
 * pour pouvoir notifier d'autres utilisateurs. Compatible avec les deux variantes
 * de la table (colonne `body` ou `message`) ; n'interrompt jamais l'appelant.
 */
export async function notifyUsers(userIds: string[], n: Notice) {
  const ids = [...new Set(userIds.filter(Boolean))]
  if (!ids.length) return
  try {
    const admin = createAdminClient()
    const base = ids.map(user_id => ({ user_id, type: 'system', title: n.title, link: n.link ?? null }))
    const { error } = await admin.from('notifications').insert(base.map(r => ({ ...r, body: n.body })))
    if (error) await admin.from('notifications').insert(base.map(r => ({ ...r, message: n.body })))
  } catch {
    /* les notifications ne doivent jamais bloquer le parcours */
  }
}

export async function notifyStaff(n: Notice) {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('profiles').select('id').in('role', ['admin', 'coordinateur'])
    await notifyUsers((data ?? []).map(p => p.id as string), n)
  } catch { /* ignoré */ }
}
