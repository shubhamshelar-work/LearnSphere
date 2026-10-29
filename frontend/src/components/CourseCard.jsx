import { Link } from 'react-router-dom'
import { BookOpen, Clock, Signal, Star, Users } from 'lucide-react'

const difficultyStyles = {
  Beginner: 'bg-green-100 text-green-700',
  Intermediate: 'bg-primary-100 text-primary-700',
  Advanced: 'bg-red-100 text-red-700',
}

const FALLBACK_THUMBNAIL =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'

export default function CourseCard({ course }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <div className="relative h-44 overflow-hidden">
        <img
          src={course.thumbnail || FALLBACK_THUMBNAIL}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${
            difficultyStyles[course.difficulty] || 'bg-primary-100 text-primary-700'
          }`}
        >
          {course.difficulty}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-500">
          {course.category}
        </p>
        <h3 className="mt-1.5 text-lg font-semibold leading-snug text-ink">
          {course.title}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {course.instructor ? `By ${course.instructor}` : 'LearnSphere Faculty'}
        </p>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">
          {course.shortDescription}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-primary-500" aria-hidden="true" />
            {course.modules.length} modules
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-primary-500" aria-hidden="true" />
            {course.lessonCount} lessons
          </span>
          {course.rating != null && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-primary-500" aria-hidden="true" />
              {course.rating}
            </span>
          )}
          {course.enrolledStudents != null && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-primary-500" aria-hidden="true" />
              {course.enrolledStudents.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-primary-100 pt-4">
          <span className="flex items-center gap-1 text-xs font-medium text-muted">
            <Signal className="h-3.5 w-3.5" aria-hidden="true" />
            {course.difficulty}
          </span>
          <Link
            to={`/courses/${course.id}`}
            className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
          >
            View Course
          </Link>
        </div>
      </div>
    </article>
  )
}
