import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { ChevronDown, Brain } from 'lucide-react'

export function Header() {
  const { user } = useAuthStore()
  const { logout, isAdmin } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-slate-900">
          <Brain className="h-6 w-6 text-indigo-600" />
          <span className="text-lg">OmniMind</span>
        </Link>

        <nav className="flex items-center gap-4">
          {isAdmin() && (
            <Link
              to="/admin/users"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Admin
            </Link>
          )}

          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {user?.username}
              <ChevronDown className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-40 rounded-md border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
                  {user?.email}
                </div>
                <div className="p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setMenuOpen(false)
                      logout()
                    }}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
