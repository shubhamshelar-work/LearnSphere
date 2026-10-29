import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  PlayCircle,
  Signal,
  Star,
  Users,
} from 'lucide-react'
import { courseService } from '../services/courseService'
import { quizService } from '../services/quizService'
import { progressService } from '../services/progressService'
import { useAuth } from '../context/AuthContext'
import ProgressBar from '../components/ProgressBar'
import EmptyState from '../components/EmptyState'
import LoadingState from '../components/LoadingState'
import ErrorMessage from '../components/ErrorMessage'

export default function CourseDetails() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [course, setCourse] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    Promise.all([
      courseService.getCourse(courseId),
      quizService.getQuizzesByCourse(courseId).catch(() => []),
    ])
      .then(([loadedCourse, loadedQuizzes]) => {
        if (!active) return
        setCourse(loadedCourse)
        setQuizzes(loadedQuizzes)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [courseId])

  // Progress is only available to signed-in students.
  useEffect(() => {
    if (!isAuthenticated) {
      setProgress(null)
      return
    }
    let active = true
    progressService
      .getCourseProgress(courseId)
      .then((view) => {
        if (active) setProgress(view)
      })
      .catch(() => {
        if (active) setProgress(null)
      })
    return () => {
      active = false
    }
  }, [courseId, isAuthenticated])

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <LoadingState message="Loading course…" />
      </section>
    )
  }

  if (error || !course) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        {error ? (
          <ErrorMessage message={error} />
        ) : (
          <EmptyState
            title="Course not found"
            message="The course you are looking for does not exist or may have been removed."
            action={
              <Link
                to="/courses"
                className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
              >
                Browse all courses
              </Link>
            }
          />
        )}
      </section>
    )
  }

  const totalLessons = course.lessonCount
  const firstLesson = course.modules[0]?.lessons[0]
  const enrolled = Boolean(progress?.enrolled)
  const quizByModule = new Map(quizzes.map((quiz) => [quiz.moduleId, quiz]))

  // Where "Continue/Start Learning" should go.
  const resumeLessonId = progress?.lastAccessedLesson || firstLesson?.id

  async function handleStartLearning() {
    setActionError('')
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${courseId}` } })
      return
    }
    if (!enrolled) {
      setEnrolling(true)
      try {
        await courseService.enroll(courseId)
      } catch (err) {
        setActionError(err.message)
        setEnrolling(false)
        return
      }
      setEnrolling(false)
    }
    if (resumeLessonId) {
      navigate(`/learn/${course.id}/${resumeLessonId}`)
    }
  }

  return (
    <section>
      <div className="bg-primary-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <nav className="text-sm text-muted" aria-label="Breadcrumb">
            <Link to="/courses" className="hover:text-primary-600">
              Courses
            </Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-ink">{course.title}</span>
          </nav>

          <div className="mt-6 grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary-600 shadow-sm">
                {course.category}
              </span>
              <h1 className="mt-4 text-3xl font-bold leading-tight text-ink sm:text-4xl">
                {course.title}
              </h1>
              <p className="mt-3 max-w-2xl leading-relaxed text-muted">{course.description}</p>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                <span className="flex items-center gap-2 text-ink">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white">
                    {(course.instructor || 'L').charAt(0)}
                  </span>
                  {course.instructor || 'LearnSphere Faculty'}
                </span>
                <span className="flex items-center gap-1.5 text-muted">
                  <Signal className="h-4 w-4 text-primary-500" aria-hidden="true" />
                  {course.difficulty}
                </span>
                <span className="flex items-center gap-1.5 text-muted">
                  <Clock className="h-4 w-4 text-primary-500" aria-hidden="true" />
                  Self-paced
                </span>
                {course.rating != null && (
                  <span className="flex items-center gap-1.5 text-muted">
                    <Star className="h-4 w-4 text-primary-500" aria-hidden="true" />
                    {course.rating}
                  </span>
                )}
                {course.enrolledStudents != null && (
                  <span className="flex items-center gap-1.5 text-muted">
                    <Users className="h-4 w-4 text-primary-500" aria-hidden="true" />
                    {course.enrolledStudents.toLocaleString('en-IN')} enrolled
                  </span>
                )}
              </div>

              {actionError && (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
                  {actionError}
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleStartLearning}
                  disabled={enrolling || !firstLesson}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enrolling
                    ? 'Enrolling…'
                    : enrolled
                      ? 'Continue Learning'
                      : isAuthenticated
                        ? 'Start Learning'
                        : 'Sign in to start'}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                {course.modules[0] && quizByModule.get(course.modules[0]._id) && (
                  <Link
                    to={`/quiz/${course.id}/${course.modules[0]._id}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-white px-6 py-3 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50"
                  >
                    <Award className="h-4 w-4" aria-hidden="true" />
                    Take Module 1 Quiz
                  </Link>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-sm">
              <img
                src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'}
                alt=""
                className="h-48 w-full object-cover"
              />
              <div className="p-5">
                <h2 className="text-sm font-semibold text-ink">Course at a glance</h2>
                <ul className="mt-3 space-y-2.5 text-sm text-muted">
                  <li className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary-500" aria-hidden="true" />
                    {course.modules.length} modules · {totalLessons} lessons
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary-500" aria-hidden="true" />
                    Self-paced learning
                  </li>
                  <li className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary-500" aria-hidden="true" />
                    {quizzes.length} module quizzes
                  </li>
                </ul>
                {enrolled && progress && (
                  <div className="mt-5 border-t border-primary-100 pt-4">
                    <ProgressBar value={progress.percent} label="Your progress" size="sm" />
                    <p className="mt-2 text-xs text-muted">
                      {progress.completedLessons} of {progress.totalLessons} lessons completed
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {course.outcomes.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-ink">What you will learn</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {course.outcomes.map((outcome) => (
                  <li
                    key={outcome}
                    className="flex items-start gap-2.5 rounded-xl border border-primary-100 bg-white p-4 text-sm leading-relaxed text-ink shadow-sm"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" aria-hidden="true" />
                    {outcome}
                  </li>
                ))}
              </ul>
            </>
          )}

          <h2 className="mt-12 text-xl font-bold text-ink">Course content</h2>
          <p className="mt-1 text-sm text-muted">
            {course.modules.length} modules · {totalLessons} lessons total
          </p>
          <div className="mt-5 space-y-4">
            {course.modules.map((module, index) => {
              const moduleQuiz = quizByModule.get(module._id)
              return (
                <div
                  key={module._id}
                  className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-primary-100 bg-primary-50 px-5 py-3.5">
                    <h3 className="text-sm font-semibold text-ink">
                      {index + 1}. {module.title}
                    </h3>
                    <span className="text-xs font-medium text-muted">
                      {module.lessons.length} lessons
                    </span>
                  </div>
                  <ul className="divide-y divide-primary-100">
                    {module.lessons.map((lesson) => (
                      <li key={lesson._id}>
                        <Link
                          to={`/learn/${course.id}/${lesson._id}`}
                          className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-primary-50"
                        >
                          <span className="flex items-center gap-2.5 text-ink">
                            {lesson.type === 'video' ? (
                              <PlayCircle className="h-4 w-4 shrink-0 text-primary-500" aria-hidden="true" />
                            ) : (
                              <FileText className="h-4 w-4 shrink-0 text-primary-500" aria-hidden="true" />
                            )}
                            {lesson.title}
                          </span>
                          <span className="shrink-0 text-xs text-muted">{lesson.duration}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {moduleQuiz && (
                    <Link
                      to={`/quiz/${course.id}/${module._id}`}
                      className="flex items-center justify-between gap-3 border-t border-primary-100 bg-primary-50/60 px-5 py-3 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-100"
                    >
                      <span className="flex items-center gap-2">
                        <Award className="h-4 w-4 shrink-0" aria-hidden="true" />
                        Module {index + 1} Quiz
                      </span>
                      <span className="text-xs font-medium text-muted">
                        {moduleQuiz.questionCount} questions
                      </span>
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <aside>
          <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-ink">Meet your instructor</h3>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-lg font-bold text-white">
                {(course.instructor || 'L').charAt(0)}
              </span>
              <div>
                <p className="font-medium text-ink">{course.instructor || 'LearnSphere Faculty'}</p>
                <p className="text-xs text-muted">Faculty · LearnSphere</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Course content follows a university-style syllabus with weekly modules,
              practical assignments and a graded quiz.
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}
