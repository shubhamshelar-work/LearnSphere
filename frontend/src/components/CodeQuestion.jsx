import { useState } from 'react'
import { CheckCircle2, Code2, Loader2, Play, RotateCcw, Terminal, XCircle } from 'lucide-react'
import { didCodePass, runCodeQuestion } from '../utils/codeRunner'

export default function CodeQuestion({ question, code, onChange, result, onResult }) {
  const [running, setRunning] = useState(false)

  const languageLabel = question.language === 'sql' ? 'SQL' : 'JavaScript'

  async function handleRun() {
    setRunning(true)
    try {
      const response = await runCodeQuestion(question, code)
      onResult(response)
    } finally {
      setRunning(false)
    }
  }

  function handleReset() {
    onChange(question.starterCode)
    onResult(null)
  }

  const passedAll = didCodePass(result)

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-ink">
          <Code2 className="h-4 w-4 text-primary-500" aria-hidden="true" />
          Coding question — {languageLabel}
        </p>
        <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
          {question.language === 'sql' ? 'Pattern checked' : 'Runs in sandbox'}
        </span>
      </div>

      <label htmlFor={`code-${question.id}`} className="sr-only">
        Code editor for this question
      </label>
      <textarea
        id={`code-${question.id}`}
        value={code}
        spellCheck="false"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Tab') {
            event.preventDefault()
            const target = event.target
            const start = target.selectionStart
            const end = target.selectionEnd
            const next = `${code.slice(0, start)}  ${code.slice(end)}`
            onChange(next)
            requestAnimationFrame(() => {
              target.selectionStart = start + 2
              target.selectionEnd = start + 2
            })
          }
        }}
        rows={10}
        className="mt-2 w-full resize-y rounded-xl border border-primary-200 bg-ink px-4 py-3 font-mono text-sm leading-relaxed text-green-100 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Play className="h-4 w-4" aria-hidden="true" />
          )}
          {running ? 'Running…' : 'Run Code'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-primary-50"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset
        </button>
        {result && (
          <span
            className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
              passedAll ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {passedAll ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <XCircle className="h-4 w-4" aria-hidden="true" />
            )}
            {passedAll ? 'All tests passed' : 'Some tests failed'}
          </span>
        )}
      </div>

      {result && (
        <div className="mt-4 overflow-hidden rounded-xl border border-primary-100">
          <div className="flex items-center gap-2 border-b border-primary-100 bg-primary-50 px-4 py-2.5">
            <Terminal className="h-4 w-4 text-primary-600" aria-hidden="true" />
            <p className="text-sm font-semibold text-ink">Output</p>
          </div>

          {!result.ok && result.error && (
            <p className="border-b border-primary-100 bg-red-50 px-4 py-3 font-mono text-xs text-red-700">
              {result.error}
            </p>
          )}

          {result.results.length > 0 && (
            <ul className="divide-y divide-primary-100">
              {result.results.map((testResult) => (
                <li key={testResult.index} className="flex items-start gap-3 px-4 py-3">
                  {testResult.passed ? (
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-green-500"
                      aria-hidden="true"
                    />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                  )}
                  <div className="min-w-0 text-xs">
                    <p className="font-semibold text-ink">
                      {question.language === 'sql'
                        ? testResult.expected
                        : `Test ${testResult.index + 1}`}
                    </p>
                    {question.language !== 'sql' && (
                      <p className="mt-0.5 text-muted">
                        Expected <span className="font-mono text-ink">{testResult.expected}</span>,
                        got <span className="font-mono text-ink">{testResult.actual}</span>
                      </p>
                    )}
                    {question.language === 'sql' && !testResult.passed && (
                      <p className="mt-0.5 font-mono text-red-600">{testResult.actual}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
