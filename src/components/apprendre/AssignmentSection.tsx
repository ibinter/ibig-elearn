'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, Send, CheckCircle, Clock, AlertCircle, FileText, XCircle, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Assignment {
  id: string
  title: string
  instructions: string
  submission_type: 'file' | 'text' | 'both'
  max_score: number
  passing_score: number
  deadline_hours?: number
}

interface Submission {
  id: string
  status: 'submitted' | 'reviewing' | 'graded' | 'rejected'
  score?: number
  feedback?: string
  text_content?: string
  file_url?: string
  file_name?: string
  submitted_at: string
  graded_at?: string
}

interface Props {
  assignment: Assignment
  lessonId: string
  courseId: string
  userId: string
  existingSubmission?: Submission | null
}

const statusConfig = {
  submitted:  { label: 'Soumis — en attente de correction', color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-700/50', icon: Clock },
  reviewing:  { label: 'En cours de correction', color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-700/50', icon: Clock },
  graded:     { label: 'Noté', color: 'text-green-400', bg: 'bg-green-900/20 border-green-700/50', icon: CheckCircle },
  rejected:   { label: 'À refaire', color: 'text-red-400', bg: 'bg-red-900/20 border-red-700/50', icon: XCircle },
}

export default function AssignmentSection({ assignment, lessonId, courseId, userId, existingSubmission }: Props) {
  const [submission, setSubmission] = useState<Submission | null>(existingSubmission ?? null)
  const [textContent, setTextContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 20 * 1024 * 1024) { setError('Fichier trop grand (max 20 Mo)'); return }
    setFile(f)
    setError('')
  }

  const handleSubmit = async () => {
    if (assignment.submission_type === 'text' && !textContent.trim()) {
      setError('Veuillez rédiger votre réponse')
      return
    }
    if (assignment.submission_type === 'file' && !file) {
      setError('Veuillez joindre un fichier')
      return
    }

    setLoading(true)
    setError('')

    try {
      let fileUrl: string | null = null
      let fileName: string | null = null
      let fileSize: number | null = null

      if (file) {
        const ext = file.name.split('.').pop()
        const path = `assignments/${courseId}/${userId}/${lessonId}-${Date.now()}.${ext}`
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('course-assets')
          .upload(path, file, { upsert: true })
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('course-assets').getPublicUrl(path)
        fileUrl = publicUrl
        fileName = file.name
        fileSize = file.size
      }

      const { data, error: dbError } = await supabase
        .from('assignment_submissions')
        .upsert({
          assignment_id: assignment.id,
          lesson_id: lessonId,
          course_id: courseId,
          user_id: userId,
          text_content: textContent || null,
          file_url: fileUrl,
          file_name: fileName,
          file_size_bytes: fileSize,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'assignment_id,user_id' })
        .select()
        .single()

      if (dbError) throw dbError
      setSubmission(data)
    } catch (e: any) {
      setError(e.message ?? 'Erreur lors de la soumission')
    } finally {
      setLoading(false)
    }
  }

  const isPassed = submission?.status === 'graded' && (submission.score ?? 0) >= assignment.passing_score

  return (
    <div className="space-y-5">
      {/* Instructions */}
      <div className="bg-gray-800 rounded-2xl p-5">
        <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#FFA500]" />
          {assignment.title}
        </h3>
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <span>Score max : <span className="text-white font-semibold">{assignment.max_score} pts</span></span>
          <span>Minimum requis : <span className="text-[#FFA500] font-semibold">{assignment.passing_score} pts</span></span>
          {assignment.deadline_hours && (
            <span>Délai de correction : <span className="text-white font-semibold">{assignment.deadline_hours}h</span></span>
          )}
        </div>
        <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap border-l-2 border-[#FFA500]/40 pl-4">
          {assignment.instructions}
        </div>
      </div>

      {/* Soumission existante */}
      {submission && (
        <div className={cn('rounded-2xl border p-5', statusConfig[submission.status].bg)}>
          <div className="flex items-center gap-2 mb-3">
            {(() => { const Icon = statusConfig[submission.status].icon; return <Icon className={cn('w-5 h-5', statusConfig[submission.status].color)} /> })()}
            <span className={cn('font-semibold', statusConfig[submission.status].color)}>
              {statusConfig[submission.status].label}
            </span>
            {submission.status === 'graded' && submission.score != null && (
              <span className={cn('ml-auto font-bold text-lg', isPassed ? 'text-green-400' : 'text-red-400')}>
                {submission.score}/{assignment.max_score}
              </span>
            )}
          </div>

          {submission.status === 'graded' && (
            <>
              <div className="mb-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', isPassed ? 'bg-green-500' : 'bg-red-500')}
                  style={{ width: `${((submission.score ?? 0) / assignment.max_score) * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-2 mb-2">
                {isPassed ? (
                  <span className="flex items-center gap-1.5 text-sm text-green-400">
                    <CheckCircle className="w-4 h-4" /> Devoir validé
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm text-red-400">
                    <XCircle className="w-4 h-4" /> Score insuffisant
                  </span>
                )}
              </div>
            </>
          )}

          {submission.feedback && (
            <div className="mt-3 p-3 bg-gray-800/80 rounded-xl text-sm text-gray-300">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Star className="w-3 h-3" /> Retour du formateur
              </p>
              <p className="whitespace-pre-wrap">{submission.feedback}</p>
            </div>
          )}

          {submission.file_name && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
              <FileText className="w-4 h-4" />
              {submission.file_url ? (
                <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="text-[#FFA500] hover:underline">
                  {submission.file_name}
                </a>
              ) : (
                <span>{submission.file_name}</span>
              )}
            </div>
          )}

          {(submission.status === 'rejected') && (
            <button
              onClick={() => setSubmission(null)}
              className="mt-3 text-sm text-gray-400 hover:text-white border border-gray-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              Soumettre à nouveau
            </button>
          )}
        </div>
      )}

      {/* Formulaire de soumission */}
      {!submission && (
        <div className="bg-gray-800 rounded-2xl p-5 space-y-4">
          <h4 className="text-white font-semibold">Votre soumission</h4>

          {(assignment.submission_type === 'text' || assignment.submission_type === 'both') && (
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Votre réponse rédigée</label>
              <textarea
                value={textContent}
                onChange={e => setTextContent(e.target.value)}
                placeholder="Rédigez votre réponse ici..."
                rows={8}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm resize-y focus:outline-none focus:border-[#0B3D91] placeholder-gray-600"
              />
              <p className="text-xs text-gray-600 mt-1">{textContent.length} caractères</p>
            </div>
          )}

          {(assignment.submission_type === 'file' || assignment.submission_type === 'both') && (
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Fichier joint (PDF, Word, images — max 20 Mo)</label>
              <div
                onClick={() => fileRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl px-6 py-8 text-center cursor-pointer transition-colors',
                  file ? 'border-green-500/50 bg-green-900/10' : 'border-gray-600 hover:border-gray-400 hover:bg-gray-700/30'
                )}
              >
                <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.zip" />
                {file ? (
                  <div className="flex items-center justify-center gap-3 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(1)} Mo)</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Cliquez pour choisir un fichier</p>
                    <p className="text-xs text-gray-600 mt-1">PDF, Word, PowerPoint, images, ZIP</p>
                  </>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/20 border border-red-700/50 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#FFA500] text-black font-bold rounded-xl hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                Soumettre mon devoir
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
