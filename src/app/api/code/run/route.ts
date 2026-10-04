import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Piston API — open source, gratuit, auto-hébergeable
const PISTON_URL = process.env.PISTON_API_URL ?? 'https://emkc.org/api/v2/piston'

const LANGUAGE_VERSIONS: Record<string, string> = {
  python:     '3.10.0',
  javascript: '18.15.0',
  typescript: '5.0.3',
  java:       '15.0.2',
  c:          '10.2.0',
  cpp:        '10.2.0',
  bash:       '5.2.0',
  rust:       '1.68.2',
  go:         '1.16.2',
  php:        '8.2.3',
  ruby:       '3.0.1',
  kotlin:     '1.8.20',
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const { lessonId, courseId, language, code, tests } = body

  if (!code || !language) {
    return NextResponse.json({ error: 'code et language requis' }, { status: 400 })
  }

  const version = LANGUAGE_VERSIONS[language]
  if (!version) {
    return NextResponse.json({ error: `Langage '${language}' non supporté` }, { status: 400 })
  }

  const startedAt = Date.now()

  // Récupérer le numéro de tentative
  let attemptNumber = 1
  if (lessonId) {
    const { count } = await supabase
      .from('code_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
    attemptNumber = (count ?? 0) + 1
  }

  // Exécuter via Piston
  let pistonResult: any
  try {
    const pistonRes = await fetch(`${PISTON_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language,
        version,
        files: [{ name: 'main', content: code }],
        stdin: '',
        args: [],
        run_timeout: 5000,
        compile_timeout: 10000,
        compile_memory_limit: -1,
        run_memory_limit: 128000000, // 128 MB
      }),
    })
    pistonResult = await pistonRes.json()
  } catch (e) {
    return NextResponse.json({ error: 'Moteur d\'exécution indisponible' }, { status: 503 })
  }

  const executionMs = Date.now() - startedAt
  const rawOutput = pistonResult.run?.stdout ?? ''
  const rawError  = pistonResult.run?.stderr ?? pistonResult.compile?.stderr ?? ''

  // Evaluer les tests si fournis
  let passedTests = 0
  let totalTests  = 0
  let testResults: { label: string; passed: boolean; expected: string; got: string }[] = []

  if (Array.isArray(tests) && tests.length > 0) {
    totalTests = tests.length
    // Pour chaque test : exécuter le code avec l'input du test
    for (const test of tests) {
      try {
        const testRes = await fetch(`${PISTON_URL}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language, version,
            files: [{ name: 'main', content: code }],
            stdin: test.input ?? '',
            run_timeout: 3000,
          }),
        })
        const testData = await testRes.json()
        const got = (testData.run?.stdout ?? '').trim()
        const passed = got === String(test.expected).trim()
        if (passed) passedTests++
        testResults.push({ label: test.label ?? `Test ${testResults.length + 1}`, passed, expected: String(test.expected), got })
      } catch {
        testResults.push({ label: test.label ?? `Test ${testResults.length + 1}`, passed: false, expected: String(test.expected), got: 'Erreur exécution' })
      }
    }
  }

  const allPassed = totalTests > 0 ? passedTests === totalTests : !rawError
  const status    = rawError && !rawOutput ? 'error' : allPassed ? 'passed' : 'failed'

  // Sauvegarder la soumission
  if (lessonId && courseId) {
    await supabase.from('code_submissions').insert({
      user_id:       user.id,
      lesson_id:     lessonId,
      course_id:     courseId,
      language,
      code,
      status,
      passed_tests:  passedTests,
      total_tests:   totalTests,
      output:        rawOutput,
      error_message: rawError || null,
      execution_ms:  executionMs,
      attempt_number: attemptNumber,
    })

    // Si tous les tests passent → marquer la leçon complète + XP
    if (status === 'passed') {
      await supabase.from('lesson_progress').upsert({
        user_id:      user.id,
        lesson_id:    lessonId,
        course_id:    courseId,
        is_completed: true,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,lesson_id' })

      await supabase.rpc('award_xp', {
        p_user_id:    user.id,
        p_event_type: 'assignment_passed',
        p_xp:         30,
        p_ref_id:     lessonId,
        p_ref_label:  'Exercice code réussi',
      })
    }
  }

  return NextResponse.json({
    status,
    output: rawOutput,
    error:  rawError || null,
    executionMs,
    passedTests,
    totalTests,
    testResults,
  })
}
