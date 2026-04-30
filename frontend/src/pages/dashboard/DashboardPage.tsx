import { useAuthStore } from '@/store/authStore'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck, User as UserIcon, Mail, Calendar } from 'lucide-react'

export function DashboardPage() {
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">
          Welcome, {user?.username} 👋
        </h1>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="h-4 w-4 shrink-0" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <UserIcon className="h-4 w-4 shrink-0" />
                <span>@{user?.username}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>
                  Joined{' '}
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : '—'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Access Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
                    user?.role === 'admin'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {user?.role === 'admin' && <ShieldCheck className="h-4 w-4" />}
                  {user?.role}
                </span>
              </div>
              {user?.role === 'admin' && (
                <p className="mt-3 text-sm text-indigo-600 font-medium">
                  You have admin privileges. Access the user table from the Admin link above.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
