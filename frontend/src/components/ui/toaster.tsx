/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import { create } from 'zustand'
import { Toast, type ToastProps, type ToastVariant } from './toast'

interface ToastStore {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, 'id'>) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

export function toast(opts: { title?: string; description?: string; variant?: ToastVariant }) {
  useToastStore.getState().addToast(opts)
}

export function Toaster() {
  const { toasts, removeToast } = useToastStore()

  React.useEffect(() => {
    if (toasts.length === 0) return
    const latest = toasts[toasts.length - 1]
    const timer = setTimeout(() => removeToast(latest.id), 4000)
    return () => clearTimeout(timer)
  }, [toasts, removeToast])

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-96 flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onDismiss={removeToast} />
      ))}
    </div>
  )
}
