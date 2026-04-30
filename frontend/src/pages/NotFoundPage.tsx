import { Link } from 'react-router-dom'
import { SearchX } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-center px-4">
      <SearchX className="mb-4 h-16 w-16 text-slate-400" />
      <h1 className="text-4xl font-bold text-slate-900">404</h1>
      <p className="mt-2 text-lg text-slate-500">Page not found.</p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}
