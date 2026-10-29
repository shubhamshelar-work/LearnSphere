import { CheckCircle2, FileText, Link as LinkIcon, PlayCircle } from 'lucide-react'
import VideoEmbed from './VideoEmbed'

export default function LessonViewer({
  lesson,
  module,
  isCompleted,
  saving,
  onMarkComplete,
  onMarkIncomplete,
}) {
  return (
    <article className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="rounded-full bg-primary-100 px-2.5 py-1 text-primary-700">
          {module.title}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-muted">
          {lesson.type === 'video' ? (
            <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {lesson.type === 'video' ? 'Video lesson' : 'Reading'} · {lesson.duration}
        </span>
      </div>

      <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">{lesson.title}</h1>

      {lesson.type === 'video' && (
        <div className="mt-5">
          <VideoEmbed url={lesson.videoUrl} title={lesson.title} />
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-500">
          Lesson Notes
        </h2>
        <p className="mt-3 whitespace-pre-line leading-relaxed text-ink">{lesson.content}</p>
      </div>

      {lesson.resources?.length > 0 && (
        <div className="mt-6 rounded-xl bg-primary-50 p-4">
          <h3 className="text-sm font-semibold text-ink">Additional Resources</h3>
          <ul className="mt-2 space-y-1.5">
            {lesson.resources.map((resource, index) => (
              <li key={`${resource.url}-${index}`}>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:underline"
                >
                  <LinkIcon className="h-4 w-4" aria-hidden="true" />
                  {resource.label || resource.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-7 border-t border-primary-100 pt-5">
        {isCompleted ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-medium text-green-700">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              You completed this lesson
            </p>
            <button
              type="button"
              onClick={onMarkIncomplete}
              disabled={saving}
              className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-primary-50 disabled:opacity-60"
            >
              Mark as not completed
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onMarkComplete}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Saving…' : 'Mark as Complete'}
          </button>
        )}
      </div>
    </article>
  )
}
