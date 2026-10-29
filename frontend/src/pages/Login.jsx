import { useState } from 'react'
import { Eye, EyeOff, GraduationCap, Lock, Mail } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from || '/dashboard'

  function validate() {
    const nextErrors = {}
    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }
    if (!formData.password) {
      nextErrors.password = 'Password is required.'
    } else if (formData.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.'
    }
    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setServerError('')
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      await login({ email: formData.email, password: formData.password })
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setServerError(error.message || 'Unable to sign in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <section className="mx-auto flex max-w-md flex-col px-4 py-14 sm:px-6">
      <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500">
            <GraduationCap className="h-6 w-6 text-white" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-ink">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">Sign in to continue learning.</p>
        </div>

        {serverError && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {serverError}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-ink">
              Email address
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
                className={`w-full rounded-lg border bg-white py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:ring-2 ${
                  errors.email
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-primary-200 focus:border-primary-500 focus:ring-primary-100'
                }`}
              />
            </div>
            {errors.email && (
              <p id="login-email-error" className="mt-1.5 text-xs font-medium text-red-600">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-ink">
              Password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
                className={`w-full rounded-lg border bg-white py-2.5 pl-9 pr-11 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:ring-2 ${
                  errors.password
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-primary-200 focus:border-primary-500 focus:ring-primary-100'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted hover:text-primary-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p id="login-password-error" className="mt-1.5 text-xs font-medium text-red-600">
                {errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-primary-500 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Do not have an account?{' '}
          <Link to="/register" className="font-semibold text-primary-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </section>
  )
}
