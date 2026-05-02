import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { apiClient } from '@/api/client'
import {
  Server, GitBranch, Activity, BarChart3, Database, Mail,
  ExternalLink, RefreshCw, CheckCircle, XCircle, Loader,
  Users, MessageSquare, ClipboardList, Cpu, Code,
  Globe, Shield, Box,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// Read URLs from Vite env vars (set in .env, baked in at build time)
const ENV = {
  BACKEND:    'http://localhost:8001',
  FRONTEND:   'http://localhost:3000',
  JENKINS:    import.meta.env.VITE_JENKINS_URL    || '',
  ARGOCD:     import.meta.env.VITE_ARGOCD_URL     || '',
  GRAFANA:    import.meta.env.VITE_GRAFANA_URL    || '',
  PROMETHEUS: import.meta.env.VITE_PROMETHEUS_URL || '',
  PGADMIN:    import.meta.env.VITE_PGADMIN_URL    || 'http://localhost:5050',
  MAILPIT:    import.meta.env.VITE_MAILPIT_URL    || 'http://localhost:8025',
  GITHUB:     import.meta.env.VITE_GITHUB_REPO_URL || 'https://github.com/AlexBoyev/OmniMind',
}

interface ServiceDef {
  name: string
  url: string
  icon: React.ElementType
  desc: string
  color: string
  badgeColor: string
}

const SERVICES: ServiceDef[] = [
  { name: 'Backend API',  url: ENV.BACKEND,    icon: Server,    desc: 'FastAPI REST backend',      color: 'text-sky-400',    badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  { name: 'Frontend',     url: ENV.FRONTEND,   icon: Globe,     desc: 'React SPA',                 color: 'text-emerald-400',badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { name: 'Jenkins',      url: ENV.JENKINS,    icon: GitBranch, desc: 'CI/CD automation',          color: 'text-amber-400',  badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { name: 'ArgoCD',       url: ENV.ARGOCD,     icon: Activity,  desc: 'GitOps CD controller',      color: 'text-violet-400', badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  { name: 'Grafana',      url: ENV.GRAFANA,    icon: BarChart3, desc: 'Metrics dashboards',        color: 'text-orange-400', badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { name: 'Prometheus',   url: ENV.PROMETHEUS, icon: Cpu,       desc: 'Metrics collection',        color: 'text-red-400',    badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20' },
  { name: 'pgAdmin',      url: ENV.PGADMIN,    icon: Database,  desc: 'PostgreSQL admin UI',       color: 'text-teal-400',   badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  { name: 'Mailpit',      url: ENV.MAILPIT,    icon: Mail,      desc: 'SMTP dev inbox',            color: 'text-pink-400',   badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
]

const STACK_BADGES = ['FastAPI', 'React', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'Jenkins', 'ArgoCD', 'Prometheus', 'Grafana', 'Claude AI']

async function fetchSystemHealth(): Promise<Record<string, string>> {
  const resp = await apiClient.get('/admin/system/health')
  const map: Record<string, string> = {}
  for (const svc of resp.data.services as { name: string; status: string }[]) {
    map[svc.name] = svc.status
  }
  return map
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'checking')        return <span className="badge-checking"><Loader className="h-3 w-3 animate-spin" />Checking</span>
  if (status === 'online')          return <span className="badge-online"><CheckCircle className="h-3 w-3" />Online</span>
  if (status === 'degraded')        return <span className="badge-checking"><Activity className="h-3 w-3" />Degraded</span>
  if (status === 'not_configured')  return <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-2 py-0.5 text-xs font-medium text-slate-400">Not configured</span>
  return <span className="badge-offline"><XCircle className="h-3 w-3" />Offline</span>
}

function ServiceCard({ svc, status }: { svc: ServiceDef; status: string }) {
  const Icon = svc.icon
  return (
    <motion.div whileHover={{ y: -2 }} className="card-dark flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent">
          <Icon className={`h-4 w-4 ${svc.color}`} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{svc.name}</p>
          <p className="text-xs text-muted-foreground">{svc.desc}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <StatusBadge status={status} />
        {svc.url ? (
          <a
            href={svc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Open <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">Set VITE_*_URL in .env</span>
        )}
      </div>
    </motion.div>
  )
}

export function SuperDashboardPage() {
  const qc = useQueryClient()

  // Single backend call fetches all service statuses using Docker-internal URLs
  const { data: healthMap } = useQuery({
    queryKey: ['system', 'health'],
    queryFn: fetchSystemHealth,
    refetchInterval: 30_000,
    staleTime: 25_000,
  })

  const { data: stats } = useQuery({
    queryKey: ['system', 'stats'],
    queryFn: () => apiClient.get('/admin/system/stats').then(r => r.data),
    staleTime: 30_000,
  })

  const { data: sysInfo } = useQuery({
    queryKey: ['system', 'info'],
    queryFn: () => apiClient.get('/admin/system/info').then(r => r.data),
    staleTime: 60_000,
  })

  const onlineCount = healthMap ? Object.values(healthMap).filter(s => s === 'online').length : 0

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ['system', 'health'] })
  }

  const quickLinks = [
    { label: 'API Docs',   href: ENV.BACKEND + '/docs', icon: Code,     color: 'border-sky-500/30 bg-sky-500/5 text-sky-400' },
    { label: 'GitHub',     href: ENV.GITHUB,             icon: Globe,    color: 'border-slate-500/30 bg-slate-500/5 text-slate-400' },
    { label: 'Jenkins',    href: ENV.JENKINS,             icon: GitBranch,color: 'border-amber-500/30 bg-amber-500/5 text-amber-400' },
    { label: 'ArgoCD',     href: ENV.ARGOCD,              icon: Activity, color: 'border-violet-500/30 bg-violet-500/5 text-violet-400' },
    { label: 'Grafana',    href: ENV.GRAFANA,             icon: BarChart3,color: 'border-orange-500/30 bg-orange-500/5 text-orange-400' },
    { label: 'Prometheus', href: ENV.PROMETHEUS,          icon: Cpu,      color: 'border-red-500/30 bg-red-500/5 text-red-400' },
    { label: 'pgAdmin',    href: ENV.PGADMIN,             icon: Database, color: 'border-teal-500/30 bg-teal-500/5 text-teal-400' },
    { label: 'Mailpit',    href: ENV.MAILPIT,             icon: Mail,     color: 'border-pink-500/30 bg-pink-500/5 text-pink-400' },
  ].filter(l => !!l.href)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Infrastructure Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Live status of all OmniMind services</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: CheckCircle, label: 'Online',        value: `${onlineCount}/${SERVICES.length}`, color: 'text-emerald-400' },
          { icon: Users,       label: 'Total Users',   value: stats?.users_total ?? '—',          color: 'text-violet-400' },
          { icon: MessageSquare, label: 'Conversations', value: stats?.conversations_total ?? '—', color: 'text-sky-400' },
          { icon: ClipboardList, label: 'Audit Events', value: stats?.audit_logs_total ?? '—',    color: 'text-amber-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card-dark flex items-center gap-3">
            <Icon className={`h-5 w-5 shrink-0 ${color}`} />
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Service grid */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Service Status
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map(svc => (
            <ServiceCard key={svc.name} svc={svc} status={healthMap ? (healthMap[svc.name] ?? 'offline') : 'checking'} />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          On Windows: run{' '}
          <code className="font-mono text-primary">.\scripts\open-k8s-services.ps1</code>
          {' '}to open Minikube tunnels — each window prints the working URL.
          Linux/macOS: <code className="font-mono text-primary">bash scripts/setup-port-forwards.sh</code>
        </p>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Links
        </h2>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map(({ label, href, icon: Icon, color }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all hover:scale-105 ${color}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          ))}
        </div>
      </div>

      {/* Project info */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-dark">
          <h2 className="mb-3 font-semibold text-foreground flex items-center gap-2">
            <Box className="h-4 w-4 text-primary" /> System Info
          </h2>
          <dl className="space-y-2 text-sm">
            {[
              ['App Name',    sysInfo?.app_name],
              ['Version',     sysInfo?.version],
              ['Environment', sysInfo?.environment],
              ['Python',      sysInfo?.python_version],
              ['Uptime',      sysInfo?.uptime_seconds ? `${Math.floor(sysInfo.uptime_seconds / 60)}m` : '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-mono text-xs text-foreground">{v ?? '—'}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card-dark">
          <h2 className="mb-3 font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Tech Stack
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {STACK_BADGES.map(b => (
              <span key={b} className="rounded-md border border-border bg-accent px-2 py-0.5 text-xs font-mono text-foreground">
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
