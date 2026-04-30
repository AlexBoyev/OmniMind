import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import type { User } from '@/types/user.types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function UsersAdminPage() {
  const [page, setPage] = useState(1)
  const pageSize = 10
  const qc = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users', page],
    queryFn: () => adminApi.listUsers(page, pageSize),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      adminApi.updateUser(id, { is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast({ title: 'User updated', variant: 'success' })
    },
    onError: () => {
      toast({ title: 'Update failed', variant: 'destructive' })
    },
  })

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">User Management</h1>

        {isLoading && <p className="text-slate-500">Loading users…</p>}
        {isError && <p className="text-red-600">Failed to load users.</p>}

        {data && (
          <>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['ID', 'Email', 'Username', 'Role', 'Active', 'Joined', 'Actions'].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((user: User) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-400">{user.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{user.email}</td>
                      <td className="px-4 py-3 text-slate-600">@{user.username}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            user.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant={user.is_active ? 'destructive' : 'outline'}
                          onClick={() =>
                            toggleMutation.mutate({ id: user.id, is_active: !user.is_active })
                          }
                          disabled={toggleMutation.isPending}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.total)} of{' '}
                {data.total}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
