// components/AdminRoute.jsx
// Allows only admins through. Also requires a session first.

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingState from './LoadingState'
import EmptyState from './EmptyState'
import { Link } from 'react-router-dom'

export default function AdminRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <LoadingState message="Checking your session…" />
      </section>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Admins only"
          message="Your account does not have permission to open the admin dashboard."
          action={
            <Link
              to="/dashboard"
              className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
            >
              Back to dashboard
            </Link>
          }
        />
      </section>
    )
  }

  return <Outlet />
}
