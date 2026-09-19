import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Bell, BookOpen, Award, MessageCircle, Video, Star, Megaphone } from 'lucide-react'
import NotificationsClient from './NotificationsClient'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: notifs } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  return <NotificationsClient initialNotifs={notifs ?? []} />
}
