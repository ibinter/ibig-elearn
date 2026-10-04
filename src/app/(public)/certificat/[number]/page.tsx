import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CertificateView from './CertificateView'

export default async function CertificatePage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params
  const supabase = await createClient()

  const { data: cert } = await supabase
    .from('certificates')
    .select(`
      id, certificate_number, issued_at, expires_at,
      learner_name, course_title, instructor_name,
      final_score, completion_time_h, is_revoked, revoked_at,
      courses:course_id(slug, cover_url)
    `)
    .eq('certificate_number', number.toUpperCase())
    .single()

  if (!cert) notFound()

  return <CertificateView cert={cert as any} />
}
