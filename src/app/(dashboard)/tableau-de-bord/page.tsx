import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen, Award, TrendingUp, ArrowRight, Play, Flame, Zap, Target, ChevronRight,
  CalendarClock, Video, HeartHandshake, Compass, GraduationCap, CheckCircle2, Building2,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { getT } from '@/i18n'
import { createAdminClient } from '@/lib/supabase/admin'
import { getManagedOrgs } from '@/lib/org'

// Niveaux IBIG (calculés à partir des XP)
const LEVELS = [
  { name: 'Explorateur', min: 0, emoji: '🌱' },
  { name: 'Apprenti', min: 500, emoji: '📚' },
  { name: 'Pratiquant', min: 1500, emoji: '⚡' },
  { name: 'Expert', min: 4000, emoji: '🏆' },
  { name: 'Maître IBIG', min: 10000, emoji: '👑' },
]
const LEVEL_LABEL: Record<string, string> = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' }

type CourseLite = { id: string; title: string; slug: string; thumbnail_url: string | null; duration_hours: number | null }
type Enrollment = { id: string; course_id: string; progress_percent: number | null; enrolled_at: string; status: string; due_date: string | null; course: CourseLite | null }
type AgendaItem = { id: string; kind: 'coaching' | 'live'; title: string; startsAt: string; href: string; with?: string | null }

