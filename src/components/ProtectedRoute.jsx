import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * ProtectedRoute — wraps routes that require auth or a specific role.
 *
 * Props:
 *   children   — the route element to render if access is granted
 *   adminOnly  — if true, also requires user.role === 'admin'
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  // Show nothing while the auth session is being restored
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4A017] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Not logged in — send to /login, preserving the intended destination
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Logged in but not admin — redirect to home
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}
