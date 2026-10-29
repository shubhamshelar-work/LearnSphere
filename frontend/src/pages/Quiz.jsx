import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Home,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from 'lucide-react'
import { quizService } from '../services/quizService'
import QuizQuestion from '../components/QuizQuestion'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'

const integrityInstructions = [
  'Copying, cutting and right-click are disabled on quiz questions to discourage searching answers online.',
  'Answer one question at a time. Your choices are saved to the server automatically.',
  'The countdown timer automatically submits the quiz when it reaches zero.',
  'If you leave this tab, the event is recorded and you will see a warning.',
  'Grading happens on the server — your result appears only after you submit.',
]

export default function Quiz() {
  const { courseId, moduleId } = useParams()

  const [phase, setPhase] = useState('loading') // loading | instructions | attempt | confirm | results | unavailable
  const [quizMeta, setQuizMeta] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [result, setResult] = useState(null)
  const [actionError, setActionError] = useState('')
  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [tabWarning, setTabWarning] = useState(false)

  const timerRef = useRef(null)
  const answersRef = useRef(answers)
  answersRef.current = answers

  // Load quiz metadata for this module.
  useEffect(() => {
    let active = true
    setPhase('loading')
    quizService
      .getQuizByModule(courseId, moduleId)
      .then((meta) => {
        if (!active) return
        setQuizMeta(meta)
        setPhase('instructions')
      })
      .catch(() => {
        if (!active) return
        setQuizMeta(null)
        setPhase('unavailable')
      })
    return () => {
      active = false
    }
  }, [courseId, moduleId])

  // Countdown timer, driven by the server-issued remaining seconds.
  useEffect(() => {
    if (phase !== 'attempt' && phase !== 'confirm') return undefined
    if (secondsLeft <= 0) return undefined
    timerRef.current = setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1))
    }, 1000)
    return () => clearInterval(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Auto-submit when the timer reaches zero.
  useEffect(() => {
    if ((phase === 'attempt' || phase === 'confirm') && secondsLeft === 0) {
      submitQuiz(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase])

  // Record tab switches as an integrity signal.
  useEffect(() => {
    if (phase !== 'attempt' && phase !== 'confirm') return undefined
    function handleVisibility() {
      if (document.hidden) {
        setTabWarning(true)
        if (attempt?.attemptId) {
          quizService.recordEvent(attempt.attemptId).catch(() => {})
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [phase, attempt])

  // Autosave answers while the attempt is open.
  useEffect(() => {
    if (phase !== 'attempt' || !attempt?.attemptId) return undefined
    const handle = setTimeout(() => {
      quizService.saveAnswers(attempt.attemptId, answers).catch(() => {})
    }, 700)
    return () => clearTimeout(handle)
  }, [answers, phase, attempt])

  if (phase === 'loading') {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <LoadingState message="Loading quiz…" />
      </section>
    )
  }

  if (phase === 'unavailable' || !quizMeta) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Quiz not available"
          message="No quiz has been published for this module yet."
          action={
            <Link
              to="/courses"
              className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
            >
              Browse courses
            </Link>
          }
        />
      </section>
    )
  }

  const totalQuestions = attempt?.questions.length || quizMeta.questionCount
  const currentQuestion = attempt?.questions[currentIndex]
  const answeredCount = attempt
    ? attempt.questions.filter((question) => Boolean(answers[question._id])).length
    : 0

  async function startQuiz() {
    setActionError('')
    setStarting(true)
    try {
      const data = await quizService.startAttempt(quizMeta._id)
      setAttempt(data.attempt)
      setAnswers(data.attempt.answers || {})
      setSecondsLeft(data.attempt.secondsLeft)
      setCurrentIndex(0)
      setResult(null)
      setTabWarning(false)
      setPhase('attempt')
    } catch (err) {
      setActionError(err.message || 'Unable to start the quiz.')
    } finally {
      setStarting(false)
    }
  }

  function selectOption(optionId) {
    setAnswers((prev) => ({ ...prev, [currentQuestion._id]: optionId }))
  }

  async function submitQuiz(autoSubmitted = false) {
    if (!attempt?.attemptId || phase === 'results' || submitting) return
    clearInterval(timerRef.current)
    setSubmitting(true)
    try {
      const finalAnswers = autoSubmitted ? answersRef.current : answers
      const data = await quizService.submitAttempt(attempt.attemptId, finalAnswers)
      setResult({ ...data, autoSubmitted })
      setPhase('results')
    } catch (err) {
      setActionError(err.message || 'Unable to submit the quiz.')
      setPhase('attempt')
    } finally {
      setSubmitting(false)
    }
  }

  function restartQuiz() {
    setPhase('instructions')
    setAttempt(null)
    setCurrentIndex(0)
    setAnswers({})
    setResult(null)
    setActionError('')
  }

  if (phase === 'instructions') {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm sm:p-8">
          <span className="inline-flex rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
            Module quiz
          </span>
          <h1 className="mt-4 text-2xl font-bold text-ink sm:text-3xl">{quizMeta.title}</h1>
          {quizMeta.description && (
            <p className="mt-2 text-sm leading-relaxed text-muted">{quizMeta.description}</p>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-primary-50 p-4">
              <p className="text-xs font-medium text-muted">Questions</p>
              <p className="mt-1 text-lg font-bold text-ink">{quizMeta.questionCount}</p>
            </div>
            <div className="rounded-xl bg-primary-50 p-4">
              <p className="text-xs font-medium text-muted">Time limit</p>
              <p className="mt-1 text-lg font-bold text-ink">{quizMeta.timeLimit} min</p>
            </div>
            <div className="rounded-xl bg-primary-50 p-4">
              <p className="text-xs font-medium text-muted">Pass mark</p>
              <p className="mt-1 text-lg font-bold text-ink">{quizMeta.passingPercentage}%</p>
            </div>
            <div className="rounded-xl bg-primary-50 p-4">
              <p className="text-xs font-medium text-muted">Attempts</p>
              <p className="mt-1 text-lg font-bold text-ink">
                {quizMeta.attemptLimit > 0 ? quizMeta.attemptLimit : '∞'}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-primary-200 bg-primary-50 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <ShieldAlert className="h-4 w-4 text-primary-600" aria-hidden="true" />
              Quiz integrity instructions
            </h2>
            <ul className="mt-3 space-y-2">
              {integrityInstructions.map((instruction) => (
                <li
                  key={instruction}
                  className="flex items-start gap-2 text-sm leading-relaxed text-muted"
                >
                  <AlertTriangle
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-500"
                    aria-hidden="true"
                  />
                  {instruction}
                </li>
              ))}
            </ul>
          </div>

          {actionError && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
              {actionError}
            </p>
          )}

          <button
            type="button"
            onClick={startQuiz}
            disabled={starting}
            className="mt-6 w-full rounded-xl bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 disabled:opacity-60 sm:w-auto"
          >
            {starting ? 'Starting…' : 'Start Quiz'}
          </button>
        </div>
      </section>
    )
  }

  if (phase === 'results' && result) {
    const { result: graded, details } = result
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-primary-100 bg-white p-6 text-center shadow-sm sm:p-10">
          {graded.passed ? (
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" aria-hidden="true" />
          ) : (
            <XCircle className="mx-auto h-16 w-16 text-red-500" aria-hidden="true" />
          )}
          <h1 className="mt-4 text-2xl font-bold text-ink">
            {graded.passed ? 'Congratulations, you passed!' : 'You did not pass this time'}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {result.autoSubmitted
              ? 'Time ran out, so the quiz was auto-submitted with your saved answers.'
              : 'Here is how you performed on this module quiz.'}
          </p>

          <div className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-3">
            <div className="rounded-xl bg-primary-50 p-4">
              <p className="text-2xl font-bold text-primary-500">
                {graded.score}/{graded.totalMarks}
              </p>
              <p className="mt-1 text-xs font-medium text-muted">Score</p>
            </div>
            <div className="rounded-xl bg-primary-50 p-4">
              <p className="text-2xl font-bold text-primary-500">{graded.percentage}%</p>
              <p className="mt-1 text-xs font-medium text-muted">Percentage</p>
            </div>
            <div className="rounded-xl bg-primary-50 p-4">
              <p
                className={`text-2xl font-bold ${graded.passed ? 'text-green-600' : 'text-red-600'}`}
              >
                {graded.passed ? 'Pass' : 'Fail'}
              </p>
              <p className="mt-1 text-xs font-medium text-muted">Result</p>
            </div>
          </div>

          {details?.length > 0 && (
            <div className="mt-8 text-left">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Question breakdown
              </h2>
              <ul className="mt-3 space-y-2">
                {details.map((item, index) => (
                  <li
                    key={item.questionId}
                    className="flex items-start gap-3 rounded-xl border border-primary-100 p-3"
                  >
                    {item.isCorrect ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" aria-hidden="true" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-ink">
                        <span className="font-semibold">Q{index + 1}.</span> {item.questionText}
                      </p>
                      {item.explanation && (
                        <p className="mt-1 text-xs leading-relaxed text-muted">
                          {item.explanation}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={restartQuiz}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retake Quiz
            </button>
            <Link
              to={`/courses/${courseId}`}
              className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-white px-5 py-2.5 text-sm font-semibold text-primary-600 hover:bg-primary-50"
            >
              <Award className="h-4 w-4" aria-hidden="true" />
              Back to Course
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-white px-5 py-2.5 text-sm font-semibold text-primary-600 hover:bg-primary-50"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              Dashboard
            </Link>
          </div>
        </div>
      </section>
    )
  }

  if (submitting) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <LoadingState message="Submitting and grading your answers…" />
      </section>
    )
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const timerDanger = secondsLeft <= 60

  return (
    <section
      className="mx-auto max-w-3xl px-4 py-10 sm:px-6"
      onCopy={(event) => event.preventDefault()}
      onCut={(event) => event.preventDefault()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="mb-5 flex items-center justify-between rounded-xl border border-primary-100 bg-white px-4 py-3 shadow-sm">
        <div>
          <h1 className="text-sm font-semibold text-ink">{attempt?.title || quizMeta.title}</h1>
          <p className="text-xs text-muted">
            Answered {answeredCount} of {totalQuestions}
          </p>
        </div>
        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold ${
            timerDanger ? 'bg-red-50 text-red-600' : 'bg-primary-50 text-primary-600'
          }`}
          role="timer"
          aria-live="polite"
        >
          <Clock className="h-4 w-4" aria-hidden="true" />
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-xs text-muted">
        <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-primary-500" aria-hidden="true" />
        Copying question text and right-click are disabled during this quiz.
      </div>

      {tabWarning && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Tab switch detected. Stay on this page during the quiz.
        </div>
      )}

      {actionError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {actionError}
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2" role="navigation" aria-label="Question navigator">
        {attempt.questions.map((question, index) => {
          const isAnswered = Boolean(answers[question._id])
          const isCurrent = index === currentIndex
          return (
            <button
              key={question._id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to question ${index + 1}`}
              aria-current={isCurrent ? 'true' : undefined}
              className={`h-9 w-9 rounded-lg text-xs font-bold transition-colors ${
                isCurrent
                  ? 'bg-primary-500 text-white'
                  : isAnswered
                    ? 'bg-primary-100 text-primary-700'
                    : 'border border-primary-200 bg-white text-muted hover:bg-primary-50'
              }`}
            >
              {index + 1}
            </button>
          )
        })}
      </div>

      <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm sm:p-8">
        <QuizQuestion
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          totalQuestions={totalQuestions}
          selectedOptionId={answers[currentQuestion._id]}
          onSelect={selectOption}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((index) => index - 1)}
          className="rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous Question
        </button>

        {currentIndex === totalQuestions - 1 ? (
          <button
            type="button"
            onClick={() => setPhase('confirm')}
            className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
          >
            Submit Quiz
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentIndex((index) => index + 1)}
            className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
          >
            Next Question
          </button>
        )}
      </div>

      {phase === 'confirm' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="confirm-title" className="text-lg font-bold text-ink">
              Submit quiz?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              You have completed {answeredCount} of {totalQuestions} questions. Once submitted you
              cannot change your answers.
            </p>
            {answeredCount < totalQuestions && (
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-red-600">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                {totalQuestions - answeredCount} question(s) still unanswered.
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPhase('attempt')}
                className="rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-50"
              >
                Keep answering
              </button>
              <button
                type="button"
                onClick={() => submitQuiz(false)}
                className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
