'use client'

import { useEffect } from 'react'

/**
 * Traduction de l'interface (FR → EN) appliquée au rendu.
 *
 * Le site est rédigé en français ; quand la langue choisie est l'anglais, ce composant
 * remplace chaque texte affiché (nœuds texte + attributs placeholder/title/alt/aria-label)
 * par sa traduction issue de src/i18n/dom/en.json. Il suit aussi les contenus ajoutés
 * ensuite (navigation, chargements, modales) via un MutationObserver.
 *
 * - Clés = texte français normalisé (espaces compactés). Motifs « {0} leçons » pour les gabarits.
 * - Contenu des formations : src/i18n/dom/content-en.json (node scripts/i18n/content.js --missing).
 * - Un élément (et ses descendants) portant data-no-translate est ignoré.
 * - Le dictionnaire n'est téléchargé que par les visiteurs anglophones.
 * - Mettre à jour le dictionnaire : node scripts/i18n/extract.js --missing
 */

type Dict = Record<string, string>
type Pattern = { re: RegExp; en: string }

const ATTRS = ['placeholder', 'title', 'alt', 'aria-label'] as const
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE', 'svg'])

const norm = (s: string) => s.replace(/\s+/g, ' ').trim()

function escapeRe(s: string) {
  return s.replace(/[.*+?^$()|[\]\\]/g, '\\$&')
}

function compilePatterns(dict: Dict): Pattern[] {
  const out: Pattern[] = []
  for (const [fr, en] of Object.entries(dict)) {
    if (!/\{\d+\}/.test(fr)) continue
    const parts = fr.split(/(\{\d+\})/)
    const order: number[] = []
    const src = parts.map(p => {
      const m = p.match(/^\{(\d+)\}$/)
      if (m) { order.push(Number(m[1])); return '(.*?)' }
      return escapeRe(p).replace(/\\?\{/g, '\\{').replace(/\\?\}/g, '\\}')
    }).join('')
    try {
      const re = new RegExp(`^${src}$`)
      out.push({ re, en: en.replace(/\{(\d+)\}/g, (_, i) => `{${order.indexOf(Number(i))}}`) })
    } catch { /* motif invalide ignoré */ }
  }
  // motifs les plus spécifiques d'abord
  return out.sort((a, b) => b.re.source.length - a.re.source.length)
}

function makeTranslate(dict: Dict, patterns: Pattern[]) {
  return (raw: string): string | null => {
    const key = norm(raw)
    if (!key || key.length < 2) return null
    let en = dict[key]
    if (en === undefined) {
      for (const p of patterns) {
        const m = key.match(p.re)
        if (m) {
          en = p.en.replace(/\{(\d+)\}/g, (_, i) => {
            const v = m[Number(i) + 1] ?? ''
            return dict[v] ?? v
          })
          break
        }
      }
    }
    if (en === undefined || en === key) return null
    const lead = raw.match(/^\s*/)?.[0] ?? ''
    const trail = raw.match(/\s*$/)?.[0] ?? ''
    return lead + en + trail
  }
}

function skipped(el: Element | null): boolean {
  for (let e = el; e; e = e.parentElement) {
    if (SKIP_TAGS.has(e.tagName) || e.hasAttribute('data-no-translate') || (e as HTMLElement).isContentEditable) return true
  }
  return false
}

export default function DomTranslator({ locale }: { locale: 'fr' | 'en' }) {
  useEffect(() => {
    const root = document.documentElement
    if (locale !== 'en') { root.classList.remove('i18n-pending'); return }

    let observer: MutationObserver | null = null
    let titleObserver: MutationObserver | null = null
    let disposed = false
    const reveal = () => root.classList.remove('i18n-pending')
    const safety = window.setTimeout(reveal, 2500)

    Promise.all([
      import('@/i18n/dom/en.json'),
      import('@/i18n/dom/content-en.json'), // titres/descriptions des formations, modules, leçons, catégories
    ]).then(([ui, content]) => {
      if (disposed) return
      const dict = { ...((ui.default ?? ui) as Dict), ...((content.default ?? content) as Dict) }
      const translate = makeTranslate(dict, compilePatterns(dict))

      const doText = (node: Text) => {
        const v = node.nodeValue
        if (!v || !/[A-Za-zÀ-ÿ]/.test(v) || skipped(node.parentElement)) return
        const en = translate(v)
        if (en !== null && en !== v) node.nodeValue = en
      }
      const doEl = (el: Element) => {
        if (el.hasAttribute('data-no-translate') || skipped(el.parentElement)) return
        for (const a of ATTRS) {
          const v = el.getAttribute(a)
          if (v) { const en = translate(v); if (en !== null && en !== v) el.setAttribute(a, en) }
        }
        if (el instanceof HTMLInputElement && (el.type === 'submit' || el.type === 'button') && el.value) {
          const en = translate(el.value); if (en !== null) el.value = en
        }
      }
      const doTree = (start: Node) => {
        if (start.nodeType === Node.TEXT_NODE) { doText(start as Text); return }
        if (start.nodeType !== Node.ELEMENT_NODE) return
        const el = start as Element
        if (skipped(el)) return
        doEl(el)
        const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
          acceptNode: n => (n.nodeType === Node.ELEMENT_NODE && (SKIP_TAGS.has((n as Element).tagName) || (n as Element).hasAttribute('data-no-translate')))
            ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
        })
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          if (n.nodeType === Node.TEXT_NODE) doText(n as Text)
          else doEl(n as Element)
        }
      }
      const doTitle = () => {
        const t = document.title
        const [page, ...rest] = t.split(' | ')
        const en = translate(page)
        if (en !== null) document.title = [en, ...rest].join(' | ')
      }

      // Boîtes de dialogue natives (confirm / alert / prompt)
      const w = window as Window & { __i18nDialogs?: boolean }
      if (!w.__i18nDialogs) {
        w.__i18nDialogs = true
        const tr = (m?: unknown) => (typeof m === 'string' ? translate(m) ?? m : m)
        const { confirm, alert, prompt } = window
        window.confirm = (m?: string) => confirm.call(window, tr(m) as string)
        window.alert = (m?: unknown) => alert.call(window, tr(m))
        window.prompt = (m?: string, d?: string) => prompt.call(window, tr(m) as string, d)
      }

      doTree(document.body)
      doTitle()
      reveal()

      observer = new MutationObserver(muts => {
        for (const m of muts) {
          if (m.type === 'characterData') doText(m.target as Text)
          else if (m.type === 'attributes') doEl(m.target as Element)
          else m.addedNodes.forEach(n => doTree(n))
        }
      })
      observer.observe(document.body, {
        subtree: true, childList: true, characterData: true,
        attributes: true, attributeFilter: [...ATTRS],
      })
      // Next.js remplace la balise <title> à chaque navigation : on observe tout le <head>
      titleObserver = new MutationObserver(doTitle)
      titleObserver.observe(document.head, { subtree: true, childList: true, characterData: true })
    }).catch(reveal)

    return () => { disposed = true; observer?.disconnect(); titleObserver?.disconnect(); window.clearTimeout(safety) }
  }, [locale])

  return null
}
