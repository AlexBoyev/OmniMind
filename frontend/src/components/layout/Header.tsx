import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { useJarvisStore } from '@/store/jarvisStore'
import { Brain, LogOut, ChevronDown, Shield, User } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const { user } = useAuthStore()
  const { logout, isAdmin } = useAuth()
  const { toggle: toggleJarvis } = useJarvisStore()
  const [menuOpen, setMenuOpen] = useState(false)

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-6">
        {/* Breadcrumb / page title area */}
        <nav className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
          <span className="text-foreground font-medium">{import.meta.env.VITE_APP_NAME ?? 'OmniMind'}</span>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {import.meta.env.VITE_ENABLE_JARVIS === 'true' && (
          <button
            onClick={toggleJarvis}
            className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            <Brain className="h-3.5 w-3.5" />
            Ask Jarvis
          </button>
        )}

        {/* Admin quick link */}
        {isAdmin() && (
          <Link
            to="/admin/overview"
            className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors sm:flex"
          >
            <Shield className="h-3.5 w-3.5" />
            Admin
          </Link>
        )}

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
              {initials}
            </div>
            <span className="hidden text-sm font-medium text-foreground sm:block">{user?.username}</span>
            {isAdmin() && (
              <span className="badge-admin hidden sm:inline-flex">admin</span>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-50 mt-1 w-52 rounded-xl border border-border bg-popover py-1 shadow-xl">
                <div className="border-b border-border px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{user?.username}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <div className="p-1">
                  <Link
                    to="/overview"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    Project Overview
                  </Link>
                  <button
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    onClick={() => { setMenuOpen(false); logout() }}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
