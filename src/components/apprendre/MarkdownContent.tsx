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
          h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4 mt-8 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold text-white mb-3 mt-6">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold text-gray-100 mb-2 mt-5">{children}</h3>,
          p: ({ children }) => <p className="text-gray-300 leading-relaxed mb-4">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1.5 mb-4 text-gray-300">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1.5 mb-4 text-gray-300">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
          em: ({ children }) => <em className="text-gray-200 italic">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#FFA500] pl-4 my-4 text-gray-400 italic">
              {children}
            </blockquote>
          ),
          code: ({ inline, children, ...props }: any) =>
            inline ? (
              <code className="bg-gray-700 text-[#FFA500] px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            ) : (
              <pre className="bg-gray-800 border border-gray-700 rounded-xl p-4 overflow-x-auto my-4">
                <code className="text-green-300 text-sm font-mono" {...props}>{children}</code>
              </pre>
            ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full text-sm text-left border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gray-800 text-gray-200">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-gray-700">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-gray-800/50">{children}</tr>,
          th: ({ children }) => <th className="px-4 py-2 font-semibold border-b border-gray-600">{children}</th>,
          td: ({ children }) => <td className="px-4 py-2 text-gray-300">{children}</td>,
          a: ({ href, children }) => (
            <a href={href} className="text-[#FFA500] hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          hr: () => <hr className="border-gray-700 my-6" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
