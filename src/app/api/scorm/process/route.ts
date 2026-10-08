import { NextRequest, NextResponse } from 'next/server'
import { unzipSync } from 'fflate'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canManageCourse, mimeFor, parsePackage, SCORM_BUCKET } from '@/lib/scorm'

export const maxDuration = 300

/** Décompresse un paquet SCORM / xAPI envoyé, publie ses fichiers et l'attache à une leçon. */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const courseId = String(body.courseId ?? '')
  const uploadPath = String(body.uploadPath ?? '')
  const admin = createAdminClient()
  if (!courseId || !(await canManageCourse(admin, user.id, courseId))) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  if (!uploadPath.startsWith(`uploads/${user.id}/`) || !uploadPath.endsWith('.zip')) return NextResponse.json({ error: 'Fichier invalide' }, { status: 400 })

  const cleanup = () => admin.storage.from(SCORM_BUCKET).remove([uploadPath])

  // 1. Lecture et décompression
  const { data: blob, error: dlError } = await admin.storage.from(SCORM_BUCKET).download(uploadPath)
  if (dlError || !blob) return NextResponse.json({ error: 'Fichier envoyé introuvable' }, { status: 404 })
  let files: Record<string, Uint8Array>
  try {
    const all = unzipSync(new Uint8Array(await blob.arrayBuffer()))
    // Fichiers uniquement, sans chemins dangereux ni fichiers système macOS
    files = Object.fromEntries(Object.entries(all).filter(([p]) =>
      !p.endsWith('/') && !p.includes('..') && !p.startsWith('/') && !p.startsWith('__MACOSX/') && !p.endsWith('.DS_Store')))
    // Paquet zippé dans un sous-dossier unique : on le remonte à la racine
    const roots = new Set(Object.keys(files).map(p => p.split('/')[0]))
    if (roots.size === 1 && !Object.keys(files).some(p => /^(imsmanifest|tincan)\.xml$/i.test(p))) {
      const prefix = [...roots][0] + '/'
      files = Object.fromEntries(Object.entries(files).map(([p, d]) => [p.slice(prefix.length), d]))
    }
  } catch {
    await cleanup()
    return NextResponse.json({ error: 'Le fichier n’est pas une archive ZIP valide.' }, { status: 400 })
  }

  let info
  try { info = parsePackage(files) } catch (e) {
    await cleanup()
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
  const launchFile = info.launchPath.split('?')[0]
  if (!Object.keys(files).some(p => p.toLowerCase() === launchFile.toLowerCase())) {
    await cleanup()
    return NextResponse.json({ error: `Fichier de lancement introuvable dans le paquet : ${launchFile}` }, { status: 400 })
  }

  // 2. Enregistrement du paquet
  const sizeBytes = Object.values(files).reduce((s, f) => s + f.byteLength, 0)
  const title = String(body.title ?? '').trim() || info.title || 'Module interactif'
  const { data: pkg, error: pkgError } = await admin.from('scorm_packages').insert({
    course_id: courseId, title, standard: info.standard, launch_path: info.launchPath, activity_id: info.activityId,
    mastery_score: info.masteryScore, file_count: Object.keys(files).length, size_bytes: sizeBytes, uploaded_by: user.id,
  }).select('id').single()
  if (pkgError || !pkg) { await cleanup(); return NextResponse.json({ error: pkgError?.message ?? 'Enregistrement impossible' }, { status: 500 }) }

  // 3. Publication des fichiers (envois parallèles)
  const entries = Object.entries(files)
  let failed = 0
  for (let i = 0; i < entries.length; i += 12) {
    await Promise.all(entries.slice(i, i + 12).map(async ([path, data]) => {
      const { error } = await admin.storage.from(SCORM_BUCKET)
        .upload(`packages/${pkg.id}/${path}`, data, { contentType: mimeFor(path), upsert: true })
      if (error) failed++
    }))
  }
  await cleanup()
  if (failed) {
    await admin.from('scorm_packages').delete().eq('id', pkg.id)
    return NextResponse.json({ error: `${failed} fichier(s) n’ont pas pu être publiés. Réessayez.` }, { status: 500 })
  }

  // 4. Rattachement à une leçon (existante ou nouvelle en fin de module)
  let lessonId = body.lessonId ? String(body.lessonId) : null
  if (lessonId) {
    await admin.from('lessons').update({ type: 'scorm', scorm_package_id: pkg.id }).eq('id', lessonId).eq('course_id', courseId)
  } else if (body.moduleId) {
    const { data: last } = await admin.from('lessons').select('position').eq('module_id', String(body.moduleId))
      .order('position', { ascending: false }).limit(1).maybeSingle()
    const { data: created } = await admin.from('lessons').insert({
      module_id: String(body.moduleId), course_id: courseId, title, type: 'scorm', scorm_package_id: pkg.id,
      position: (last?.position ?? 0) + 1,
    }).select('id').single()
    lessonId = created?.id ?? null
  }

  return NextResponse.json({ ok: true, packageId: pkg.id, lessonId, standard: info.standard, title, files: entries.length })
}
