'use client'

import { useRef, useState } from 'react'
import { Upload, CheckCircle, AlertCircle, FileText, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const ACCEPTED = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv'
const MAX_MB = 50

interface Props {
  lessonTitle: string
  onSuccess: (url: string) => void
}

export default function DocumentUpload({ lessonTitle, onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [fileName, setFileName] = useState('')
  const supabase = createClient()

  async function handleFile(file: File) {
    if (file.size > MAX_MB * 1024 * 1024) {
      setErrorMsg(`Fichier trop lourd (max ${MAX_MB} Mo)`)
      setState('error')
      return
    }

    setFileName(file.name)
    setErrorMsg('')
    setState('uploading')
    setProgress(10)

    const ext = file.name.split('.').pop()
    const slug = lessonTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'doc'
    const path = `documents/${Date.now()}-${slug}.${ext}`

    // Supabase Storage upload
    const { data, error } = await supabase.storage
      .from('course-assets')
      .upload(path, file, { upsert: false, contentType: file.type })

    if (error) {
      setErrorMsg(error.message)
      setState('error')
      return
    }

    setProgress(90)

    const { data: { publicUrl } } = supabase.storage
      .from('course-assets')
      .getPublicUrl(data.path)

    setProgress(100)
    setState('done')
    onSuccess(publicUrl)
  }

  return (
    <div className="space-y-2 mt-1">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {state === 'idle' && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center gap-2 hover:border-[#0B3D91] hover:bg-blue-50 transition-colors cursor-pointer text-gray-500 hover:text-[#0B3D91]"
        >
          <FileText className="w-6 h-6" />
          <span className="text-sm font-medium">Cliquer pour uploader un document</span>
          <span className="text-xs text-gray-400">PDF, Word, PowerPoint, Excel — max {MAX_MB} Mo</span>
        </button>
      )}

      {state === 'uploading' && (
        <div className="p-4 bg-gray-50 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 font-medium truncate max-w-[220px]">{fileName}</span>
            <span className="text-[#0B3D91] font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-[#0B3D91] h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-400">Upload en cours…</p>
        </div>
      )}

      {state === 'done' && (
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl text-green-700 text-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Document uploadé !</p>
            <p className="text-xs text-green-600 mt-0.5 truncate">{fileName}</p>
          </div>
          <button type="button" onClick={() => { setState('idle'); setProgress(0) }}
            className="p-1 hover:bg-green-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {state === 'error' && (
        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Erreur</p>
            <p className="text-xs text-red-600">{errorMsg}</p>
          </div>
          <button type="button" onClick={() => setState('idle')} className="text-xs underline flex-shrink-0">Réessayer</button>
        </div>
      )}
    </div>
  )
}
