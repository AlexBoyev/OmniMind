import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { apiClient } from '@/api/client'
import {
  Server, GitBranch, Activity, BarChart3, Database, Mail,
  ExternalLink, RefreshCw, CheckCircle, XCircle, Loader,
  Users, MessageSquare, ClipboardList, Cpu, Code,
  Globe, Shield, Box,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const SERVICE_META: Record<string, { icon: React.ElementType; desc: string; color: string }> = {
  'Backend API':  { icon: Server,    desc: 'FastAPI REST backend',        color: 'text-sky-400' },
  'Frontend':     { icon: Globe,     desc: 'React SPA',                   color: 'text-emerald-400' },
  'Jenkins':      { icon: GitBranch, desc: 'CI/CD automation server',     color: 'text-amber-400' },
  'ArgoCD':       { icon: Activity,  desc: 'GitOps CD controller',        color: 'text-violet-400' },
  'Grafana':      { icon: BarChart3, desc: 'Metrics dashboards',          color: 'text-orange-400' },
  'Prometheus':   { icon: Cpu,       desc: 'Metrics collection',          color: 'text-red-400' },
  'pgAdmin':      { icon: Database,  desc: 'PostgreSQL admin UI',         color: 'text-teal-400' },
  'Mailpit':      { icon: Mail,      desc: 'SMTP dev inbox',              color: 'text-pink-400' },
}

const QUICK_LINKS = [
  { label: 'API Docs',   href: 'http://localhost:8001/docs', icon: Code,     color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  { label: 'Jenkins',    href: 'http://192.168.49.2:32000',  icon: GitBranch,color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { label: 'ArgoCD',     href: 'http://192.168.49.2:32001',  icon: Activity, color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  { label: 'Grafana',    href: 'http://192.168.49.2:32002',  icon: BarChart3,color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { label: 'Prometheus', href: 'http://192.168.49.2:32003',  icon: Cpu,      color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  { label: 'pgAdmin',    href: 'http://localhost:5050',       icon: Database, color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  { label: 'Mailpit',    href: 'http://localhost:8025',       icon: Mail,     color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
]

const STACK_BADGES = ['FastAPI', 'React', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'Jenkins', 'ArgoCD', 'Prometheus', 'Grafana', 'Claude AI']

function ServiceCard({ service }: { service: { name: string; url: string; status: string } }) {
  const meta = SERVICE_META[service.name] ?? { icon: Server, desc: '', color: 'text-muted-foreground' }
  const Icon = meta.icon
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="card-dark flex items-start justify-between gap-3"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent">
          <Icon className={`h-4.5 w-4.5 ${meta.color}`} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{service.name}</p>
          <p className="text-xs text-muted-foreground">{meta.desc}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        {service.status === 'online' && (
          <span className="badge-online"><CheckCircle className="h-3 w-3" />Online</span>
        )}
        {service.status === 'offline' && (
          <span className="badge-offline"><XCircle className="h-3 w-3" />Offline</span>
        )}
        {service.status === 'checking' && (
          <span className="badge-checking"><Loader className="h-3 w-3 animate-spin" />Checking</span>
        )}
        <a
          href={service.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          Open <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </motion.div>
  )
}

export function SuperDashboardPage() {
  const { data: health, isLoading: healthLoading, refetch } = useQuery({
    queryKey: ['system', 'health'],
    queryFn: () => apiClient.get('/admin/system/health').then(r => r.data),
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

  const services = health?.services ?? QUICK_LINKS.map(l => ({
    name: l.label === 'API Docs' ? 'Backend API' : l.label,
    url: l.href,
    status: 'checking',
  }))

  const onlineCount = services.filter((s: {status:string}) => s.status === 'online').length

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Infrastructure Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Live status of all OmniMind services and infrastructure
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={healthLoading}>
          <RefreshCw className={`h-3.5 w-3.5 ${healthLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: CheckCircle, label: 'Online',        value: onlineCount, color: 'text-emerald-400' },
          { icon: Users,       label: 'Total Users',   value: stats?.users_total ?? '—', color: 'text-violet-400' },
          { icon: MessageSquare, label: 'Conversations', value: stats?.conversations_total ?? '—', color: 'text-sky-400' },
          { icon: ClipboardList, label: 'Audit Events', value: stats?.audit_logs_total ?? '—', color: 'text-amber-400' },
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
          {services.map((svc: { name: string; url: string; status: string }) => (
            <ServiceCard key={svc.name} service={svc} />
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Links
        </h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_LINKS.map(({ label, href, icon: Icon, color }) => (
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

      {/* Project info + stack */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-dark">
          <h2 className="mb-3 font-semibold text-foreground flex items-center gap-2">
            <Box className="h-4 w-4 text-primary" /> Project Info
          </h2>
          <dl className="space-y-2 text-sm">
            {[
              ['App Name',    sysInfo?.app_name ?? 'OmniMind'],
              ['Version',     sysInfo?.version ?? '0.1.0'],
              ['Environment', sysInfo?.environment ?? '—'],
              ['Python',      sysInfo?.python_version ?? '—'],
              ['Uptime',      sysInfo?.uptime_seconds ? `${Math.floor(sysInfo.uptime_seconds / 60)}m` : '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-mono text-xs text-foreground">{v}</dd>
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
