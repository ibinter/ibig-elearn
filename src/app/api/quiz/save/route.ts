import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['formateur', 'admin', 'coordinateur'].includes(profile?.role ?? ''))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { lessonId, courseId, questions, passingScore } = await req.json()

  // Verify ownership
  if (profile?.role === 'formateur') {
    const { data: course } = await supabase.from('courses').select('instructor_id').eq('id', courseId).single()
    if (course?.instructor_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Delete existing questions then re-insert
  await supabase.from('quiz_questions').delete().eq('lesson_id', lessonId)

  if (questions.length > 0) {
    const rows = questions.map((q: any, i: number) => ({
      lesson_id: lessonId,
      course_id: courseId,
      question: q.question,
      type: q.type,
      options: q.type === 'true_false' ? ['Vrai', 'Faux'] : q.options,
      correct_option: q.correct_option,
      explanation: q.explanation ?? null,
      position: i,
    }))
    const { error } = await supabase.from('quiz_questions').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update passing score on lesson
  await supabase.from('lessons').update({ quiz_passing_score: passingScore }).eq('id', lessonId)

  return NextResponse.json({ success: true, count: questions.length })
}
