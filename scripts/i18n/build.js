/** Assemble scripts/i18n/tr/*.tsv (index<TAB>anglais) en src/i18n/dom/en.json */
const fs = require('fs'), path = require('path')
const strings = require('./strings.json')
const dictPath = path.join(__dirname, '..', '..', 'src', 'i18n', 'dom', 'en.json')
const dict = fs.existsSync(dictPath) ? JSON.parse(fs.readFileSync(dictPath, 'utf8')) : {}
let added = 0
for (const f of fs.readdirSync(path.join(__dirname, 'tr')).filter(f => f.endsWith('.tsv')).sort()) {
  for (const line of fs.readFileSync(path.join(__dirname, 'tr', f), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^(\d+)\t(.*)$/)
    if (!m) continue
    const fr = strings[Number(m[1])]?.s
    const en = m[2].trim()
    if (!fr || !en || en === fr) continue
    if (dict[fr] !== en) { dict[fr] = en; added++ }
  }
}
const sorted = Object.fromEntries(Object.entries(dict).sort(([a], [b]) => a.localeCompare(b)))
fs.writeFileSync(dictPath, JSON.stringify(sorted, null, 1) + '\n')
console.log(`${added} entrée(s) ajoutée(s) — dictionnaire : ${Object.keys(sorted).length} entrées`)
