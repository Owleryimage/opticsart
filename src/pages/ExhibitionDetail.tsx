import * as React from 'react'
import { api } from '@/lib/api'
import type { Exhibition } from '@/lib/types'
import { WorkCard } from '@/components/WorkCard'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, User } from 'lucide-react'

export default function ExhibitionDetail({ id }: { id: string }) {
  const [ex, setEx] = React.useState<Exhibition | null>(null)
  const [err, setErr] = React.useState('')

  React.useEffect(() => {
    setEx(null)
    api
      .exhibition(id)
      .then(setEx)
      .catch((e) => setErr(e.message))
  }, [id])

  if (err)
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-destructive">
        {err}
      </div>
    )
  if (!ex)
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-muted-foreground">
        加载中…
      </div>
    )

  const statusLabel =
    ex.status === 'ongoing'
      ? '展出中'
      : ex.status === 'upcoming'
        ? '即将开幕'
        : ex.status === 'ended'
          ? '已结束'
          : ''
  const period = [ex.startDate, ex.endDate].filter(Boolean).join(' – ')

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <a
        href="#/exhibitions"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← 返回展览
      </a>
      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        {ex.coverImage && (
          <img src={ex.coverImage} alt={ex.title} className="w-full" />
        )}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {statusLabel && <Badge variant="muted">{statusLabel}</Badge>}
      </div>
      <h1 className="mt-2 font-serif text-3xl tracking-tight text-foreground">
        {ex.title}
      </h1>
      {ex.subtitle && <p className="mt-1 text-muted-foreground">{ex.subtitle}</p>}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
        {period && (
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {period}
          </span>
        )}
        {ex.location && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {ex.location}
          </span>
        )}
        {ex.curator && (
          <span className="inline-flex items-center gap-1.5">
            <User className="h-4 w-4" />
            策展：{ex.curator}
          </span>
        )}
      </div>
      {ex.description && (
        <p className="mt-5 max-w-2xl leading-relaxed text-foreground/90">
          {ex.description}
        </p>
      )}
      {ex.works && ex.works.length > 0 && (
        <div className="mt-10">
          <h2 className="font-serif text-xl text-foreground">
            展览作品（{ex.works.length}）
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {ex.works.map((w) => (
              <WorkCard key={w.id} work={w} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
