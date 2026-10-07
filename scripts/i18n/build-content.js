/** Assemble scripts/i18n/ctr/*.tsv (index<TAB>anglais) en src/i18n/dom/content-en.json */
const fs = require('fs'), path = require('path')
const strings = require('./content-strings.json')
const out = path.join(__dirname, '..', '..', 'src', 'i18n', 'dom', 'content-en.json')
const dict = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : {}
let n = 0
for (const f of fs.readdirSync(path.join(__dirname, 'ctr')).filter(f => f.endsWith('.tsv')).sort())
  for (const line of fs.readFileSync(path.join(__dirname, 'ctr', f), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^(\d+)\t(.*)$/); if (!m) continue
    const fr = strings[Number(m[1])]?.s, en = m[2].trim()
    if (fr && en && en !== fr && dict[fr] !== en) { dict[fr] = en; n++ }
  }
fs.writeFileSync(out, JSON.stringify(Object.fromEntries(Object.entries(dict).sort(([a], [b]) => a.localeCompare(b))), null, 1) + '\n')
console.log(`${n} ajoutée(s) — contenu : ${Object.keys(dict).length} entrées`)
