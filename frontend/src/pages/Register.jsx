import { useState } from 'react'
import { Eye, EyeOff, GraduationCap, Lock, Mail, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  agree: false,
}

export default function Register() {
  const [formData, setFormData] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  function validate() {
    const nextErrors = {}
    if (!formData.name.trim()) {
      nextErrors.name = 'Full name is required.'
    } else if (formData.name.trim().length < 3) {
      nextErrors.name = 'Name must be at least 3 characters.'
    }
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
    if (formData.confirmPassword !== formData.password) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }
    if (!formData.agree) {
      nextErrors.agree = 'You must accept the terms to register.'
    }
    return nextErrors
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setServerError('')
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setServerError(error.message || 'Unable to create your account. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClasses = (hasError) =>
    `w-full rounded-lg border bg-white py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:ring-2 ${
      hasError
        ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
        : 'border-primary-200 focus:border-primary-500 focus:ring-primary-100'
    }`

  return (
    <section className="mx-auto flex max-w-md flex-col px-4 py-14 sm:px-6">
      <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500">
            <GraduationCap className="h-6 w-6 text-white" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-ink">Create your account</h1>
          <p className="mt-1 text-sm text-muted">Start learning with LearnSphere today.</p>
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
            <label htmlFor="reg-name" className="mb-1.5 block text-sm font-medium text-ink">
              Full name
            </label>
            <div className="relative">
              <User
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                id="reg-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Priya Verma"
                value={formData.name}
                onChange={handleChange}
                aria-invalid={Boolean(errors.name)}
                className={inputClasses(errors.name)}
              />
            </div>
            {errors.name && (
              <p className="mt-1.5 text-xs font-medium text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium text-ink">
              Email address
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
                className={inputClasses(errors.email)}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium text-ink">
              Password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                id="reg-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={handleChange}
                aria-invalid={Boolean(errors.password)}
                className={inputClasses(errors.password)}
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
              <p className="mt-1.5 text-xs font-medium text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="reg-confirm" className="mb-1.5 block text-sm font-medium text-ink">
              Confirm password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                id="reg-confirm"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                aria-invalid={Boolean(errors.confirmPassword)}
                className={inputClasses(errors.confirmPassword)}
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <div>
            <label className="flex items-start gap-2.5 text-sm text-muted">
              <input
                name="agree"
                type="checkbox"
                checked={formData.agree}
                onChange={handleChange}
                className="mt-0.5 h-4 w-4 accent-primary-500"
              />
              I agree to the terms of use and privacy policy.
            </label>
            {errors.agree && (
              <p className="mt-1.5 text-xs font-medium text-red-600">{errors.agree}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-primary-500 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  )
}
