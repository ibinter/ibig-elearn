import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ReactNode } from 'react'
import { isHtml, slugify } from '@/lib/blog-format'

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (node && typeof node === 'object' && 'props' in node) return textOf((node as { props: { children?: ReactNode } }).props.children)
  return ''
}

/** Corps d'article : Markdown (articles statiques) ou HTML (éditeur admin), même typographie. */
export default function ArticleBody({ content }: { content: string }) {
  if (isHtml(content)) {
    return <div className="article-body" dangerouslySetInnerHTML={{ __html: content }} />
  }

  return (
    <div className="article-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2 id={slugify(textOf(children))}>{children}</h2>,
          h2: ({ children }) => <h2 id={slugify(textOf(children))}>{children}</h2>,
          a: ({ href, children }) => {
            const external = href?.startsWith('http')
            return (
              <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {children}
              </a>
            )
          },
          table: ({ children }) => (
            <div className="article-table">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
