'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  content: string
  className?: string
}

export default function MarkdownContent({ content, className }: Props) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: () => null,
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8 flex items-center gap-2 leading-snug">
              <span className="w-1 h-6 bg-[#FFA500] rounded-full flex-shrink-0 inline-block" />
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-gray-700 mb-3 mt-6 leading-snug">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-gray-700 leading-[1.85] mb-5 text-[15px]">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-5 space-y-2 pl-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-5 space-y-2 pl-1 list-none counter-reset-item">{children}</ol>
          ),
          li: ({ children, ...props }) => (
            <li className="flex items-start gap-3 text-gray-700 text-[15px] leading-relaxed">
              <span className="w-2 h-2 rounded-full bg-[#0B3D91] flex-shrink-0 mt-[0.55em]" />
              <span>{children}</span>
            </li>
          ),
          strong: ({ children }) => (
            <strong className="text-gray-900 font-semibold bg-yellow-50 px-0.5 rounded">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-gray-600 italic">{children}</em>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-6 pl-5 pr-4 py-4 border-l-4 border-[#FFA500] bg-amber-50 rounded-r-xl text-gray-700 italic">
              {children}
            </blockquote>
          ),
          code: ({ inline, children, ...props }: any) =>
            inline ? (
              <code
                className="bg-[#0B3D91]/8 text-[#0B3D91] px-2 py-0.5 rounded-md text-[13px] font-mono border border-[#0B3D91]/15"
                {...props}
              >
                {children}
              </code>
            ) : (
              <div className="my-6 rounded-xl overflow-hidden shadow-md border border-gray-200">
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs text-gray-400 font-mono">code</span>
                </div>
                <pre className="bg-[#1e2433] p-5 overflow-x-auto">
                  <code className="text-green-300 text-sm font-mono leading-relaxed" {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 rounded-xl border border-gray-200 shadow-sm">
              <table className="w-full text-sm text-left">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#0B3D91] text-white">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gray-100">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-blue-50/50 transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 font-semibold text-sm">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-gray-700">{children}</td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-[#0B3D91] font-medium hover:text-[#FFA500] underline underline-offset-2 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          hr: () => (
            <div className="my-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              <span className="text-gray-300 text-lg">✦</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
