import { createHmac, timingSafeEqual } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export const SCORM_BUCKET = 'scorm'
export const MAX_PACKAGE_BYTES = 500 * 1024 * 1024

export type PackageInfo = {
  standard: 'scorm12' | 'scorm2004' | 'xapi'
  launchPath: string
  title: string | null
  activityId: string | null
  masteryScore: number | null
}

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1] ?? null
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").trim()

/** Lit imsmanifest.xml (SCORM) ou tincan.xml (xAPI) et renvoie le point d'entrée du module. */
export function parsePackage(files: Record<string, Uint8Array>): PackageInfo {
  const text = (name: string) => {
    const key = Object.keys(files).find(k => k.toLowerCase() === name)
    return key ? new TextDecoder().decode(files[key]) : null
  }

  const tincan = text('tincan.xml')
  if (tincan) {
    const activity = tincan.match(/<activity\b[^>]*>[\s\S]*?<\/activity>/i)?.[0] ?? ''
    const launch = activity.match(/<launch\b[^>]*>([\s\S]*?)<\/launch>/i)?.[1]
    if (!launch) throw new Error('tincan.xml : aucun fichier de lancement')
    return {
      standard: 'xapi',
      launchPath: decode(launch),
      title: decode(activity.match(/<name\b[^>]*>([\s\S]*?)<\/name>/i)?.[1] ?? '') || null,
      activityId: attr(activity, 'id'),
      masteryScore: null,
    }
  }

  const manifest = text('imsmanifest.xml')
  if (!manifest) throw new Error('Paquet invalide : imsmanifest.xml (SCORM) ou tincan.xml (xAPI) introuvable à la racine du ZIP')

  const schemaVersion = manifest.match(/<(?:\w+:)?schemaversion>([^<]*)</i)?.[1]?.trim() ?? ''
  const standard: PackageInfo['standard'] = /2004|CAM 1\.3/i.test(schemaVersion) || /adlcp_v1p3|imscp_v1p1.*2004/i.test(manifest) ? 'scorm2004' : 'scorm12'

  // Organisation par défaut → premier élément lançable → ressource
  const orgs = manifest.match(/<(?:\w+:)?organizations\b[^>]*>/i)?.[0] ?? ''
  const defaultOrg = attr(orgs, 'default')
  const orgBlocks = [...manifest.matchAll(/<(?:\w+:)?organization\b[^>]*>[\s\S]*?<\/(?:\w+:)?organization>/gi)].map(m => m[0])
  const org = orgBlocks.find(b => attr(b.slice(0, b.indexOf('>') + 1), 'identifier') === defaultOrg) ?? orgBlocks[0] ?? ''
  const items = [...org.matchAll(/<(?:\w+:)?item\b[^>]*>/gi)].map(m => m[0])
  const ref = items.map(i => attr(i, 'identifierref')).find(Boolean)

  const resources = [...manifest.matchAll(/<(?:\w+:)?resource\b[^>]*>/gi)].map(m => m[0])
  const resource = (ref && resources.find(r => attr(r, 'identifier') === ref))
    ?? resources.find(r => /sco/i.test(attr(r, 'adlcp:scormtype') ?? attr(r, 'adlcp:scormType') ?? '') && attr(r, 'href'))
    ?? resources.find(r => attr(r, 'href'))
  const href = resource ? attr(resource, 'href') : null
  if (!href) throw new Error('imsmanifest.xml : aucune ressource lançable trouvée')
  const base = attr(resource!, 'xml:base') ?? ''

  const title = decode(org.match(/<(?:\w+:)?title>([\s\S]*?)<\/(?:\w+:)?title>/i)?.[1] ?? '') || null
  const mastery = org.match(/<(?:\w+:)?masteryscore>([^<]*)</i)?.[1]
  return { standard, launchPath: decode(base + href), title, activityId: null, masteryScore: mastery ? Number(mastery) : null }
}

/** Accès au contenu d'un paquet : apprenant inscrit, formateur du cours ou équipe IBIG. */
export async function canAccessCourse(admin: SupabaseClient, userId: string, courseId: string) {
  const [{ data: enr }, { data: course }, { data: profile }] = await Promise.all([
    admin.from('enrollments').select('id').eq('user_id', userId).eq('course_id', courseId).maybeSingle(),
    admin.from('courses').select('instructor_id').eq('id', courseId).single(),
    admin.from('profiles').select('role').eq('id', userId).single(),
  ])
  return !!enr || course?.instructor_id === userId || ['admin', 'coordinateur'].includes(profile?.role ?? '')
}

/** Peut gérer les contenus d'un cours (formateur propriétaire ou équipe IBIG). */
export async function canManageCourse(admin: SupabaseClient, userId: string, courseId: string) {
  const [{ data: course }, { data: profile }] = await Promise.all([
    admin.from('courses').select('instructor_id').eq('id', courseId).single(),
    admin.from('profiles').select('role').eq('id', userId).single(),
  ])
  return course?.instructor_id === userId || ['admin', 'coordinateur'].includes(profile?.role ?? '')
}

// ── Jeton xAPI : authentifie le contenu auprès du LRS intégré (HTTP Basic) ──
const secret = () => process.env.XAPI_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'ibig-xapi'

export function xapiToken(userId: string, lessonId: string, ttlHours = 12) {
  const payload = `${userId}.${lessonId}.${Math.floor(Date.now() / 1000) + ttlHours * 3600}`
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url')
  return Buffer.from(`ibig:${payload}.${sig}`).toString('base64')
}

export function readXapiToken(authorization: string | null): { userId: string; lessonId: string } | null {
  if (!authorization?.startsWith('Basic ')) return null
  const raw = Buffer.from(authorization.slice(6), 'base64').toString()
  const token = raw.startsWith('ibig:') ? raw.slice(5) : ''
  const [userId, lessonId, exp, sig] = token.split('.')
  if (!userId || !lessonId || !exp || !sig) return null
  const expected = createHmac('sha256', secret()).update(`${userId}.${lessonId}.${exp}`).digest('base64url')
  const a = Buffer.from(sig), b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b) || Number(exp) < Date.now() / 1000) return null
  return { userId, lessonId }
}

const MIME: Record<string, string> = {
  html: 'text/html; charset=utf-8', htm: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8', json: 'application/json', xml: 'application/xml', xsd: 'application/xml', txt: 'text/plain; charset=utf-8',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp', ico: 'image/x-icon',
  mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4',
  woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf', eot: 'application/vnd.ms-fontobject',
  pdf: 'application/pdf', swf: 'application/x-shockwave-flash', vtt: 'text/vtt',
}
export const mimeFor = (path: string) => MIME[path.split('.').pop()?.toLowerCase() ?? ''] ?? 'application/octet-stream'
