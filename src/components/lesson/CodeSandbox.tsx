'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Play, RotateCcw, CheckCircle, XCircle, Loader2, ChevronDown, ChevronRight, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import MarkdownContent from '@/components/apprendre/MarkdownContent'

// Monaco Editor chargé côté client uniquement (lourd)
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false, loading: () => (
  <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-gray-500 text-sm">
    Chargement de l&apos;éditeur…
  </div>
) })

const LANGUAGE_LABELS: Record<string, string> = {
  python: 'Python', javascript: 'JavaScript', typescript: 'TypeScript',
  java: 'Java', c: 'C', cpp: 'C++', bash: 'Bash', rust: 'Rust',
  go: 'Go', php: 'PHP', ruby: 'Ruby', kotlin: 'Kotlin',
}

interface Test { label: string; input?: string; expected: string }
interface TestResult { label: string; passed: boolean; expected: string; got: string }

interface Props {
  lessonId: string
  courseId: string
  language: string
  starterCode: string
  solutionCode?: string | null
  tests?: Test[]
  instructions?: string | null
}

export default function CodeSandbox({
  lessonId, courseId, language, starterCode, solutionCode, tests = [], instructions,
}: Props) {
  const [code, setCode] = useState(starterCode ?? '')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<{
    status: string; output: string; error: string | null
    executionMs: number; passedTests: number; totalTests: number
    testResults: TestResult[]
  } | null>(null)
  const [showSolution, setShowSolution] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [attempts, setAttempts] = useState(0)

  const runCode = useCallback(async () => {
    setRunning(true)
    setResult(null)
    try {
      const res = await fetch('/api/code/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, courseId, language, code, tests }),
      })
      const data = await res.json()
      setResult(data)
      setAttempts(a => a + 1)
    } catch {
      setResult({ status: 'error', output: '', error: 'Erreur réseau', executionMs: 0, passedTests: 0, totalTests: 0, testResults: [] })
    } finally {
      setRunning(false)
    }
  }, [lessonId, courseId, language, code, tests])

  const reset = () => {
    setCode(starterCode ?? '')
    setResult(null)
  }

  const passed = result?.status === 'passed'
  const failed = result?.status === 'failed' || result?.status === 'error'

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-120px)] min-h-[600px]">
      {/* Panneau gauche : instructions */}
      <div className="lg:w-[420px] flex-shrink-0 bg-gray-900 border-r border-gray-700 flex flex-col overflow-hidden">
        {/* Header instructions */}
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="flex items-center gap-2 px-4 py-3 border-b border-gray-700 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
        >
          <BookOpen className="w-4 h-4 text-[#FFA500]" />
          Instructions
          {showInstructions ? <ChevronDown className="w-4 h-4 ml-auto" /> : <ChevronRight className="w-4 h-4 ml-auto" />}
        </button>

        {showInstructions && instructions && (
          <div className="flex-1 overflow-y-auto p-4 prose prose-invert prose-sm max-w-none">
            <MarkdownContent content={instructions} />
          </div>
        )}

        {/* Tests */}
        {tests.length > 0 && (
          <div className="border-t border-gray-700 p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tests</p>
            {tests.map((test, i) => {
              const tr = result?.testResults?.[i]
              return (
                <div key={i} className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                  !tr ? 'bg-gray-800 text-gray-300'
                    : tr.passed ? 'bg-green-900/40 text-green-300'
                    : 'bg-red-900/40 text-red-300'
                )}>
                  {!tr ? <div className="w-3.5 h-3.5 rounded-full border border-gray-500" />
                    : tr.passed ? <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  }
                  <span className="truncate">{test.label}</span>
                  {tr && !tr.passed && (
                    <span className="text-xs text-red-400 ml-auto truncate">
                      attendu : {tr.expected}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Panneau droit : éditeur + console */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded font-mono">
              {LANGUAGE_LABELS[language] ?? language}
            </span>
            {attempts > 0 && (
              <span className="text-xs text-gray-500">{attempts} tentative{attempts > 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {solutionCode && attempts >= 3 && (
              <button
                onClick={() => setShowSolution(!showSolution)}
                className="text-xs text-[#FFA500] hover:underline"
              >
                {showSolution ? 'Masquer' : 'Voir la solution'}
              </button>
            )}
            <button
              onClick={reset}
              className="p-1.5 text-gray-400 hover:text-white transition-colors"
              title="Réinitialiser"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={runCode}
              disabled={running}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {running ? 'Exécution…' : 'Exécuter'}
            </button>
          </div>
        </div>

        {/* Éditeur Monaco */}
        <div className="flex-1 overflow-hidden">
          <MonacoEditor
            height="100%"
            language={language === 'cpp' ? 'cpp' : language}
            value={showSolution ? (solutionCode ?? code) : code}
            onChange={v => { if (!showSolution) setCode(v ?? '') }}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              roundedSelection: true,
              padding: { top: 12, bottom: 12 },
              readOnly: showSolution,
            }}
          />
        </div>

        {/* Console de sortie */}
        <div className={cn(
          'border-t transition-all',
          result ? 'h-44' : 'h-10',
          passed ? 'border-green-700 bg-green-950'
            : failed ? 'border-red-700 bg-red-950'
            : 'border-gray-700 bg-gray-900'
        )}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/50">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sortie</span>
            {result && (
              <div className="flex items-center gap-2">
                {passed && <span className="flex items-center gap-1 text-xs text-green-400 font-semibold"><CheckCircle className="w-3.5 h-3.5" /> Tous les tests passent !</span>}
                {failed && result.totalTests > 0 && <span className="text-xs text-red-400 font-semibold">{result.passedTests}/{result.totalTests} tests passés</span>}
                <span className="text-xs text-gray-500">{result.executionMs}ms</span>
              </div>
            )}
          </div>
          {result && (
            <div className="px-4 py-3 font-mono text-sm overflow-y-auto h-32">
              {result.error
                ? <pre className="text-red-400 whitespace-pre-wrap">{result.error}</pre>
                : <pre className="text-gray-200 whitespace-pre-wrap">{result.output || '(aucune sortie)'}</pre>
              }
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
