import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { GraduationCap, LogOut, Menu, ShieldCheck, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/courses', label: 'Courses' },
  { to: '/about', label: 'About' },
]

const linkClasses = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-primary-50 text-primary-600' : 'text-muted hover:text-primary-600'
  }`

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    setOpen(false)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-primary-100 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6" aria-label="Main">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500">
            <GraduationCap className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
          <span className="text-xl font-bold text-ink">
            Learn<span className="text-primary-500">Sphere</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClasses} end={link.to === '/'}>
              {link.label}
            </NavLink>
          ))}
          {isAuthenticated && (
            <NavLink to="/dashboard" className={linkClasses}>
              Dashboard
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={linkClasses}>
              Admin
            </NavLink>
          )}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              <span className="flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700">
                {isAdmin && <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
                {user?.name?.split(' ')[0]}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 px-4 py-2 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-ink hover:bg-primary-50 md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-primary-100 bg-white px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={linkClasses}
                end={link.to === '/'}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            {isAuthenticated && (
              <NavLink to="/dashboard" className={linkClasses} onClick={() => setOpen(false)}>
                Dashboard
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={linkClasses} onClick={() => setOpen(false)}>
                Admin
              </NavLink>
            )}

            <div className="mt-2 flex gap-2">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary-200 px-4 py-2 text-center text-sm font-semibold text-primary-600"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-lg border border-primary-200 px-4 py-2 text-center text-sm font-semibold text-primary-600"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-lg bg-primary-500 px-4 py-2 text-center text-sm font-semibold text-white"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
