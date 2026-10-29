import { useEffect, useMemo, useState } from 'react'
import { courseService } from '../services/courseService'
import CourseCard from '../components/CourseCard'
import CourseFilters from '../components/CourseFilters'
import EmptyState from '../components/EmptyState'
import LoadingState from '../components/LoadingState'
import ErrorMessage from '../components/ErrorMessage'

export default function Courses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    category: 'All Categories',
    difficulty: 'All Levels',
  })

  function loadCourses() {
    setLoading(true)
    setError('')
    courseService
      .listCourses()
      .then((result) => setCourses(result))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCourses()
  }, [])

  const categories = useMemo(() => {
    const unique = new Set(courses.map((course) => course.category).filter(Boolean))
    return ['All Categories', ...unique]
  }, [courses])

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase()
    return courses.filter((course) => {
      const matchesSearch = !query || course.title.toLowerCase().includes(query)
      const matchesCategory =
        filters.category === 'All Categories' || course.category === filters.category
      const matchesDifficulty =
        filters.difficulty === 'All Levels' || course.difficulty === filters.difficulty
      return matchesSearch && matchesCategory && matchesDifficulty
    })
  }, [courses, filters])

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-ink">Course Catalog</h1>
        <p className="mt-2 text-muted">
          Browse all available courses. Use search and filters to narrow down your choices.
        </p>
      </div>

      <div className="mt-8">
        <CourseFilters filters={filters} onChange={setFilters} categories={categories} />
      </div>

      {loading ? (
        <LoadingState message="Loading courses…" />
      ) : error ? (
        <div className="mt-6">
          <ErrorMessage message={error} onRetry={loadCourses} />
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-muted" role="status">
            Showing {filtered.length} of {courses.length} courses
          </p>

          <div className="mt-4">
            {filtered.length === 0 ? (
              <EmptyState
                title="No courses match your filters"
                message="Try a different search term, or reset the category and difficulty filters."
                action={
                  <button
                    type="button"
                    onClick={() =>
                      setFilters({ search: '', category: 'All Categories', difficulty: 'All Levels' })
                    }
                    className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
                  >
                    Reset filters
                  </button>
                }
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
