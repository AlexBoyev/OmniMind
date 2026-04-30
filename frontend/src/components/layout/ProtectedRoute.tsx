import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'
import type { Role } from '@/types/auth.types'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: Role
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const location = useLocation()
  const { user, isAuthenticated, setAuth } = useAuthStore()
  const [checking, setChecking] = useState(!isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) return

    authApi
      .me()
      .then((me) => {
        const token = useAuthStore.getState().accessToken ?? ''
        setAuth(token, me)
      })
      .catch(() => {
        // no valid session — will redirect below
      })
      .finally(() => setChecking(false))
  }, [isAuthenticated, setAuth])

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Loading...
      </div>
    )
  }

  if (!isAuthenticated && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/403" replace />
  }

  return <>{children}</>
}
