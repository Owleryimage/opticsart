import * as React from 'react'
import { cn } from '@/lib/utils'

type ToastType = 'info' | 'error' | 'success'
interface ToastItem {
  id: string
  msg: string
  type: ToastType
}

const ToastCtx = React.createContext<(msg: string, type?: ToastType) => void>(
  () => {},
)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])
  const toast = React.useCallback((msg: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, msg, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'rounded-md border px-4 py-2 text-sm shadow-lg bg-card text-card-foreground',
              t.type === 'error'
                ? 'border-destructive'
                : t.type === 'success'
                  ? 'border-success'
                  : 'border-border',
            )}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return React.useContext(ToastCtx)
}
