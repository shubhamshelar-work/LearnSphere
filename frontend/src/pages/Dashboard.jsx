import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  PlayCircle,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { courseService } from '../services/courseService'
import { progressService } from '../services/progressService'
import { quizService } from '../services/quizService'
import DashboardStatCard from '../components/DashboardStatCard'
import ProgressBar from '../components/ProgressBar'
import LoadingState from '../components/LoadingState'
import ErrorMessage from '../components/ErrorMessage'
import EmptyState from '../components/EmptyState'

const FALLBACK_THUMBNAIL =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function Dashboard() {
  const { user } = useAuth()
  const [enrolments, setEnrolments] = useState([])
  const [attempts, setAttempts] = useState([])
  const [catalogue, setCatalogue] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function loadDashboard() {
    setLoading(true)
    setError('')
    Promise.all([
      progressService.getMyProgress(),
      quizService.getMyAttempts(),
      courseService.listCourses().catch(() => []),
    ])
      .then(([loadedEnrolments, loadedAttempts, loadedCatalogue]) => {
        setEnrolments(loadedEnrolments)
        setAttempts(loadedAttempts)
        setCatalogue(loadedCatalogue)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const stats = useMemo(() => {
    const lessonsCompleted = enrolments.reduce(
      (total, item) => total + (item.progress?.completedLessons || 0),
      0,
    )
    const quizzesPassed = attempts.filter((attempt) => attempt.passed).length
    const averageScore = attempts.length
      ? Math.round(
          attempts.reduce((total, attempt) => total + (attempt.percentage || 0), 0) /
            attempts.length,
        )
      : 0

    return [
      {
        icon: <BookOpen className="h-5 w-5 text-primary-500" aria-hidden="true" />,
        label: 'Enrolled Courses',
        value: enrolments.length,
      },
      {
        icon: <CheckCircle2 className="h-5 w-5 text-primary-500" aria-hidden="true" />,
        label: 'Lessons Completed',
        value: lessonsCompleted,
      },
      {
        icon: <Award className="h-5 w-5 text-primary-500" aria-hidden="true" />,
        label: 'Quizzes Passed',
        value: quizzesPassed,
      },
      {
        icon: <TrendingUp className="h-5 w-5 text-primary-500" aria-hidden="true" />,
        label: 'Average Score',
        value: `${averageScore}%`,
      },
    ]
  }, [enrolments, attempts])

  const enrolledIds = useMemo(
    () => new Set(enrolments.map((item) => item.course?._id)),
    [enrolments],
  )
  const recommended = useMemo(
    () => catalogue.filter((course) => !enrolledIds.has(course._id)).slice(0, 3),
    [catalogue, enrolledIds],
  )

  const firstName = user?.name?.split(' ')[0] || 'there'

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <LoadingState message="Loading your dashboard…" />
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl bg-primary-500 px-6 py-8 sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-bold text-primary-600">
              {firstName.charAt(0).toUpperCase()}
            </span>
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Welcome back, {firstName}!
              </h1>
              <p className="mt-1 text-sm text-primary-100">
                Continue where you left off. You are doing great.
              </p>
            </div>
          </div>
          <Link
            to="/courses"
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary-600 shadow-sm hover:bg-primary-50"
          >
            Browse Courses
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-8">
          <ErrorMessage message={error} onRetry={loadDashboard} />
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <DashboardStatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">My Courses</h2>
            <Link to="/courses" className="text-sm font-semibold text-primary-600 hover:underline">
              Find more courses
            </Link>
          </div>

          {enrolments.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="You are not enrolled in any course yet"
                message="Browse the catalogue and start learning to see your progress here."
                action={
                  <Link
                    to="/courses"
                    className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
                  >
                    Browse courses
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {enrolments.map((item) => {
                const course = item.course
                const progress = item.progress
                const continueTo = progress.lastAccessedLesson
                  ? `/learn/${course._id}/${progress.lastAccessedLesson}`
                  : `/courses/${course._id}`
                return (
                  <div
                    key={course._id}
                    className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start gap-4">
                      <img
                        src={course.thumbnail || FALLBACK_THUMBNAIL}
                        alt=""
                        className="h-20 w-28 shrink-0 rounded-xl object-cover"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-ink">{course.title}</h3>
                            <p className="text-sm text-muted">
                              {course.instructor || 'LearnSphere Faculty'}
                            </p>
                          </div>
                          <span className="text-xs text-muted">
                            {progress.percent}% complete
                          </span>
                        </div>
                        <div className="mt-3">
                          <ProgressBar
                            value={progress.percent}
                            label={`${progress.completedLessons} of ${progress.totalLessons} lessons`}
                            size="sm"
                          />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3">
                          <Link
                            to={continueTo}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-600"
                          >
                            <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            Continue Learning
                          </Link>
                          <Link
                            to={`/courses/${course._id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 px-4 py-2 text-xs font-semibold text-primary-600 hover:bg-primary-50"
                          >
                            Course Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <h2 className="mt-10 text-lg font-bold text-ink">Recent Quiz Results</h2>
          {attempts.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No quiz attempts yet"
                message="Open a course and take a module quiz to see your results."
              />
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-primary-100 bg-primary-50 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Quiz</th>
                    <th className="px-5 py-3 font-semibold">Score</th>
                    <th className="px-5 py-3 font-semibold">Result</th>
                    <th className="hidden px-5 py-3 font-semibold sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {attempts.map((attempt) => (
                    <tr key={attempt._id}>
                      <td className="px-5 py-3.5 font-medium text-ink">{attempt.quizTitle}</td>
                      <td className="px-5 py-3.5 text-muted">
                        {attempt.score}/{attempt.totalMarks} ({attempt.percentage}%)
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            attempt.passed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {attempt.passed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="hidden px-5 py-3.5 text-muted sm:table-cell">
                        {formatDate(attempt.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside>
          <h2 className="text-lg font-bold text-ink">Recommended for you</h2>
          <div className="mt-4 rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <GraduationCap className="h-4 w-4 text-primary-500" aria-hidden="true" />
              Courses you might like
            </div>
            {recommended.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                You have enrolled in every available course. Well done!
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {recommended.map((course) => (
                  <li key={course._id}>
                    <Link
                      to={`/courses/${course._id}`}
                      className="flex items-center gap-3 rounded-xl border border-primary-100 p-3 transition-colors hover:bg-primary-50"
                    >
                      <img
                        src={course.thumbnail || FALLBACK_THUMBNAIL}
                        alt=""
                        className="h-12 w-16 rounded-lg object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{course.title}</p>
                        <p className="text-xs text-muted">{course.difficulty}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}
