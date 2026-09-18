'use client'

import { useRef, useState } from 'react'
import { Upload, CheckCircle, AlertCircle, Film, X } from 'lucide-react'

interface Props {
  lessonTitle: string
  onSuccess: (videoUrl: string, durationSeconds?: number) => void
}

export default function BunnyUpload({ lessonTitle, onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<'idle' | 'creating' | 'uploading' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [fileName, setFileName] = useState('')
  const xhrRef = useRef<XMLHttpRequest | null>(null)

  async function handleFile(file: File) {
    setFileName(file.name)
    setErrorMsg('')
    setState('creating')

    // Étape 1 : créer le video entry dans Bunny
    const createRes = await fetch('/api/bunny/create-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: lessonTitle || file.name }),
    })

    if (!createRes.ok) {
      const { error } = await createRes.json().catch(() => ({ error: 'Erreur serveur' }))
      setErrorMsg(error ?? 'Erreur lors de la création')
      setState('error')
      return
    }

    const { videoGuid, videoUrl } = await createRes.json()

    // Étape 2 : obtenir un token signé pour l'upload direct
    const tokenRes = await fetch(`/api/bunny/upload-proxy?guid=${videoGuid}`)
    if (!tokenRes.ok) {
      setErrorMsg('Impossible d\'obtenir le token d\'upload')
      setState('error')
      return
    }

    const { uploadUrl, authorizationSignature, authorizationExpire, libraryId } = await tokenRes.json()

    // Étape 3 : upload direct via XHR (PUT avec headers signés)
    setState('uploading')

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhrRef.current = xhr
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('AccessKey', '') // remplacé par le mécanisme signé ci-dessous
        xhr.setRequestHeader('AuthorizationSignature', authorizationSignature)
        xhr.setRequestHeader('AuthorizationExpire', String(authorizationExpire))
        xhr.setRequestHeader('VideoId', videoGuid)
        xhr.setRequestHeader('LibraryId', libraryId)
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => xhr.status < 400 ? resolve() : reject(new Error(`HTTP ${xhr.status}`))
        xhr.onerror = () => reject(new Error('Erreur réseau'))
        xhr.send(file)
      })

      setState('done')
      onSuccess(videoUrl, undefined)
    } catch (err) {
      console.error('[bunny upload]', err)
      setErrorMsg('Upload échoué. Vérifiez votre connexion et réessayez.')
      setState('error')
    }
  }

  function cancel() {
    xhrRef.current?.abort()
    setState('idle')
    setProgress(0)
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {state === 'idle' && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-[#0B3D91] hover:bg-blue-50 transition-colors cursor-pointer text-gray-500 hover:text-[#0B3D91]"
        >
          <Upload className="w-7 h-7" />
          <span className="text-sm font-medium">Cliquer pour uploader une vidéo</span>
          <span className="text-xs text-gray-400">MP4, MOV, AVI — max 4 Go</span>
        </button>
      )}

      {state === 'creating' && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl text-blue-700 text-sm">
          <Film className="w-5 h-5 animate-pulse flex-shrink-0" />
          <span>Préparation de l&apos;espace vidéo sur Bunny Stream…</span>
        </div>
      )}

      {state === 'uploading' && (
        <div className="p-4 bg-gray-50 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 font-medium truncate max-w-[200px]">{fileName}</span>
            <span className="text-[#0B3D91] font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-[#0B3D91] h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">Ne fermez pas cette page pendant l&apos;upload</p>
            <button type="button" onClick={cancel} className="text-xs text-red-500 hover:underline">Annuler</button>
          </div>
        </div>
      )}

      {state === 'done' && (
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl text-green-700 text-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Vidéo uploadée avec succès !</p>
            <p className="text-xs text-green-600 mt-0.5">Bunny Stream va traiter la vidéo (2–5 min). Elle sera disponible peu après.</p>
          </div>
          <button type="button" onClick={() => { setState('idle'); setProgress(0) }} className="p-1 hover:bg-green-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {state === 'error' && (
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Erreur d&apos;upload</p>
            <p className="text-xs text-red-600">{errorMsg}</p>
          </div>
          <button type="button" onClick={() => setState('idle')} className="text-xs underline flex-shrink-0">Réessayer</button>
        </div>
      )}
    </div>
  )
}
