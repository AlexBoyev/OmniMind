import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { OverviewPage } from '@/pages/OverviewPage'
import { SuperDashboardPage } from '@/pages/admin/SuperDashboardPage'
import { UsersAdminPage } from '@/pages/admin/UsersAdminPage'
import { AuditLogPage } from '@/pages/admin/AuditLogPage'
import { EnvManagerPage } from '@/pages/admin/EnvManagerPage'
import { SettingsPage } from '@/pages/admin/SettingsPage'
import { JarvisPage } from '@/pages/jarvis/JarvisPage'
import { JarvisWidget } from '@/components/jarvis/JarvisWidget'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/"         element={<Navigate to="/dashboard" replace />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/overview"  element={<ProtectedRoute><OverviewPage /></ProtectedRoute>} />
        <Route path="/jarvis"    element={<ProtectedRoute><JarvisPage /></ProtectedRoute>} />

        <Route path="/admin"           element={<Navigate to="/admin/overview" replace />} />
        <Route path="/admin/overview"  element={<ProtectedRoute requiredRole="admin"><SuperDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/users"     element={<ProtectedRoute requiredRole="admin"><UsersAdminPage /></ProtectedRoute>} />
        <Route path="/admin/audit-log" element={<ProtectedRoute requiredRole="admin"><AuditLogPage /></ProtectedRoute>} />
        <Route path="/admin/env"       element={<ProtectedRoute requiredRole="admin"><EnvManagerPage /></ProtectedRoute>} />
        <Route path="/admin/settings"  element={<ProtectedRoute requiredRole="admin"><SettingsPage /></ProtectedRoute>} />

        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="*"    element={<NotFoundPage />} />
      </Routes>
      {import.meta.env.VITE_ENABLE_JARVIS === 'true' && <JarvisWidget />}
    </>
  )
}
