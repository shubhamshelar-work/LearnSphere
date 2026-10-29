import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Award, ChevronLeft, ChevronRight, PanelLeft } from 'lucide-react'
import { courseService } from '../services/courseService'
import { quizService } from '../services/quizService'
import { progressService } from '../services/progressService'
import ModuleSidebar from '../components/ModuleSidebar'
import LessonViewer from '../components/LessonViewer'
import EmptyState from '../components/EmptyState'
import LoadingState from '../components/LoadingState'
import ErrorMessage from '../components/ErrorMessage'

export default function Learning() {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [completedLessonIds, setCompletedLessonIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    Promise.all([
      courseService.getCourse(courseId),
      quizService.getQuizzesByCourse(courseId).catch(() => []),
      progressService.getCourseProgress(courseId).catch(() => null),
    ])
      .then(([loadedCourse, loadedQuizzes, progress]) => {
        if (!active) return
        setCourse(loadedCourse)
        setQuizzes(loadedQuizzes)
        setCompletedLessonIds(progress?.completedLessonIds || [])
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

  const context = useMemo(() => {
    if (!course) return null
    for (let m = 0; m < course.modules.length; m += 1) {
      const module = course.modules[m]
      const lessonIndex = module.lessons.findIndex((lesson) => lesson.id === lessonId)
      if (lessonIndex !== -1) {
        return { course, module, lesson: module.lessons[lessonIndex], moduleIndex: m, lessonIndex }
      }
    }
    return null
  }, [course, lessonId])

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <LoadingState message="Loading lesson…" />
      </section>
    )
  }

  if (error) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <ErrorMessage message={error} />
      </section>
    )
  }

  if (!context) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Lesson not found"
          message="This lesson does not exist. It may have been renamed or removed."
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

  const { module, lesson, moduleIndex, lessonIndex } = context
  const moduleQuiz = quizzes.find((quiz) => quiz.moduleId === module._id)

  const flatLessons = course.modules.flatMap((item) => item.lessons)
  const flatIndex = flatLessons.findIndex((item) => item.id === lesson.id)
  const previous = flatLessons[flatIndex - 1]
  const next = flatLessons[flatIndex + 1]
  const isCompleted = completedLessonIds.includes(lesson.id)
  const isLastLessonOfModule = lessonIndex === module.lessons.length - 1

  async function markComplete() {
    setActionError('')
    setSaving(true)
    try {
      const progress = await progressService.markLessonComplete(lesson.id, course.id)
      setCompletedLessonIds(progress.completedLessonIds || [])
    } catch (err) {
      setActionError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function markIncomplete() {
    setActionError('')
    setSaving(true)
    try {
      const progress = await progressService.markLessonIncomplete(lesson.id, course.id)
      setCompletedLessonIds(progress.completedLessonIds || [])
    } catch (err) {
      setActionError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function goToLesson(id) {
    navigate(`/learn/${course.id}/${id}`)
    setSidebarOpen(false)
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <nav className="text-sm text-muted" aria-label="Breadcrumb">
            <Link to="/courses" className="hover:text-primary-600">
              Courses
            </Link>
            <span className="mx-2">/</span>
            <Link to={`/courses/${course.id}`} className="hover:text-primary-600">
              {course.title}
            </Link>
          </nav>
          <p className="mt-1 text-xs text-muted">
            Module {moduleIndex + 1}: {module.title} · Lesson {lessonIndex + 1} of{' '}
            {module.lessons.length}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen((value) => !value)}
          className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm font-semibold text-primary-600 lg:hidden"
          aria-expanded={sidebarOpen}
        >
          <PanelLeft className="h-4 w-4" aria-hidden="true" />
          {sidebarOpen ? 'Hide content' : 'Course content'}
        </button>
      </div>

      {actionError && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
          {actionError}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)]">
            <div className="max-h-[70vh] lg:max-h-[calc(100vh-8rem)]">
              <ModuleSidebar
                course={course}
                quizzes={quizzes}
                currentLessonId={lesson.id}
                completedLessonIds={completedLessonIds}
                onSelectLesson={goToLesson}
              />
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <LessonViewer
            lesson={lesson}
            module={module}
            isCompleted={isCompleted}
            saving={saving}
            onMarkComplete={markComplete}
            onMarkIncomplete={markIncomplete}
          />

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={!previous}
              onClick={() => previous && goToLesson(previous.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Previous Lesson
            </button>

            {next ? (
              <button
                type="button"
                onClick={() => goToLesson(next.id)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
              >
                Next Lesson
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : moduleQuiz ? (
              <Link
                to={`/quiz/${course.id}/${module._id}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
              >
                <Award className="h-4 w-4" aria-hidden="true" />
                Take Module Quiz
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-4 py-2.5 text-sm font-semibold text-muted">
                Course completed
              </span>
            )}
          </div>

          {isLastLessonOfModule && moduleQuiz && (
            <div className="mt-6 rounded-2xl border border-primary-200 bg-primary-50 p-5">
              <h3 className="font-semibold text-ink">
                Done with Module {moduleIndex + 1}: {module.title}?
              </h3>
              <p className="mt-1 text-sm text-muted">
                Attempt the module quiz to check your understanding. It has{' '}
                {moduleQuiz.questionCount} questions and a {moduleQuiz.passingPercentage}% pass mark.
              </p>
              <Link
                to={`/quiz/${course.id}/${module._id}`}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
              >
                <Award className="h-4 w-4" aria-hidden="true" />
                Start Module Quiz
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
