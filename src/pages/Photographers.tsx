import * as React from 'react'
import { api } from '@/lib/api'
import type { Photographer } from '@/lib/types'

export default function Photographers() {
  const [list, setList] = React.useState<Photographer[]>([])
  const [loading, setLoading] = React.useState(true)
  React.useEffect(() => {
    api
      .photographers()
      .then(setList)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div>
        <h1 className="font-serif text-3xl tracking-tight text-foreground">
          摄影师
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">社团成员与特邀作者</p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))
        ) : (
          list.map((p) => (
            <a
              key={p.id}
              href={'#/photographer/' + p.id}
              className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
                {p.avatar && (
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-foreground">{p.name}</div>
                {p.bio && (
                  <div className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                    {p.bio}
                  </div>
                )}
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  )
}
