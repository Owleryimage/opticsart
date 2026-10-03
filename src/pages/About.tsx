import * as React from 'react'
import { api } from '@/lib/api'

export default function About() {
  const [cfg, setCfg] = React.useState<{ settings: any } | null>(null)
  React.useEffect(() => {
    api.config().then(setCfg).catch(() => {})
  }, [])

  if (!cfg)
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">
        加载中…
      </div>
    )
  const s = cfg.settings
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {s.societyName}
      </div>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-foreground">
        关于我们
      </h1>
      <p className="mt-6 whitespace-pre-line leading-relaxed text-foreground/90">
        {s.about}
      </p>
      {s.contact && (
        <div className="mt-8 rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
          <div className="font-medium text-foreground">联系方式</div>
          <div className="mt-2 whitespace-pre-line">{s.contact}</div>
        </div>
      )}
    </div>
  )
}
