import * as React from 'react'
import { cn } from '@/lib/utils'

interface TabsCtx {
  value: string
  onValueChange: (v: string) => void
}
const Ctx = React.createContext<TabsCtx>({ value: '', onValueChange: () => {} })

export function Tabs({
  value,
  onValueChange,
  children,
}: {
  value: string
  onValueChange: (v: string) => void
  children: React.ReactNode
}) {
  return <Ctx.Provider value={{ value, onValueChange }}>{children}</Ctx.Provider>
}

export function TabsList({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('inline-flex gap-1 rounded-md bg-muted p-1', className)}>
      {children}
    </div>
  )
}

export function TabsTrigger({
  value,
  children,
}: {
  value: string
  children: React.ReactNode
}) {
  const ctx = React.useContext(Ctx)
  const active = ctx.value === value
  return (
    <button
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        'rounded px-3 py-1.5 text-sm transition-colors',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value,
  children,
}: {
  value: string
  children: React.ReactNode
}) {
  const ctx = React.useContext(Ctx)
  return ctx.value === value ? <div>{children}</div> : null
}
