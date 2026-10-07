/**
 * Extrait tous les textes français affichables de l'interface (src/app + src/components).
 *   node scripts/i18n/extract.js            → écrit scripts/i18n/strings.json
 *   node scripts/i18n/extract.js --missing  → liste les textes absents du dictionnaire anglais
 *                                             (same.json = textes identiques en anglais, volontairement non traduits)
 *
 * Les gabarits `${x} leçons` deviennent des motifs « {0} leçons ».
 */
const ts = require('typescript')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', '..')
const SKIP_DIR = /[\\/](api)[\\/]/
const LABEL_PROPS = /^(label|title|desc|description|text|name|placeholder|subtitle|sub|message|cta|ctaLabel|question|answer|q|a|content|tagline|badge|hint|tooltip|heading|body|intro|note|caption|empty|emptyText|button|buttonLabel|value|tag|status|tip|info|alt|legend|step|detail|details|feature|features|benefit|pros|cons|short|long|summary|excerpt|error|success|warning)$/i
const LABEL_ATTRS = /^(placeholder|title|alt|aria-label|label|tooltip|description|confirmText|emptyMessage)$/
const NON_TEXT_CALLS = /^(select|eq|neq|from|order|or|in|is|like|ilike|match|contains|rpc|channel|on|get|set|has|delete|push|replace|startsWith|endsWith|includes|split|join|test|toLocaleString|toLocaleDateString|toLocaleTimeString|fetch|redirect|require|createElement|querySelector|querySelectorAll|getElementById|addEventListener|removeEventListener|setItem|getItem|removeItem|log|warn|error|info|debug|cookies|headers|revalidatePath|revalidateTag|encodeURIComponent|URL|Date|RegExp|Intl|NumberFormat|DateTimeFormat|padStart|format|filter|sort|find|map|upload|download|createSignedUrl|getPublicUrl|storage|auth|insert|update|upsert|limit|range|single|maybeSingle|textSearch|then|catch)$/

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    if (fs.statSync(p).isDirectory()) { if (!SKIP_DIR.test(p + path.sep)) walk(p, out) }
    else if (/\.tsx?$/.test(f) && !/\.d\.ts$/.test(f)) out.push(p)
  }
  return out
}

