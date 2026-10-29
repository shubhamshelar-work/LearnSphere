// components/ProtectedRoute.jsx
// Sends unauthenticated visitors to /login (remembering where they wanted to
// go) and waits for the session check to finish before deciding.

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingState from './LoadingState'

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
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

  return <Outlet />
}
