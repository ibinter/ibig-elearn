/**
 * Extrait les textes de contenu publiés (formations, modules, leçons, catégories, parcours)
 * depuis Supabase (clé publique, données publiques uniquement).
 *   node scripts/i18n/content.js            → écrit scripts/i18n/content-strings.json
 *   node scripts/i18n/content.js --missing  → liste ceux absents de src/i18n/dom/content-en.json
 */
const fs = require('fs'), path = require('path')
const { createClient } = require('@supabase/supabase-js')
const env = Object.fromEntries(fs.readFileSync(path.join(__dirname, '..', '..', '.env.local'), 'utf8')
  .split(/\r?\n/).filter(l => l.includes('=') && !l.startsWith('#'))
  .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const norm = s => String(s ?? '').replace(/\s+/g, ' ').trim()

;(async () => {
  const out = new Map()
  const add = (s, ctx) => { s = norm(s); if (s && /[A-Za-zÀ-ÿ]{2}/.test(s) && !out.has(s)) out.set(s, ctx) }
  const { data: courses, error } = await sb.from('courses').select('id, slug, title, short_description, description, objectives, instructor_id').eq('is_published', true)
  if (error) { console.error(error.message); process.exit(1) }
  for (const c of courses) {
    add(c.title, `course:${c.slug}`); add(c.short_description, `course:${c.slug}:short`)
    for (const p of String(c.description ?? '').split(/\n+/)) add(p, `course:${c.slug}:desc`)
    add(c.description, `course:${c.slug}:desc-full`)
    for (const o of c.objectives ?? []) add(o, `course:${c.slug}:objective`)
  }
  const ids = courses.map(c => c.id)
  const { data: modules } = await sb.from('modules').select('id, title, course_id').in('course_id', ids)
  for (const m of modules ?? []) add(m.title, 'module')
  const { data: lessons } = await sb.from('lessons').select('title, module_id').in('module_id', (modules ?? []).map(m => m.id))
  for (const l of lessons ?? []) add(l.title, 'lesson')
  const { data: instructors } = await sb.from('profiles').select('bio').in('id', [...new Set(courses.map(c => c.instructor_id).filter(Boolean))])
  for (const p of instructors ?? []) {
    add(p.bio, 'instructor:bio')
    for (const part of String(p.bio ?? '').split(/\n+/)) add(part, 'instructor:bio')
  }
  const { data: cats } = await sb.from('categories').select('name, description')
  for (const c of cats ?? []) { add(c.name, 'category'); add(c.description, 'category:desc') }
  const { data: paths } = await sb.from('learning_paths').select('title, short_description, description').eq('is_published', true)
  for (const p of paths ?? []) { add(p.title, 'path'); add(p.short_description, 'path:short'); add(p.description, 'path:desc') }

  const list = [...out.entries()].map(([s, ctx]) => ({ s, ctx }))
  if (process.argv.includes('--missing')) {
    const dictPath = path.join(__dirname, '..', '..', 'src', 'i18n', 'dom', 'content-en.json')
    const dict = fs.existsSync(dictPath) ? JSON.parse(fs.readFileSync(dictPath, 'utf8')) : {}
    const missing = list.filter(o => !(o.s in dict))
    console.log(`${missing.length} texte(s) de contenu sans traduction sur ${list.length}`)
    missing.slice(0, 100).forEach(m => console.log(`- [${m.ctx}] ${m.s.slice(0, 90)}`))
  } else {
    fs.writeFileSync(path.join(__dirname, 'content-strings.json'), JSON.stringify(list, null, 1))
    console.log(`${courses.length} formations, ${modules?.length ?? 0} modules, ${lessons?.length ?? 0} leçons, ${cats?.length ?? 0} catégories, ${paths?.length ?? 0} parcours → ${list.length} textes`)
  }
})()
