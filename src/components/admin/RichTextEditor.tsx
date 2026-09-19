'use client'

import { useEffect, useRef } from 'react'
import { Bold, Italic, List, Link as LinkIcon, Code, Heading2, Heading3 } from 'lucide-react'

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInternalChange = useRef(false)

  useEffect(() => {
    if (!editorRef.current) return
    // Only sync from outside if not currently editing
    if (document.activeElement !== editorRef.current) {
      isInternalChange.current = true
      editorRef.current.innerHTML = value
      isInternalChange.current = false
    }
  }, [value])

  function exec(cmd: string, val?: string) {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val)
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  function insertHeading(tag: 'h2' | 'h3') {
    editorRef.current?.focus()
    document.execCommand('formatBlock', false, tag)
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  function insertLink() {
    const url = prompt('URL du lien :')
    if (url) exec('createLink', url)
  }

  const tools = [
    { icon: Bold, label: 'Gras', action: () => exec('bold') },
    { icon: Italic, label: 'Italique', action: () => exec('italic') },
    { icon: Heading2, label: 'Titre H2', action: () => insertHeading('h2') },
    { icon: Heading3, label: 'Titre H3', action: () => insertHeading('h3') },
    { icon: List, label: 'Liste', action: () => exec('insertUnorderedList') },
    { icon: LinkIcon, label: 'Lien', action: insertLink },
    { icon: Code, label: 'Code', action: () => exec('formatBlock', 'pre') },
  ]

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0B3D91]/20 focus-within:border-[#0B3D91]">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200 flex-wrap">
        {tools.map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            type="button"
            title={label}
            onMouseDown={e => { e.preventDefault(); action() }}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors"
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          if (editorRef.current) onChange(editorRef.current.innerHTML)
        }}
        data-placeholder={placeholder ?? 'Contenu de l\'article...'}
        className="min-h-[260px] px-4 py-3 text-sm text-gray-800 focus:outline-none prose prose-sm max-w-none
          [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-400 [&:empty]:before:pointer-events-none"
      />
    </div>
  )
}
