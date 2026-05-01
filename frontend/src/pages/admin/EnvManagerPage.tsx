import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Save, CheckCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react'
import { apiClient } from '@/api/client'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'

interface EnvVar {
  key: string
  value: string
  category: string
  description: string
  is_secret: boolean
  is_set: boolean
  env_file_writable: boolean
}

const CATEGORY_LINKS: Record<string, { text: string; href: string } | undefined> = {
  ANTHROPIC_API_KEY:   { text: 'Get API key',   href: 'https://console.anthropic.com' },
  TELEGRAM_BOT_TOKEN:  { text: '@BotFather',     href: 'https://t.me/BotFather' },
  TWILIO_ACCOUNT_SID:  { text: 'Twilio Console', href: 'https://console.twilio.com' },
  TWILIO_AUTH_TOKEN:   { text: 'Twilio Console', href: 'https://console.twilio.com' },
}

const CATEGORIES = ['AI', 'Bots', 'Auth', 'Security', 'Database', 'Infrastructure', 'General']

function VarCard({ v, onSave }: { v: EnvVar; onSave: (key: string, val: string) => void }) {
  const [editVal, setEditVal] = useState('')
  const [editing, setEditing] = useState(false)
  const [showVal, setShowVal] = useState(false)
  const link = CATEGORY_LINKS[v.key]

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-xs font-mono text-foreground">{v.key}</code>
            {v.is_set
              ? <span className="badge-online"><CheckCircle className="h-2.5 w-2.5" />Set</span>
              : <span className="badge-offline"><AlertCircle className="h-2.5 w-2.5" />Not configured</span>
            }
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{v.description}</p>
        </div>
        {link && (
          <a href={link.href} target="_blank" rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1 text-xs text-primary hover:underline">
            {link.text} <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>

      {/* Current masked value */}
      {v.is_set && !editing && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2">
          <code className="flex-1 text-xs font-mono text-muted-foreground truncate">
            {v.is_secret && !showVal ? v.value : v.value}
          </code>
          {v.is_secret && (
            <button onClick={() => setShowVal(s => !s)} className="shrink-0 text-muted-foreground hover:text-foreground">
              {showVal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      )}

      {/* Edit area */}
      {editing ? (
        <div className="space-y-2">
          <input
            type={v.is_secret ? 'password' : 'text'}
            className="input-dark font-mono text-xs"
            placeholder={`Enter value for ${v.key}`}
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { onSave(v.key, editVal); setEditing(false); setEditVal('') }}>
              <Save className="h-3.5 w-3.5" /> Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditVal('') }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          {v.is_set ? 'Update' : 'Set value'}
        </Button>
      )}
    </div>
  )
}

export function EnvManagerPage() {
  const [activeCategory, setActiveCategory] = useState('AI')
  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'env'],
    queryFn: () => apiClient.get('/admin/env').then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: (vars: Record<string, string>) =>
      apiClient.patch('/admin/env', { vars }).then(r => r.data),
    onSuccess: (d) => {
      toast({ title: d.message ?? 'Saved successfully', variant: 'success' })
      qc.invalidateQueries({ queryKey: ['admin', 'env'] })
    },
    onError: (e: any) => {
      toast({ title: e?.response?.data?.detail ?? 'Failed to save', variant: 'destructive' })
    },
  })

  const handleSave = (key: string, value: string) => {
    updateMutation.mutate({ [key]: value })
  }

  const vars: EnvVar[] = data?.vars ?? []
  const filtered = vars.filter((v) => v.category === activeCategory)
  const setCounts = vars.reduce<Record<string, number>>((acc, v) => {
    if (v.is_set) acc[v.category] = (acc[v.category] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Environment Variables</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure all service integrations and secrets</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {data?.env_file && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5">
          <p className="text-xs text-emerald-400">
            <CheckCircle className="inline h-3 w-3 mr-1" />
            Writing to: <code className="font-mono">{data.env_file}</code>
          </p>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => {
          const catVars = vars.filter(v => v.category === cat)
          if (catVars.length === 0) return null
          const setCount = setCounts[cat] ?? 0
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-accent text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              {cat}
              <span className="ml-1.5 rounded-full bg-current/10 px-1.5 py-0.5 text-[10px]">
                {setCount}/{catVars.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Var cards */}
      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading variables...</div>
      ) : (
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-3 sm:grid-cols-2"
        >
          {filtered.map((v) => (
            <VarCard key={v.key} v={v} onSave={handleSave} />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-2 py-8 text-center text-sm text-muted-foreground">
              No variables in this category.
            </p>
          )}
        </motion.div>
      )}
    </div>
  )
}
