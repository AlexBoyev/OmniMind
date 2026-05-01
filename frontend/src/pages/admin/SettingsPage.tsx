import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { apiClient } from '@/api/client'
import { CheckCircle, AlertCircle, Brain, MessageSquare, Phone } from 'lucide-react'

const TABS = ['General', 'Security', 'Integrations', 'About'] as const
type Tab = typeof TABS[number]

const PHASES = [
  { n: 1, name: 'Project Skeleton', desc: 'FastAPI backend + React frontend scaffolding' },
  { n: 2, name: 'Backend MVP',      desc: 'JWT auth, PostgreSQL, Redis, seeding' },
  { n: 3, name: 'Frontend MVP',     desc: 'Auth flow, RBAC, admin pages' },
  { n: 4, name: 'Docker Compose',   desc: 'Full-stack local dev environment' },
  { n: 5, name: 'Kubernetes',       desc: 'Minikube + Kustomize manifests' },
  { n: 6, name: 'Jenkins + ArgoCD', desc: 'GitOps CI/CD pipeline' },
  { n: 7, name: 'Monitoring',       desc: 'Prometheus, Grafana, Loki, audit log' },
  { n: 8, name: 'AI Bots',          desc: 'Jarvis + Telegram + WhatsApp' },
]

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('General')

  const { data: sysInfo } = useQuery({
    queryKey: ['system', 'info'],
    queryFn: () => apiClient.get('/admin/system/info').then(r => r.data),
    staleTime: 60_000,
  })

  const { data: envData } = useQuery({
    queryKey: ['admin', 'env'],
    queryFn: () => apiClient.get('/admin/env').then(r => r.data),
    staleTime: 30_000,
  })

  const isSet = (key: string) =>
    envData?.vars?.find((v: any) => v.key === key)?.is_set ?? false

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors -mb-px ${
              tab === t
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* General tab */}
      {tab === 'General' && (
        <div className="space-y-3">
          <div className="card-dark">
            <h2 className="mb-3 font-semibold text-foreground">Application Info</h2>
            <dl className="space-y-2 text-sm">
              {[
                ['App Name', sysInfo?.app_name],
                ['Version', sysInfo?.version],
                ['Environment', sysInfo?.environment],
                ['Python', sysInfo?.python_version],
                ['Platform', sysInfo?.platform],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-mono text-xs text-foreground">{v ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {/* Security tab */}
      {tab === 'Security' && (
        <div className="card-dark">
          <h2 className="mb-3 font-semibold text-foreground">Current Security Settings</h2>
          <p className="text-xs text-muted-foreground mb-4">Edit these values in the <a href="/admin/env" className="text-primary hover:underline">Environment Variables</a> page.</p>
          <dl className="space-y-2 text-sm">
            {[
              ['Rate Limit (default)', 'RATE_LIMIT_DEFAULT'],
              ['Rate Limit (auth)',    'RATE_LIMIT_AUTH'],
              ['BCRYPT Rounds',        'BCRYPT_ROUNDS'],
              ['Session Cookie Secure','SESSION_COOKIE_SECURE'],
            ].map(([label, key]) => (
              <div key={key} className="flex justify-between">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-mono text-xs text-foreground">
                  {envData?.vars?.find((v: any) => v.key === key)?.value ?? '—'}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Integrations tab */}
      {tab === 'Integrations' && (
        <div className="space-y-3">
          {[
            { icon: Brain, label: 'Anthropic / Jarvis', keys: ['ANTHROPIC_API_KEY'], color: 'text-primary' },
            { icon: MessageSquare, label: 'Telegram Bot', keys: ['TELEGRAM_BOT_TOKEN'], color: 'text-sky-400' },
            { icon: Phone, label: 'Twilio / WhatsApp', keys: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'], color: 'text-emerald-400' },
          ].map(({ icon: Icon, label, keys, color }) => {
            const allSet = keys.every(k => isSet(k))
            return (
              <div key={label} className="card-dark flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent">
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{keys.join(', ')}</p>
                </div>
                {allSet
                  ? <span className="badge-online"><CheckCircle className="h-3 w-3" />Configured</span>
                  : <span className="badge-offline"><AlertCircle className="h-3 w-3" />Not set</span>
                }
              </div>
            )
          })}
        </div>
      )}

      {/* About tab */}
      {tab === 'About' && (
        <div className="space-y-4">
          <div className="card-dark">
            <h2 className="mb-4 font-semibold text-foreground">Phase Completion</h2>
            <div className="space-y-2">
              {PHASES.map(({ n, name, desc }) => (
                <div key={n} className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-mono font-bold text-emerald-400">
                    {n}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground truncate">{desc}</p>
                  </div>
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
