import * as React from 'react'
import { api } from '@/lib/api'
import type { Work } from '@/lib/types'
import { WorkCard } from '@/components/WorkCard'
import { Badge } from '@/components/ui/badge'
import { Camera, MapPin, User } from 'lucide-react'

export default function WorkDetail({ id }: { id: string }) {
  const [work, setWork] = React.useState<Work | null>(null)
  const [related, setRelated] = React.useState<Work[]>([])
  const [err, setErr] = React.useState('')

  React.useEffect(() => {
    setWork(null)
    api
      .work(id)
      .then((w) => {
        setWork(w)
        const params: Record<string, string> = {}
        if (w.photographerId) params.photographer = w.photographerId
        else if (w.themeId) params.theme = w.themeId
        api
          .works({ ...params, limit: '6' })
          .then((d) =>
            setRelated(d.items.filter((x: any) => x.id !== w.id).slice(0, 4)),
          )
          .catch(() => {})
      })
      .catch((e) => setErr(e.message))
  }, [id])

  if (err)
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-destructive">
        {err}
      </div>
    )
  if (!work)
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-muted-foreground">
        加载中…
      </div>
    )

  const meta = [work.theme?.name, work.category?.name, work.yearObj?.year]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <a
        href="#/browse"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← 返回作品
      </a>
      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        {work.image && (
          <img src={work.image} alt={work.title} className="w-full" />
        )}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {work.featured && <Badge variant="secondary">精选</Badge>}
        {meta && <span className="text-sm text-muted-foreground">{meta}</span>}
      </div>
      <h1 className="mt-2 font-serif text-3xl tracking-tight text-foreground">
        {work.title}
      </h1>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
        {work.photographer && (
          <a
            href={'#/photographer/' + work.photographer.id}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <User className="h-4 w-4" />
            {work.photographer.name}
          </a>
        )}
        {work.location && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {work.location}
          </span>
        )}
        {work.camera && (
          <span className="inline-flex items-center gap-1.5">
            <Camera className="h-4 w-4" />
            {work.camera}
          </span>
        )}
      </div>
      {work.description && (
        <p className="mt-5 max-w-2xl leading-relaxed text-foreground/90">
          {work.description}
        </p>
      )}

      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="font-serif text-xl text-foreground">相关作品</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((w) => (
              <WorkCard key={w.id} work={w} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
