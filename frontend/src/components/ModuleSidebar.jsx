import { CheckCircle2, FileText, PencilRuler, PlayCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProgressBar from './ProgressBar'

export default function ModuleSidebar({
  course,
  quizzes = [],
  currentLessonId,
  completedLessonIds,
  onSelectLesson,
}) {
  const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0)
  const progressPercent = totalLessons
    ? Math.round((completedLessonIds.length / totalLessons) * 100)
    : 0
  const quizModuleIds = new Set(quizzes.map((quiz) => quiz.moduleId))

  return (
    <aside className="flex h-full flex-col rounded-2xl border border-primary-100 bg-white shadow-sm">
      <div className="border-b border-primary-100 p-4">
        <h2 className="text-sm font-semibold text-ink">Course Content</h2>
        <p className="mt-0.5 text-xs text-muted">
          {course.modules.length} modules · {totalLessons} lessons
        </p>
        <div className="mt-3">
          <ProgressBar value={progressPercent} label="Your progress" size="sm" />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3" aria-label="Course modules">
        {course.modules.map((module, moduleIndex) => (
          <div key={module._id} className="mb-3 last:mb-0">
            <h3 className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              {moduleIndex + 1}. {module.title}
            </h3>
            <ul className="mt-1 space-y-1">
              {module.lessons.map((lesson) => {
                const isActive = lesson.id === currentLessonId
                const isCompleted = completedLessonIds.includes(lesson.id)
                return (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      onClick={() => onSelectLesson(lesson.id)}
                      className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                        isActive
                          ? 'bg-primary-500 text-white shadow-sm'
                          : 'text-ink hover:bg-primary-50'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {isCompleted ? (
                        <CheckCircle2
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-green-500'
                          }`}
                          aria-hidden="true"
                        />
                      ) : lesson.type === 'video' ? (
                        <PlayCircle
                          className={`mt-0.5 h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-primary-500'}`}
                          aria-hidden="true"
                        />
                      ) : (
                        <FileText
                          className={`mt-0.5 h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-primary-500'}`}
                          aria-hidden="true"
                        />
                      )}
                      <span className="flex-1 leading-snug">{lesson.title}</span>
                      <span
                        className={`mt-0.5 text-xs ${isActive ? 'text-primary-100' : 'text-muted'}`}
                      >
                        {lesson.duration}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>

            {quizModuleIds.has(module._id) && (
              <Link
                to={`/quiz/${course.id}/${module._id}`}
                className="mt-1.5 flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-primary-50 hover:text-primary-600"
              >
                <PencilRuler className="h-4 w-4 shrink-0 text-primary-500" aria-hidden="true" />
                Module {moduleIndex + 1} Quiz
              </Link>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}
