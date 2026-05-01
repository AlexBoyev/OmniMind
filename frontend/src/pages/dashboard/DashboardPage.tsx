import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  Users, MessageSquare, Activity, Clock, ArrowRight,
  Brain, Shield, LogIn, LogOut, UserPlus, AlertCircle, Edit,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { useJarvisStore } from '@/store/jarvisStore'
import { adminApi } from '@/api/admin'
import { apiClient } from '@/api/client'
import { jarvisApi } from '@/api/jarvis'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

const ACTION_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  login:        { icon: LogIn,       color: 'text-emerald-400' },
  login_failed: { icon: AlertCircle, color: 'text-red-400' },
  logout:       { icon: LogOut,      color: 'text-sky-400' },
  register:     { icon: UserPlus,    color: 'text-violet-400' },
  user_updated: { icon: Edit,        color: 'text-amber-400' },
  jarvis_chat:  { icon: Brain,       color: 'text-primary' },
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function StatCard({ icon: Icon, label, value, sub, color = 'text-primary' }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="card-dark flex items-start gap-4"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent">
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </motion.div>
  )
}

export function DashboardPage() {
  const { user } = useAuthStore()
  const { isAdmin } = useAuth()
  const { toggle: toggleJarvis } = useJarvisStore()

  const { data: systemStats } = useQuery({
    queryKey: ['system', 'stats'],
    queryFn: () => apiClient.get('/admin/system/stats').then(r => r.data),
    enabled: isAdmin(),
    staleTime: 30_000,
  })

  const { data: conversations } = useQuery({
    queryKey: ['jarvis', 'conversations'],
    queryFn: () => jarvisApi.listConversations(),
    staleTime: 30_000,
  })

  const { data: auditLogs } = useQuery({
    queryKey: ['admin', 'audit-log', 1, ''],
    queryFn: () => adminApi.getAuditLog({ page: 1, size: 5 }),
    enabled: isAdmin(),
    staleTime: 30_000,
  })

  const staggerChildren = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
  }
  const item = {
    hidden: { opacity: 0, y: 12 },
    show:   { opacity: 1, y: 0 },
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-6"
      >
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative">
          <p className="text-sm font-medium text-primary">{greeting()},</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground">{user?.username} 👋</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {isAdmin()
              ? "You have full admin access. Check the infrastructure overview for system status."
              : "Welcome to OmniMind. Ask Jarvis anything or browse your conversations."}
          </p>
          <div className="mt-3 flex items-center gap-3">
            {isAdmin() && <span className="badge-admin">Admin</span>}
            {user?.created_at && (
              <span className="text-xs text-muted-foreground">
                Member since {format(new Date(user.created_at), 'MMM yyyy')}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={staggerChildren}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {isAdmin() && (
          <motion.div variants={item}>
            <StatCard icon={Users} label="Total Users" value={systemStats?.users_total ?? '—'} sub={`${systemStats?.users_active ?? '—'} active`} color="text-violet-400" />
          </motion.div>
        )}
        <motion.div variants={item}>
          <StatCard icon={MessageSquare} label="Conversations" value={conversations?.length ?? 0} sub="with Jarvis" />
        </motion.div>
        <motion.div variants={item}>
          <StatCard icon={Activity} label="Status" value={user?.is_active ? 'Active' : 'Inactive'} color="text-emerald-400" />
        </motion.div>
        {isAdmin() && (
          <motion.div variants={item}>
            <StatCard icon={Clock} label="Audit Events" value={systemStats?.audit_logs_total ?? '—'} sub="total recorded" color="text-amber-400" />
          </motion.div>
        )}
      </motion.div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={toggleJarvis}>
          <Brain className="h-4 w-4" /> Ask Jarvis
        </Button>
        <Link to="/jarvis" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-accent">
          <MessageSquare className="h-4 w-4" /> Full Chat
        </Link>
        {isAdmin() && (
          <Link to="/admin/overview" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-accent">
            <Shield className="h-4 w-4" /> Admin Dashboard
          </Link>
        )}
        <Link to="/overview" className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-foreground">
          Project Overview <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Recent audit events (admin only) */}
      {isAdmin() && auditLogs && auditLogs.logs.length > 0 && (
        <div className="card-dark">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Recent Activity</h2>
            <Link to="/admin/audit-log" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </div>
          <ul className="space-y-2">
            {auditLogs.logs.map((log) => {
              const { icon: Icon, color } = ACTION_ICONS[log.action] ?? { icon: Activity, color: 'text-muted-foreground' }
              return (
                <li key={log.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-accent/50 transition-colors">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground font-mono">{log.action}</span>
                    {log.ip_address && (
                      <span className="ml-2 text-xs text-muted-foreground">from {log.ip_address}</span>
                    )}
                  </div>
                  <time className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(log.created_at), 'HH:mm')}
                  </time>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
