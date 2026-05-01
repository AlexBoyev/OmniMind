import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  LogIn, LogOut, UserPlus, AlertCircle, Edit, Brain,
  Shield, Activity, ChevronDown, ChevronUp, Filter, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { adminApi, type AuditLogEntry } from '@/api/admin'
import { Button } from '@/components/ui/button'

const ACTION_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  login:              { icon: LogIn,       color: 'text-emerald-400', bg: 'bg-emerald-500/15', label: 'Login' },
  login_failed:       { icon: AlertCircle, color: 'text-red-400',     bg: 'bg-red-500/15',     label: 'Failed Login' },
  logout:             { icon: LogOut,      color: 'text-sky-400',     bg: 'bg-sky-500/15',     label: 'Logout' },
  register:           { icon: UserPlus,    color: 'text-violet-400',  bg: 'bg-violet-500/15',  label: 'Register' },
  user_updated:       { icon: Edit,        color: 'text-amber-400',   bg: 'bg-amber-500/15',   label: 'User Updated' },
  jarvis_chat:        { icon: Brain,       color: 'text-primary',     bg: 'bg-primary/15',     label: 'Jarvis Chat' },
  env_vars_updated:   { icon: Shield,      color: 'text-orange-400',  bg: 'bg-orange-500/15',  label: 'Env Updated' },
}

const DEFAULT = { icon: Activity, color: 'text-muted-foreground', bg: 'bg-accent', label: 'Event' }

const ACTION_OPTIONS = Object.keys(ACTION_CONFIG)

function LogEntry({ log }: { log: AuditLogEntry }) {
  const [open, setOpen] = useState(false)
  const cfg = ACTION_CONFIG[log.action] ?? DEFAULT
  const Icon = cfg.icon
  const hasExtra = log.metadata && Object.keys(log.metadata).length > 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative flex gap-4 pl-4"
    >
      {/* Timeline dot */}
      <div className={`absolute left-0 top-2.5 h-2.5 w-2.5 rounded-full border-2 border-background ${cfg.color.replace('text-', 'bg-')}`} />

      <div className="flex-1 pb-4">
        <div
          className={`rounded-xl border border-border bg-card p-3.5 ${hasExtra ? 'cursor-pointer hover:border-border/80' : ''} transition-colors`}
          onClick={() => hasExtra && setOpen(o => !o)}
        >
          <div className="flex items-start gap-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}>
              <Icon className={`h-4 w-4 ${cfg.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground">{cfg.label}</span>
                <code className="text-xs font-mono text-muted-foreground">{log.action}</code>
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <span>{log.ip_address}</span>
                {log.user_id && <span className="font-mono truncate max-w-[120px]">{log.user_id.slice(0, 8)}…</span>}
                {log.resource_type && <span>{log.resource_type}{log.resource_id ? ':' + log.resource_id.slice(0, 8) : ''}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <time className="text-xs text-muted-foreground">{format(new Date(log.created_at), 'HH:mm:ss')}</time>
              {hasExtra && (open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />)}
            </div>
          </div>

          {open && hasExtra && (
            <pre className="mt-3 overflow-x-auto rounded-lg bg-background p-3 text-xs font-mono text-muted-foreground">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function AuditLogPage() {
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const pageSize = 25

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'audit-log', page, actionFilter],
    queryFn: () => adminApi.getAuditLog({ page, size: pageSize, action: actionFilter || undefined }),
  })

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0

  const grouped = (data?.logs ?? []).reduce<Record<string, AuditLogEntry[]>>((acc, log) => {
    const day = format(new Date(log.created_at), 'MMM d, yyyy')
    if (!acc[day]) acc[day] = []
    acc[day].push(log)
    return acc
  }, {})

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} total events</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <select
            className="input-dark pl-8 pr-8 appearance-none cursor-pointer"
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
          >
            <option value="">All actions</option>
            {ACTION_OPTIONS.map(a => (
              <option key={a} value={a}>{ACTION_CONFIG[a]?.label ?? a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Loading audit events…</div>
      ) : isError ? (
        <div className="py-16 text-center text-sm text-red-400">Failed to load audit log.</div>
      ) : (
        Object.entries(grouped).map(([day, logs]) => (
          <div key={day}>
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{day}</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            {/* Timeline line */}
            <div className="relative border-l border-border ml-1.5 space-y-1">
              {logs.map(log => <LogEntry key={log.id} log={log} />)}
            </div>
          </div>
        ))
      )}

      {data?.logs.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">No audit events found.</div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