export default async function TableauDeBordPage() {
  const t = await getT()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, xp_points, streak_days, onboarding_completed')
    .eq('id', user.id)
    .single()
  if (profile && profile.onboarding_completed === false) redirect('/onboarding')

  const managedOrgs = await getManagedOrgs(createAdminClient(), user.id)
  const nowIso = new Date().toISOString()
  const [{ data: enrollmentsRaw }, { data: certificates, count: certCount }, { data: activity }, { data: coaching }, { data: recommended }] = await Promise.all([
    supabase.from('enrollments')
      .select('id, course_id, progress_percent, enrolled_at, status, due_date, course:courses(id, title, slug, thumbnail_url, duration_hours)')
      .eq('user_id', user.id)
      .order('enrolled_at', { ascending: false }),
    supabase.from('certificates')
      .select('id, issued_at, course:courses(title)', { count: 'exact' })
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false })
      .limit(3),
    supabase.from('lesson_progress')
      .select('course_id, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(200),
    supabase.from('coaching_bookings')
      .select('id, starts_at, offer:coaching_offers(title), coach:profiles!coaching_bookings_coach_id_fkey(full_name)')
      .eq('learner_id', user.id)
      .eq('status', 'confirmed')
      .gt('starts_at', nowIso)
      .order('starts_at')
      .limit(3),
    supabase.rpc('get_recommended_courses', { p_user_id: user.id, p_limit: 6 }),
  ])

  const enrollments = (enrollmentsRaw ?? []) as unknown as Enrollment[]

  // Dernière activité par formation → tri « reprendre là où j'en étais »
  const lastActivity = new Map<string, string>()
  for (const a of activity ?? []) if (!lastActivity.has(a.course_id)) lastActivity.set(a.course_id, a.updated_at)
  const byRecent = [...enrollments].sort((a, b) =>
    (lastActivity.get(b.course_id) ?? b.enrolled_at).localeCompare(lastActivity.get(a.course_id) ?? a.enrolled_at))

  const pct = (e: Enrollment) => e.progress_percent ?? 0
  const stats = {
    total: enrollments.length,
    inProgress: enrollments.filter(e => pct(e) > 0 && pct(e) < 100).length,
    completed: enrollments.filter(e => pct(e) >= 100).length,
    certs: certCount ?? 0,
  }

  // Formation à reprendre : la plus récemment travaillée et non terminée
  const resume = byRecent.find(e => pct(e) < 100) ?? null
  let nextLesson: { id: string; title: string; moduleTitle: string } | null = null
  let lessonsLeft = 0
  if (resume) {
    const [{ data: modules }, { data: done }] = await Promise.all([
      supabase.from('modules').select('id, title, position, lessons(id, title, position)').eq('course_id', resume.course_id).order('position'),
      supabase.from('lesson_progress').select('lesson_id').eq('user_id', user.id).eq('course_id', resume.course_id).eq('is_completed', true),
    ])
    const completed = new Set((done ?? []).map(d => d.lesson_id))
    const ordered = (modules ?? []).flatMap(m =>
      [...((m.lessons ?? []) as { id: string; title: string; position: number }[])]
        .sort((a, b) => a.position - b.position)
        .map(l => ({ ...l, moduleTitle: m.title as string })))
    const next = ordered.find(l => !completed.has(l.id))
    if (next) nextLesson = { id: next.id, title: next.title, moduleTitle: next.moduleTitle }
    lessonsLeft = ordered.filter(l => !completed.has(l.id)).length
  }

  // Agenda : séances de coaching + sessions live des formations suivies
  const agenda: AgendaItem[] = ((coaching ?? []) as unknown as { id: string; starts_at: string; offer: { title: string } | null; coach: { full_name: string } | null }[])
    .map(b => ({ id: b.id, kind: 'coaching' as const, title: b.offer?.title ?? 'Séance de coaching', startsAt: b.starts_at, href: '/mes-seances', with: b.coach?.full_name }))
  const courseIds = enrollments.map(e => e.course_id)
  if (courseIds.length) {
    const { data: lives } = await supabase.from('live_sessions')
      .select('id, title, scheduled_at')
      .in('course_id', courseIds)
      .in('status', ['scheduled', 'live'])
      .gt('scheduled_at', new Date(Date.now() - 2 * 3600_000).toISOString())
      .order('scheduled_at')
      .limit(3)
    for (const l of lives ?? []) agenda.push({ id: l.id, kind: 'live', title: l.title, startsAt: l.scheduled_at, href: `/sessions-live/${l.id}` })
  }
  agenda.sort((a, b) => a.startsAt.localeCompare(b.startsAt))

  // Niveau calculé à partir des XP
  const xp = profile?.xp_points ?? 0
  const streak = profile?.streak_days ?? 0
  const lvlIdx = LEVELS.reduce((idx, l, i) => (xp >= l.min ? i : idx), 0)
  const level = LEVELS[lvlIdx]
  const nextLvl = LEVELS[lvlIdx + 1]
  const progressToNext = nextLvl ? Math.min(100, Math.round(((xp - level.min) / (nextLvl.min - level.min)) * 100)) : 100

  // Formations obligatoires à terminer avant une échéance + certificats à renouveler
  const todayIso = new Date().toISOString().slice(0, 10)
  const dueSoon = enrollments
    .filter(e => e.due_date && pct(e) < 100)
    .sort((a, b) => a.due_date!.localeCompare(b.due_date!))
  const { data: expiringCerts } = await supabase.from('certificates').select('id, course_title, expires_at')
    .eq('user_id', user.id).is('superseded_at', null).not('expires_at', 'is', null)
    .lte('expires_at', new Date(Date.now() + 30 * 86400_000).toISOString())

  const firstName = profile?.full_name?.split(' ')[0] ?? ''
  const isNew = enrollments.length === 0

  return (
    <div className="max-w-5xl space-y-5 sm:space-y-6">
      {/* ── Bonjour ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] sm:text-2xl font-bold text-gray-900 truncate">{t.dashboard.welcome}, {firstName} 👋</h1>
          <p className="text-gray-500 text-sm">{t.dashboard.continueJourney}</p>
        </div>
        {streak > 0 && (
          <Link href="/mes-stats" className="flex-shrink-0 flex items-center gap-1.5 bg-orange-50 border border-orange-100 px-3 py-2 rounded-2xl" title="Jours d'affilée">
            <Flame className="w-5 h-5 text-[#FFA500]" />
            <span className="font-bold text-orange-700">{streak} j</span>
          </Link>
        )}
      </div>

      {managedOrgs.length > 0 && (
        <Link href={managedOrgs.length === 1 ? `/organisation/${managedOrgs[0].slug}` : '/organisation'}
          className="flex items-center gap-3 rounded-2xl bg-white border border-gray-100 shadow-sm px-4 py-3.5 hover:shadow-md transition-shadow">
          <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0"><Building2 className="w-5 h-5" /></span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-gray-900 text-sm">Espace entreprise</span>
            <span className="block text-xs text-gray-500 truncate">Suivez la formation de vos équipes · <span data-no-translate>{managedOrgs.map(o => o.name).join(', ')}</span></span>
          </span>
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </Link>
      )}

      {(dueSoon.length > 0 || (expiringCerts ?? []).length > 0) && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2">
          <h2 className="font-bold text-amber-900 text-sm flex items-center gap-2"><CalendarClock className="w-4 h-4" /> À faire en priorité</h2>
          {dueSoon.slice(0, 4).map(e => {
            const late = e.due_date! < todayIso
            return (
              <Link key={e.id} href={`/apprendre/${e.course_id}`} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3.5 py-2.5 text-sm hover:shadow-sm">
                <span className="min-w-0">
                  <span className="block font-semibold text-gray-900 truncate">{e.course?.title}</span>
                  <span className={`block text-xs ${late ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>Obligatoire · {late ? 'en retard depuis le' : 'à terminer avant le'} {formatDate(e.due_date!)} · {pct(e)} %</span>
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </Link>
            )
          })}
          {(expiringCerts ?? []).map(c => (
            <Link key={c.id} href="/mes-certificats" className="flex items-center justify-between gap-3 rounded-xl bg-white px-3.5 py-2.5 text-sm hover:shadow-sm">
              <span className="min-w-0">
                <span className="block font-semibold text-gray-900 truncate">Certificat : {c.course_title}</span>
                <span className="block text-xs text-red-600">{new Date(c.expires_at!) < new Date() ? 'Expiré' : 'Expire'} le {formatDate(c.expires_at!)} · recertification disponible</span>
              </span>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </Link>
          ))}
        </section>
      )}

      {/* ── Action principale ── */}
      {resume?.course ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B3D91] via-[#0d47a8] to-[#1a56cc] text-white p-5 sm:p-6">
          <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10" aria-hidden="true" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="hidden sm:block w-24 h-24 rounded-2xl overflow-hidden bg-white/10 flex-shrink-0">
              {resume.course.thumbnail_url
                ? <img src={resume.course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-white/50" /></div>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#FFA500]">{pct(resume) > 0 ? t.dashboard.resumeWhere : 'Commencez votre formation'}</p>
              <p className="mt-1 text-lg sm:text-xl font-bold leading-snug line-clamp-2">{resume.course.title}</p>
              {nextLesson && (
                <p className="mt-1 text-sm text-blue-100 line-clamp-1">Prochaine leçon : {nextLesson.title}</p>
              )}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 max-w-xs h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-[#FFA500] rounded-full" style={{ width: `${pct(resume)}%` }} />
                </div>
                <span className="text-xs text-blue-100 whitespace-nowrap">{pct(resume)} % · {lessonsLeft} leçon{lessonsLeft > 1 ? 's' : ''} restante{lessonsLeft > 1 ? 's' : ''}</span>
              </div>
            </div>
            <Link href={nextLesson ? `/apprendre/${resume.course.id}/${nextLesson.id}` : `/apprendre/${resume.course.id}`}
              className="flex items-center justify-center gap-2 bg-[#FFA500] text-black font-bold px-6 py-3.5 rounded-2xl hover:bg-orange-400 transition-colors flex-shrink-0">
              <Play className="w-5 h-5 fill-black" /> {pct(resume) > 0 ? t.dashboard.continue : 'Commencer'}
            </Link>
          </div>
        </div>
      ) : isNew ? (
        <div className="rounded-3xl bg-gradient-to-br from-[#0B3D91] to-[#1a56cc] text-white p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FFA500]">Premiers pas</p>
          <h2 className="mt-1 text-xl sm:text-2xl font-bold">Bienvenue sur IBIG E-LEARNING !</h2>
          <ol className="mt-4 space-y-3">
            {[
              { icon: Compass, text: 'Choisissez une formation dans le catalogue' },
              { icon: Play, text: 'Suivez vos leçons à votre rythme, même sur téléphone' },
              { icon: Award, text: 'Obtenez votre certificat vérifiable' },
            ].map((s, i) => (
              <li key={s.text} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0"><s.icon className="w-[18px] h-[18px]" /></span>
                <span className="text-[15px]"><strong>{i + 1}.</strong> {s.text}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            <Link href="/catalogue" className="flex items-center justify-center gap-2 bg-[#FFA500] text-black font-bold px-6 py-3.5 rounded-2xl">
              Explorer les formations <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/coaching" className="flex items-center justify-center gap-2 bg-white/10 border border-white/20 font-semibold px-6 py-3.5 rounded-2xl">
              <HeartHandshake className="w-4 h-4" /> Réserver un coach
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <CheckCircle2 className="w-10 h-10 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-lg font-bold">Toutes vos formations sont terminées 🎉</p>
            <p className="text-sm text-emerald-50">Continuez sur votre lancée avec une nouvelle compétence.</p>
          </div>
          <Link href="/catalogue" className="flex items-center justify-center gap-2 bg-white text-emerald-700 font-bold px-5 py-3 rounded-2xl">Nouvelle formation <ArrowRight className="w-4 h-4" /></Link>
        </div>
      )}

      {/* ── Compteurs ── */}
      {!isNew && (
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {[
            { label: t.dashboard.formations, value: stats.total, icon: BookOpen, color: 'text-[#0B3D91] bg-blue-50', href: '/mes-formations' },
            { label: t.dashboard.inProgress, value: stats.inProgress, icon: TrendingUp, color: 'text-orange-600 bg-orange-50', href: '/mes-formations' },
            { label: t.dashboard.completed, value: stats.completed, icon: Target, color: 'text-emerald-600 bg-emerald-50', href: '/mes-formations' },
            { label: t.dashboard.certificates, value: stats.certs, icon: Award, color: 'text-purple-600 bg-purple-50', href: '/mes-certificats' },
          ].map(s => (
            <Link key={s.label} href={s.href}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-5 flex flex-col items-center sm:items-start text-center sm:text-left hover:shadow-md transition-shadow">
              <span className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${s.color}`}><s.icon className="w-[18px] h-[18px] sm:w-5 sm:h-5" /></span>
              <span className="mt-2 text-xl sm:text-2xl font-extrabold text-gray-900 leading-none">{s.value}</span>
              <span className="mt-1 text-[11px] sm:text-xs text-gray-500 leading-tight">{s.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* ── À venir ── */}
      {agenda.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-[#0B3D91]" />
            <h2 className="font-bold text-gray-900">À venir</h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {agenda.slice(0, 4).map(a => {
              const d = new Date(a.startsAt)
              return (
                <li key={`${a.kind}-${a.id}`}>
                  <Link href={a.href} className="flex items-center gap-3.5 px-4 sm:px-5 py-3.5 hover:bg-gray-50/70">
                    <span className="w-12 text-center flex-shrink-0">
                      <span className="block text-[11px] font-semibold uppercase text-[#0B3D91]">{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                      <span className="block text-lg font-extrabold text-gray-900 leading-tight">{d.getDate()}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-gray-900 text-sm truncate">{a.title}</span>
                      <span className="block text-xs text-gray-500">
                        {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {a.kind === 'coaching' ? 'Séance de coaching' : 'Session live'}
                        {a.with ? <span data-no-translate> · {a.with}</span> : null}
                      </span>
                    </span>
                    {a.kind === 'coaching' ? <HeartHandshake className="w-5 h-5 text-rose-500 flex-shrink-0" /> : <Video className="w-5 h-5 text-[#0B3D91] flex-shrink-0" />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* ── Mes formations ── */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">{t.dashboard.myFormations}</h2>
            <Link href="/mes-formations" className="text-sm text-[#0B3D91] font-semibold flex items-center gap-1">{t.dashboard.seeAll} <ArrowRight className="w-4 h-4" /></Link>
          </div>
          {isNew ? (
            <div className="p-8 text-center">
              <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm mb-3">{t.dashboard.noFormations}</p>
              <Link href="/catalogue" className="text-[#0B3D91] font-semibold text-sm">{t.dashboard.exploreCatalog}</Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {byRecent.slice(0, 5).map(e => {
                const p = pct(e)
                const done = p >= 100
                return (
                  <li key={e.id}>
                    <Link href={`/apprendre/${e.course_id}`} className="px-4 sm:px-5 py-3.5 flex items-center gap-3.5 hover:bg-gray-50/70">
                      <span className="relative w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                        {e.course?.thumbnail_url
                          ? <img src={e.course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          : <span className="w-full h-full ibig-gradient flex items-center justify-center"><BookOpen className="w-6 h-6 text-white/60" /></span>}
                        {done && <span className="absolute inset-0 bg-emerald-500/80 flex items-center justify-center"><Award className="w-6 h-6 text-white" /></span>}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{e.course?.title}</span>
                        <span className="mt-1.5 flex items-center gap-2">
                          <span className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <span className={`block h-full rounded-full ${done ? 'bg-emerald-500' : 'bg-[#0B3D91]'}`} style={{ width: `${p}%` }} />
                          </span>
                          <span className="text-xs text-gray-500 font-semibold w-9 text-right">{p}%</span>
                        </span>
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <div className="space-y-5">
          {/* ── Progression ── */}
          <Link href="/mes-stats" className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFA500] to-orange-500 flex items-center justify-center text-2xl">{level.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-gray-500">{t.dashboard.level}</span>
                <span className="block font-bold text-gray-900">{level.name}</span>
              </span>
              <span className="text-right">
                <span className="flex items-center gap-1 font-extrabold text-gray-900"><Zap className="w-4 h-4 text-[#FFA500]" />{xp.toLocaleString('fr-FR')}</span>
                <span className="block text-[11px] text-gray-400">XP</span>
              </span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>{nextLvl ? `${t.dashboard.towards} ${nextLvl.name}` : 'Niveau maximum atteint'}</span>
                <span>{progressToNext}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#0B3D91] to-[#FFA500] rounded-full" style={{ width: `${progressToNext}%` }} />
              </div>
              {nextLvl && <p className="mt-1.5 text-[11px] text-gray-400">Encore {(nextLvl.min - xp).toLocaleString('fr-FR')} XP</p>}
            </div>
          </Link>

          {/* ── Certificats ── */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-sm">{t.dashboard.certTitle}</h2>
              {stats.certs > 0 && <Link href="/mes-certificats" className="text-xs text-[#0B3D91] font-semibold">{t.dashboard.seeAllCerts}</Link>}
            </div>
            <div className="p-3 space-y-2">
              {(certificates ?? []).length > 0 ? (certificates as unknown as { id: string; issued_at: string; course: { title: string } | null }[]).map(c => (
                <Link key={c.id} href={`/mes-certificats/${c.id}/imprimer`}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-[#0B3D91]/5 to-[#FFA500]/5 border border-[#0B3D91]/10">
                  <span className="w-9 h-9 rounded-full bg-[#FFA500]/10 flex items-center justify-center flex-shrink-0"><Award className="w-4 h-4 text-[#FFA500]" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-gray-900 truncate">{c.course?.title}</span>
                    <span className="block text-xs text-gray-400">{formatDate(c.issued_at)}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              )) : (
                <div className="text-center py-4 px-2">
                  <Award className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">{t.dashboard.noCerts}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ── Recommandations ── */}
      {(recommended?.length ?? 0) > 0 && (
        <section>
          <div className="flex items-end justify-between mb-3">
            <div>
              <h2 className="font-bold text-gray-900">{t.dashboard.recommended}</h2>
              <p className="text-xs text-gray-400">{t.dashboard.recommendedSub}</p>
            </div>
            <Link href="/catalogue" className="text-sm text-[#0B3D91] font-semibold flex items-center gap-1">{t.dashboard.seeAll} <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible pb-1">
            {(recommended as { id: string; slug: string; title: string; thumbnail_url: string | null; level: string; instructor_name: string | null; price_xof: number }[]).map(c => (
              <Link key={c.id} href={`/formation/${c.slug}`}
                className="snap-start flex-shrink-0 w-[72%] sm:w-auto bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
                <span className="block aspect-video bg-gray-100 overflow-hidden">
                  {c.thumbnail_url
                    ? <img src={c.thumbnail_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <span className="w-full h-full ibig-gradient flex items-center justify-center"><BookOpen className="w-8 h-8 text-white/50" /></span>}
                </span>
                <span className="block p-3.5">
                  <span className="block text-[11px] text-[#FFA500] font-bold uppercase tracking-wide">{LEVEL_LABEL[c.level] ?? c.level}</span>
                  <span className="mt-1 block font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-[#0B3D91]">{c.title}</span>
                  <span className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-400 truncate">{c.instructor_name}</span>
                    <span className="text-xs font-bold text-[#0B3D91] whitespace-nowrap">{c.price_xof === 0 ? 'Gratuit' : `${c.price_xof?.toLocaleString('fr-FR')} FCFA`}</span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
