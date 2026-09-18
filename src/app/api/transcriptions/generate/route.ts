import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['formateur', 'admin', 'coordinateur'].includes(profile?.role ?? ''))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { lessonId } = await req.json()

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, video_url, transcription_status')
    .eq('id', lessonId)
    .single()

  if (!lesson?.video_url) return NextResponse.json({ error: 'No video URL' }, { status: 400 })
  if (lesson.transcription_status === 'pending') return NextResponse.json({ error: 'Already processing' }, { status: 409 })

  // Mark as pending
  await supabase.from('lessons').update({ transcription_status: 'pending' }).eq('id', lessonId)

  const WHISPER_API_KEY = process.env.OPENAI_API_KEY
  if (!WHISPER_API_KEY) {
    await supabase.from('lessons').update({ transcription_status: 'error' }).eq('id', lessonId)
    return NextResponse.json({ error: 'Whisper API not configured' }, { status: 500 })
  }

  try {
    // Download video and send to Whisper
    const videoRes = await fetch(lesson.video_url)
    if (!videoRes.ok) throw new Error('Cannot fetch video')

    const videoBlob = await videoRes.blob()
    const formData = new FormData()
    formData.append('file', videoBlob, 'audio.mp4')
    formData.append('model', 'whisper-1')
    formData.append('language', 'fr')
    formData.append('response_format', 'verbose_json')

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${WHISPER_API_KEY}` },
      body: formData,
    })

    if (!whisperRes.ok) {
      const err = await whisperRes.text()
      throw new Error(`Whisper error: ${err}`)
    }

    const result = await whisperRes.json()
    const transcript = result.text

    // Build SRT subtitles from segments
    let srt = ''
    if (result.segments) {
      srt = result.segments.map((seg: any, i: number) => {
        const fmt = (s: number) => {
          const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60), ms = Math.round((s % 1) * 1000)
          return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')},${String(ms).padStart(3,'0')}`
        }
        return `${i + 1}\n${fmt(seg.start)} --> ${fmt(seg.end)}\n${seg.text.trim()}\n`
      }).join('\n')
    }

    // Store SRT as a text file — for now store inline in DB
    await supabase.from('lessons').update({
      transcript,
      subtitle_url: srt ? `data:text/plain;charset=utf-8,${encodeURIComponent(srt)}` : null,
      transcription_status: 'done',
    }).eq('id', lessonId)

    return NextResponse.json({ success: true, charCount: transcript.length })
  } catch (err: any) {
    await supabase.from('lessons').update({ transcription_status: 'error' }).eq('id', lessonId)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
