import { Search, SlidersHorizontal } from 'lucide-react'
import { categories as defaultCategories, difficulties } from '../data/courseOptions'

export default function CourseFilters({ filters, onChange, categories = defaultCategories }) {
  const selectClasses =
    'w-full rounded-lg border border-primary-200 bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100'

  return (
    <div className="rounded-2xl border border-primary-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-1">
          <label htmlFor="course-search" className="mb-1.5 block text-sm font-medium text-ink">
            Search
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              id="course-search"
              type="search"
              placeholder="Search by course name…"
              value={filters.search}
              onChange={(event) => onChange({ ...filters, search: event.target.value })}
              className="w-full rounded-lg border border-primary-200 bg-white py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>

        <div>
          <label htmlFor="course-category" className="mb-1.5 block text-sm font-medium text-ink">
            Category
          </label>
          <select
            id="course-category"
            value={filters.category}
            onChange={(event) => onChange({ ...filters, category: event.target.value })}
            className={selectClasses}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="course-difficulty" className="mb-1.5 block text-sm font-medium text-ink">
            Difficulty
          </label>
          <select
            id="course-difficulty"
            value={filters.difficulty}
            onChange={(event) => onChange({ ...filters, difficulty: event.target.value })}
            className={selectClasses}
          >
            {difficulties.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-primary-100 pt-4">
        <p className="flex items-center gap-2 text-sm text-muted">
          <SlidersHorizontal className="h-4 w-4 text-primary-500" aria-hidden="true" />
          Filters update results instantly
        </p>
        <button
          type="button"
          onClick={() => onChange({ search: '', category: 'All Categories', difficulty: 'All Levels' })}
          className="text-sm font-semibold text-primary-600 hover:underline"
        >
          Reset filters
        </button>
      </div>
    </div>
  )
}
