import * as React from 'react'
import { api } from '@/lib/api'
import type { Photographer, Work } from '@/lib/types'
import { WorkCard } from '@/components/WorkCard'

export default function PhotographerDetail({ id }: { id: string }) {
  const [profile, setProfile] = React.useState<Photographer | null>(null)
  const [works, setWorks] = React.useState<Work[]>([])
  const [err, setErr] = React.useState('')

  React.useEffect(() => {
    setProfile(null)
    setWorks([])
    api
      .photographers()
      .then((list) => {
        setProfile(list.find((x) => x.id === id) || null)
      })
      .catch(() => {})
    api
      .works({ photographer: id })
      .then((d) => setWorks(d.items))
      .catch((e) => setErr(e.message))
  }, [id])

  if (err)
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-destructive">
        {err}
      </div>
    )
  if (!profile)
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-muted-foreground">
        加载中…
      </div>
    )

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <a
        href="#/photographers"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← 返回摄影师
      </a>
      <div className="mt-4 flex items-center gap-5">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-muted">
          {profile.avatar && (
            <img
              src={profile.avatar}
              alt={profile.name}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-foreground">
            {profile.name}
          </h1>
          {profile.bio && (
            <p className="mt-2 max-w-xl text-muted-foreground">{profile.bio}</p>
          )}
          {profile.website && (
            <a
              href={profile.website}
              className="mt-2 inline-block text-sm text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              {profile.website}
            </a>
          )}
        </div>
      </div>
      <div className="mt-8">
        <h2 className="font-serif text-xl text-foreground">作品（{works.length}）</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {works.map((w) => (
            <WorkCard key={w.id} work={w} />
          ))}
        </div>
      </div>
    </div>
  )
}
