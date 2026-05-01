import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'
import type { Role } from '@/types/auth.types'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Cpu } from 'lucide-react'

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
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [isAuthenticated, setAuth])

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 animate-pulse">
            <Cpu className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/403" replace />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 overflow-y-auto"
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
