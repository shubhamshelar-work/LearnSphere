import { Link } from 'react-router-dom'
import { GraduationCap, Mail, MapPin } from 'lucide-react'

const CURRENT_YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="border-t border-primary-100 bg-primary-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500">
              <GraduationCap className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <span className="text-xl font-bold text-ink">
              Learn<span className="text-primary-500">Sphere</span>
            </span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            A modern online learning platform inspired by NPTEL. Explore structured courses,
            learn at your pace and test your knowledge with quizzes.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted">
            <Mail className="h-4 w-4 text-primary-500" aria-hidden="true" />
            support@learnsphere.example
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted">
            <MapPin className="h-4 w-4 text-primary-500" aria-hidden="true" />
            India
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-ink">Explore</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/courses" className="text-muted hover:text-primary-600">All Courses</Link></li>
            <li><Link to="/dashboard" className="text-muted hover:text-primary-600">Student Dashboard</Link></li>
            <li><Link to="/admin" className="text-muted hover:text-primary-600">Admin</Link></li>
            <li><Link to="/about" className="text-muted hover:text-primary-600">About Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-ink">Account</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/login" className="text-muted hover:text-primary-600">Login</Link></li>
            <li><Link to="/register" className="text-muted hover:text-primary-600">Sign Up</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-100 py-4 text-center text-xs text-muted">
        © {CURRENT_YEAR} LearnSphere. Built as a learning project prototype.
      </div>
    </footer>
  )
}
