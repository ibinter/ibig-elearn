import type { SupabaseClient } from '@supabase/supabase-js'
import { sendEmail, certificatEmail } from '@/lib/email'
import { notifyUsers } from '@/lib/notify'
import { SITE_URL } from '@/lib/site'
import { emitOrgEvent } from '@/lib/integrations'

/**
 * Délivre le certificat d'une formation terminée (idempotent).
 * Appelée directement par le serveur (client administrateur) : aucune dépendance à la session du navigateur.
 */
export async function issueCertificate(admin: SupabaseClient, userId: string, courseId: string) {
  const [{ data: enrollment }, { count: total }, { count: done }] = await Promise.all([
    admin.from('enrollments').select('id, sponsor_org_id').eq('user_id', userId).eq('course_id', courseId).maybeSingle(),
    admin.from('lessons').select('id', { count: 'exact', head: true }).eq('course_id', courseId),
    admin.from('lesson_progress').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('course_id', courseId).eq('is_completed', true),
  ])
  if (!enrollment) return { issued: false as const, reason: 'not_enrolled' }
  const progress = total ? Math.min(100, Math.round(((done ?? 0) / total) * 100)) : 0
  if (progress < 100) return { issued: false as const, reason: 'incomplete', progress }

  // Certificat « courant » : on le renvoie s'il est encore valide ; expiré, il passe dans l'historique (recertification)
  const { data: existing } = await admin.from('certificates').select('id, certificate_number, expires_at')
    .eq('user_id', userId).eq('course_id', courseId).is('superseded_at', null).maybeSingle()
  if (existing && (!existing.expires_at || new Date(existing.expires_at) > new Date())) {
    return { issued: true as const, certificateId: existing.id, certNumber: existing.certificate_number, alreadyExisted: true }
  }
  if (existing) await admin.from('certificates').update({ superseded_at: new Date().toISOString() }).eq('id', existing.id)

  const [{ data: course }, { data: profile }] = await Promise.all([
    admin.from('courses').select('title, duration_hours, certificate_validity_months, instructor:profiles!courses_instructor_id_fkey(full_name)').eq('id', courseId).single(),
    admin.from('profiles').select('full_name, email').eq('id', userId).single(),
  ])
  const instructor = (course?.instructor as unknown as { full_name: string | null } | null)?.full_name ?? null
  const now = new Date()
  await admin.from('enrollments').update({ progress_percent: 100, status: 'completed', completed_at: now.toISOString() }).eq('id', enrollment.id)

  // Numéro unique (nouvel essai en cas de collision improbable)
  let certificate: { id: string } | null = null
  let certNumber = ''
  for (let i = 0; i < 3 && !certificate; i++) {
    certNumber = `IBIG-${now.getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const { data } = await admin.from('certificates').insert({
      user_id: userId, course_id: courseId, enrollment_id: enrollment.id, certificate_number: certNumber,
      issued_at: now.toISOString(), learner_name: profile?.full_name ?? null, course_title: course?.title ?? null,
      instructor_name: instructor, completion_time_h: course?.duration_hours ?? null,
      expires_at: course?.certificate_validity_months
        ? new Date(new Date(now).setMonth(now.getMonth() + course.certificate_validity_months)).toISOString()
        : null,
    }).select('id').single()
    certificate = data
  }
  if (!certificate) return { issued: false as const, reason: 'insert_failed' }

  // Intégrations SIRH : formation terminée + certificat délivré (formations financées par une organisation)
  if (enrollment.sponsor_org_id) {
    const base = { user_id: userId, email: profile?.email ?? null, name: profile?.full_name ?? null, course_id: courseId, course_title: course?.title ?? null }
    await emitOrgEvent(enrollment.sponsor_org_id, 'course.completed', { ...base, completed_at: now.toISOString() })
    await emitOrgEvent(enrollment.sponsor_org_id, 'certificate.issued', {
      ...base, certificate_number: certNumber, issued_at: now.toISOString(),
      verify_url: `${SITE_URL}/certificat/${certNumber}`,
      expires_at: course?.certificate_validity_months ? new Date(new Date(now).setMonth(now.getMonth() + course.certificate_validity_months)).toISOString() : null,
    })
  }

  await notifyUsers([userId], {
    title: '🎓 Certificat obtenu !',
    body: `Félicitations ! Vous avez terminé « ${course?.title ?? 'votre formation'} » et reçu votre certificat.`,
    link: `/mes-certificats/${certificate.id}/imprimer`,
  })
  try {
    if (profile?.email) {
      const tpl = certificatEmail({ name: profile.full_name ?? 'Apprenant', courseTitle: course?.title ?? '', certNumber, certUrl: `${SITE_URL}/certificat/${certNumber}` })
      await sendEmail({ to: profile.email, ...tpl })
    }
  } catch { /* non bloquant */ }
  try {
    await admin.rpc('add_loyalty_points', { p_user_id: userId, p_points: 100, p_reason: `Cours terminé : ${course?.title ?? ''}`, p_reference_id: courseId })
  } catch { /* non bloquant */ }

  return { issued: true as const, certificateId: certificate.id, certNumber, progress: 100 }
}
