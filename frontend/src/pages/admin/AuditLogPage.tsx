import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi, type AuditLogEntry } from '@/api/admin'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'

const ACTION_OPTIONS = [
  'login', 'login_failed', 'logout', 'register',
  'user_updated', 'role_changed', 'user_disabled',
]

const ACTION_COLORS: Record<string, string> = {
  login: 'bg-green-100 text-green-800',
  logout: 'bg-slate-100 text-slate-700',
  register: 'bg-blue-100 text-blue-800',
  login_failed: 'bg-red-100 text-red-800',
  user_updated: 'bg-yellow-100 text-yellow-800',
  role_changed: 'bg-purple-100 text-purple-800',
  user_disabled: 'bg-orange-100 text-orange-800',
}

function ActionBadge({ action }: { action: string }) {
  const cls = ACTION_COLORS[action] ?? 'bg-slate-100 text-slate-700'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {action}
    </span>
  )
}

function ExpandableRow({ log }: { log: AuditLogEntry }) {
  const [open, setOpen] = useState(false)
  const hasExtra = log.metadata && Object.keys(log.metadata).length > 0

  return (
    <>
      <tr
        className={`border-b border-slate-100 text-sm hover:bg-slate-50 ${hasExtra ? 'cursor-pointer' : ''}`}
        onClick={() => hasExtra && setOpen((o) => !o)}
      >
        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
          {new Date(log.created_at).toLocaleString()}
        </td>
        <td className="px-4 py-3">
          <ActionBadge action={log.action} />
        </td>
        <td className="px-4 py-3 font-mono text-xs text-slate-500 truncate max-w-[120px]">
          {log.user_id ? log.user_id.slice(0, 8) + '…' : <span className="text-slate-300">—</span>}
        </td>
        <td className="px-4 py-3 text-slate-600">{log.ip_address}</td>
        <td className="px-4 py-3 text-slate-500 truncate max-w-[160px]">
          {log.resource_type
            ? `${log.resource_type}${log.resource_id ? ':' + log.resource_id.slice(0, 8) : ''}`
            : <span className="text-slate-300">—</span>}
        </td>
        <td className="px-4 py-3 text-right">
          {hasExtra && (
            open ? <ChevronUp className="inline h-4 w-4 text-slate-400" />
                 : <ChevronDown className="inline h-4 w-4 text-slate-400" />
          )}
        </td>
      </tr>
      {open && hasExtra && (
        <tr className="bg-slate-50 border-b border-slate-100">
          <td colSpan={6} className="px-8 py-3">
            <pre className="text-xs text-slate-600 overflow-x-auto">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  )
}

export function AuditLogPage() {
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const pageSize = 25

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'audit-log', page, actionFilter],
    queryFn: () =>
      adminApi.getAuditLog({
        page,
        size: pageSize,
        action: actionFilter || undefined,
      }),
  })

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
            <p className="mt-1 text-sm text-slate-500">
              Security event trail — {data?.total ?? 0} total events
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
            >
              <option value="">All actions</option>
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="py-20 text-center text-sm text-slate-500">Loading…</div>
          ) : isError ? (
            <div className="py-20 text-center text-sm text-red-500">Failed to load audit log.</div>
          ) : (
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {data?.logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-sm text-slate-400">
                      No audit events found.
                    </td>
                  </tr>
                ) : (
                  data?.logs.map((log) => <ExpandableRow key={log.id} log={log} />)
                )}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
