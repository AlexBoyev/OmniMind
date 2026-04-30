import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export type ToastVariant = 'default' | 'destructive' | 'success'

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
}

interface ToastItemProps extends ToastProps {
  onDismiss: (id: string) => void
}

const variantClasses: Record<ToastVariant, string> = {
  default: 'bg-white border-slate-200 text-slate-900',
  destructive: 'bg-red-600 border-red-700 text-white',
  success: 'bg-green-600 border-green-700 text-white',
}

export function Toast({ id, title, description, variant = 'default', onDismiss }: ToastItemProps) {
  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full items-center justify-between rounded-md border p-4 shadow-lg',
        variantClasses[variant],
      )}
    >
      <div className="flex-1">
        {title && <p className="text-sm font-semibold">{title}</p>}
        {description && <p className="text-sm opacity-90">{description}</p>}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="ml-4 shrink-0 rounded-md opacity-70 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
