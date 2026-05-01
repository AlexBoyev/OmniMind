import { motion } from 'framer-motion'
import { CheckCircle, ExternalLink, Cpu, Code, Database, Server, GitBranch, Activity, BarChart3, Brain, Mail, Shield } from 'lucide-react'

const PHASES = [
  { n: 1, name: 'Project Skeleton',     what: 'FastAPI + React + Docker scaffolding, CI config, GitHub setup' },
  { n: 2, name: 'Backend MVP',          what: 'JWT auth, PostgreSQL, Redis, Alembic migrations, seed data' },
  { n: 3, name: 'Frontend MVP',         what: 'React auth flow, RBAC, admin pages, TanStack Query' },
  { n: 4, name: 'Docker Compose',       what: 'Full-stack local dev, nginx proxy, pgAdmin, Mailpit' },
  { n: 5, name: 'Kubernetes',           what: 'Minikube + Kustomize, staging overlay, Sealed Secrets, HPA' },
  { n: 6, name: 'Jenkins + ArgoCD',     what: 'GitOps CI/CD: lint → test → build → push → deploy' },
  { n: 7, name: 'Monitoring + Audit',   what: 'Prometheus, Grafana, Loki, Promtail, security audit trail' },
  { n: 8, name: 'AI + Bots',           what: 'Jarvis (Claude), Telegram bot, WhatsApp via Twilio' },
]

const STACK = [
  { icon: Code,       name: 'FastAPI',     desc: 'Python async REST API',        color: 'text-emerald-400' },
  { icon: Cpu,        name: 'React',        desc: 'TypeScript SPA frontend',     color: 'text-sky-400' },
  { icon: Database,   name: 'PostgreSQL',   desc: 'Primary relational database', color: 'text-blue-400' },
  { icon: Server,     name: 'Redis',        desc: 'Cache + session store',       color: 'text-red-400' },
  { icon: Shield,     name: 'Docker',       desc: 'Containerisation',            color: 'text-cyan-400' },
  { icon: Server,     name: 'Kubernetes',   desc: 'Container orchestration',     color: 'text-violet-400' },
  { icon: GitBranch,  name: 'Jenkins',      desc: 'CI pipeline automation',      color: 'text-amber-400' },
  { icon: Activity,   name: 'ArgoCD',       desc: 'GitOps CD controller',        color: 'text-orange-400' },
  { icon: BarChart3,  name: 'Grafana',      desc: 'Metrics dashboards',          color: 'text-orange-300' },
  { icon: Brain,      name: 'Claude AI',    desc: 'AI assistant (Jarvis)',        color: 'text-primary' },
]

const LINKS = [
  { label: 'API Docs',   href: 'http://localhost:8001/docs', icon: Code,     color: 'border-sky-500/30 bg-sky-500/5 text-sky-400' },
  { label: 'Jenkins',    href: 'http://192.168.49.2:32000',  icon: GitBranch,color: 'border-amber-500/30 bg-amber-500/5 text-amber-400' },
  { label: 'ArgoCD',     href: 'http://192.168.49.2:32001',  icon: Activity, color: 'border-violet-500/30 bg-violet-500/5 text-violet-400' },
  { label: 'Grafana',    href: 'http://192.168.49.2:32002',  icon: BarChart3,color: 'border-orange-500/30 bg-orange-500/5 text-orange-400' },
  { label: 'pgAdmin',    href: 'http://localhost:5050',       icon: Database, color: 'border-teal-500/30 bg-teal-500/5 text-teal-400' },
  { label: 'Mailpit',    href: 'http://localhost:8025',       icon: Mail,     color: 'border-pink-500/30 bg-pink-500/5 text-pink-400' },
]

export function OverviewPage() {
  return (
    <div className="p-6 space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center"
      >
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
            <Cpu className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">OmniMind</h1>
          <p className="mt-2 text-muted-foreground">
            Production-grade full-stack application with AI assistant, CI/CD pipeline,
            Kubernetes orchestration, and observability stack.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="badge-online">8 Phases Complete</span>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">v0.1.0</span>
          </div>
        </div>
      </motion.div>

      {/* Phase tracker */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Build Phases
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {PHASES.map(({ n, name, what }, i) => (
            <motion.div
              key={n}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400">
                  {n}
                </span>
                <p className="text-xs font-semibold text-foreground">{name}</p>
                <CheckCircle className="ml-auto h-3.5 w-3.5 shrink-0 text-emerald-400" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{what}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Technology Stack
        </h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {STACK.map(({ icon: Icon, name, desc, color }) => (
            <div key={name} className="card-dark flex items-center gap-3">
              <Icon className={`h-5 w-5 shrink-0 ${color}`} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">{name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick access links */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Access
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LINKS.map(({ label, href, icon: Icon, color }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-between rounded-xl border p-4 transition-all hover:scale-[1.01] ${color}`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                <span className="font-medium text-sm">{label}</span>
              </div>
              <ExternalLink className="h-4 w-4 opacity-60" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
