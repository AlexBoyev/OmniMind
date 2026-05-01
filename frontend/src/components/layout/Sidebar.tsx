import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, ClipboardList, Settings, Brain,
  Server, GitBranch, BarChart3, Cpu, ChevronLeft,
  ChevronRight, Activity, Globe, Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/store/sidebarStore'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
  adminOnly?: boolean
}

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'MAIN',
    items: [
      { label: 'Dashboard',   to: '/dashboard',        icon: LayoutDashboard },
      { label: 'Overview',    to: '/overview',          icon: Globe },
    ],
  },
  {
    title: 'ADMIN',
    items: [
      { label: 'Users',       to: '/admin/users',       icon: Users,        adminOnly: true },
      { label: 'Audit Log',   to: '/admin/audit-log',   icon: ClipboardList, adminOnly: true },
      { label: 'Env Vars',    to: '/admin/env',         icon: Settings,     adminOnly: true },
      { label: 'Settings',    to: '/admin/settings',    icon: Shield,       adminOnly: true },
    ],
  },
  {
    title: 'INFRASTRUCTURE',
    items: [
      { label: 'Services',    to: '/admin/overview',    icon: Server,       adminOnly: true },
      { label: 'Jenkins',     to: '/admin/overview#jenkins', icon: GitBranch, adminOnly: true },
      { label: 'ArgoCD',      to: '/admin/overview#argocd',  icon: Activity,  adminOnly: true },
      { label: 'Grafana',     to: '/admin/overview#grafana', icon: BarChart3, adminOnly: true },
    ],
  },
  {
    title: 'AI',
    items: [
      { label: 'Jarvis Chat', to: '/jarvis',            icon: Brain },
    ],
  },
]

export function Sidebar() {
  const { collapsed, toggle } = useSidebarStore()
  const { isAdmin } = useAuth()
  const location = useLocation()

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative flex h-screen shrink-0 flex-col overflow-hidden border-r border-border bg-card"
    >
      {/* Logo */}
      <div className={cn(
        'flex h-16 items-center border-b border-border px-3',
        collapsed ? 'justify-center' : 'gap-2 px-4',
      )}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
          <Cpu className="h-4 w-4 text-primary" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-bold text-foreground tracking-tight"
            >
              OmniMind
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {SECTIONS.map((section) => {
          const visibleItems = section.items.filter(item => !item.adminOnly || isAdmin())
          if (visibleItems.length === 0) return null
          return (
            <div key={section.title} className="mb-4">
              <AnimatePresence>
                {!collapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                  >
                    {section.title}
                  </motion.p>
                )}
              </AnimatePresence>
              <ul className="space-y-0.5 px-2">
                {visibleItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                          collapsed && 'justify-center px-2',
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <AnimatePresence>
                          {!collapsed && (
                            <motion.span
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -6 }}
                              className="truncate"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2">
        <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-2 px-2')}>
          <div className="status-dot-online" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-muted-foreground"
              >
                v{import.meta.env.VITE_APP_VERSION ?? '0.1.0'}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </motion.aside>
  )
}
