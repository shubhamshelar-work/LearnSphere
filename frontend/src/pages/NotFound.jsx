import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="text-7xl font-bold text-primary-500">404</p>
      <h1 className="mt-4 text-2xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 text-muted">
        The page you are looking for does not exist or the link is outdated.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Home
      </Link>
    </section>
  )
}