// Le texte JSX brut contient des entités (&apos; …) alors que le DOM affiche le caractère décodé
const decode = s => s
  .replace(/&apos;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
const norm = s => decode(s).replace(/\s+/g, ' ').trim()
const hasLetters = s => /[A-Za-zÀ-ÿ]{2,}/.test(s)
const looksCode = s =>
  /^(https?:|mailto:|tel:|\/|\.|@|\$|data:|www\.)/.test(s) ||
  /^#[\w-]*$/.test(s) ||                                          // ancre (#section), pas « #1 Plateforme… »
  /^[\w-]+\.(png|jpg|jpeg|webp|svg|pdf|mp4|js|ts|css|json)$/i.test(s) ||
  /^[a-z0-9]+([_-][a-z0-9]+)+$/.test(s) ||                       // snake/kebab ids
  /\b(bg|text|flex|grid|w|h|p|m|px|py|mx|my|rounded|border|items|justify|gap|shadow|hover|sm|md|lg)-/.test(s) && !/[éèàç]/.test(s) ||
  /^[A-Z0-9_]+$/.test(s) ||
  /^[\d\s.,:%+\-–/()€$]+$/.test(s) ||
  /^(use client|use server)$/.test(s) ||
  /^[a-z]+(\.[a-z]+)+$/i.test(s) ||                               // a.b.c
  /[{};]|=>|\(\)|&&|\|\|/.test(s)
const frenchy = s => /[éèêëàâùûüçôîïœÉÈÀÇ]/.test(s) || /\b(le|la|les|des|du|de|un|une|et|ou|pour|avec|sans|vos|votre|nos|notre|en|au|aux|sur|par|dans|est|sont|pas|plus|vous|nous|mon|mes|ma|ce|cette|qui|que)\b/i.test(s)

function inSkippedCall(node) {
  let child = node, p = node.parent
  for (let i = 0; i < 3 && p; i++, child = p, p = p.parent) {
    if (ts.isCallExpression(p)) {
      if (!p.arguments.includes(child)) return false
      const e = p.expression
      const name = ts.isPropertyAccessExpression(e) ? e.name.text : ts.isIdentifier(e) ? e.text : ''
      if (NON_TEXT_CALLS.test(name)) return true
      if (name === 'cn' || name === 'clsx' || name === 'cva') return true
      return false
    }
  }
  return false
}

function propName(node) {
  const p = node.parent
  if (p && ts.isPropertyAssignment(p) && p.initializer === node) return p.name.getText().replace(/['"]/g, '')
  return null
}

function extract() {
  const files = walk(path.join(ROOT, 'src', 'app')).concat(walk(path.join(ROOT, 'src', 'components')))
    .filter(f => !/i18n|\.test\.|opengraph-image|sitemap|robots/.test(f))
  const strings = new Map()
  const add = (s, file) => {
    s = norm(s)
    const plain = s.replace(/\{\d+\}/g, '')
    if (!s || !hasLetters(plain) || looksCode(plain)) return
    if (!strings.has(s)) strings.set(s, new Set())
    strings.get(s).add(path.relative(ROOT, file).replace(/\\/g, '/'))
  }

  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8')
    const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
    const visit = node => {
      if (ts.isJsxText(node)) {
        const t = norm(node.text)
        if (t && hasLetters(t)) add(t, file)
      } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        const p = node.parent
        const t = node.text
        if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isExternalModuleReference(p)) return
        if (ts.isLiteralTypeNode(p)) return
        if (ts.isJsxExpression(p) && p.parent && ts.isJsxAttribute(p.parent)) {
          if (LABEL_ATTRS.test(p.parent.name.getText())) add(t, file)
          return
        }
        if (ts.isJsxAttribute(p)) {
          if (LABEL_ATTRS.test(p.name.getText())) add(t, file)
          return
        }
        if (ts.isPropertyAssignment(p) && p.name === node) return
        if (ts.isElementAccessExpression(p)) return
        if (ts.isCaseClause(p) || (ts.isBinaryExpression(p) && /===|!==|==|!=/.test(p.operatorToken.getText()))) return
        if (inSkippedCall(node)) return
        const pn = propName(node)
        if (pn && /^(className|href|src|icon|color|bg|gradient|type|variant|key|id|slug|path|route|url|value_key|field|size|kind|mode|role|level|category|cat|category_slug|currency|code|locale|lang|format|sort|order|status|status_key|tab|unit|value)$/.test(pn) && (/^[w./#:-]*$/.test(t) || /^(className|href|src|icon|color|bg|gradient|url|path|route)$/.test(pn))) return
        if ((pn && LABEL_PROPS.test(pn)) || frenchy(t) ||
            (/\s/.test(t) && /[a-zà-ÿ]{3,}\s+(&\s+)?[a-zà-ÿ]{3,}/i.test(t)) ||   // « Inscription & Compte »
            /\d\+?\s+[a-zà-ÿ]{4,}/i.test(t)) add(t, file)                       // « 100+ apprenants »
      } else if (ts.isTemplateExpression(node)) {
        if (inSkippedCall(node)) return
        const p = node.parent
        if (p && ts.isJsxAttribute(p) && !LABEL_ATTRS.test(p.name.getText())) return
        let s = node.head.text, i = 0
        for (const span of node.templateSpans) s += `{${i++}}` + span.literal.text
        const plain = s.replace(/\{\d+\}/g, '')
        if (frenchy(plain) && hasLetters(plain) && !looksCode(plain)) add(s, file)
      }
      ts.forEachChild(node, visit)
    }
    visit(sf)
  }
  return strings
}

const strings = extract()
const out = [...strings.entries()].map(([s, files]) => ({ s, f: [...files][0], n: files.size }))
  .sort((a, b) => a.f.localeCompare(b.f) || a.s.localeCompare(b.s))

if (process.argv.includes('--missing')) {
  const dictPath = path.join(ROOT, 'src', 'i18n', 'dom', 'en.json')
  const dict = fs.existsSync(dictPath) ? JSON.parse(fs.readFileSync(dictPath, 'utf8')) : {}
  const samePath = path.join(__dirname, 'same.json')
  const same = new Set(fs.existsSync(samePath) ? JSON.parse(fs.readFileSync(samePath, 'utf8')) : [])
  const missing = out.filter(o => !(o.s in dict) && !same.has(o.s))
  console.log(`${missing.length} texte(s) sans traduction anglaise sur ${out.length}`)
  for (const m of missing.slice(0, 200)) console.log(`- ${m.f}: ${m.s.slice(0, 100)}`)
  process.exit(missing.length ? 1 : 0)
} else {
  fs.writeFileSync(path.join(__dirname, 'strings.json'), JSON.stringify(out, null, 1))
  console.log(`${out.length} textes uniques extraits → scripts/i18n/strings.json`)
}
