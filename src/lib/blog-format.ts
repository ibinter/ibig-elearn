// Mise en forme des articles de blog (Markdown statique ou HTML venant de l'éditeur admin)

export function isHtml(content: string): boolean {
  return /^\s*<(p|h[1-6]|div|ul|ol|section|article|blockquote|figure|img|table)\b/i.test(content)
}

/**
 * Normalise la structure Markdown des articles :
 * - retire le premier titre s'il ne fait que répéter le titre de la page
 * - remonte les ### en ## quand l'article n'a plus de titre de niveau 2
 * - transforme les lignes « **1. Étape** » isolées en vrais intertitres
 * - sépare un intertitre gras de la ligne de texte qui le suit
 */
export function normalizeMarkdown(md: string): string {
  let lines = md.replace(/\r\n/g, '\n').trim().split('\n').map(l => l.replace(/\s+$/, ''))

  const firstContent = lines.findIndex(l => l.trim() !== '')
  if (firstContent >= 0 && /^#{1,2}\s/.test(lines[firstContent])) {
    lines.splice(firstContent, 1)
  }

  const hasH2 = lines.some(l => /^##\s/.test(l))
  if (!hasH2) lines = lines.map(l => l.replace(/^###\s/, '## '))

  const out: string[] = []
  for (const line of lines) {
    const m = line.match(/^\*\*(.+?)\*\*\s*$/)
    if (m) {
      out.push('', `### ${m[1].replace(/[:：]\s*$/, '')}`, '')
      continue
    }
    out.push(line)
  }
  return out.join('\n')
    .replace(/(\d) (?=\d{3}\b)/g, '$1 ') // 100 000 → espace fine insécable
    .replace(/(\d) (FCFA|XOF|€|%|h\b|min\b|ans\b|mois\b|jours\b|pays\b)/g, '$1 $2')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function stripMarkup(content: string): string {
  return content
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_>`\-[\]()!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function readingMinutes(content: string): number {
  const words = stripMarkup(content).split(' ').filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export type TocItem = { id: string; title: string }

export function extractToc(markdown: string): TocItem[] {
  return markdown
    .split('\n')
    .filter(l => /^##\s/.test(l))
    .map(l => {
      const title = l.replace(/^##\s+/, '').replace(/\*\*/g, '').trim()
      return { id: slugify(title), title }
    })
}

/** Formate une date ISO ou laisse tel quel un libellé déjà rédigé (« 15 septembre 2026 »). */
export function formatArticleDate(value: string | null | undefined): string | null {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const d = new Date(value)
    if (!isNaN(d.getTime())) return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  return value
}
