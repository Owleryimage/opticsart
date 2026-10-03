import * as React from 'react'
import { api } from '@/lib/api'
import type { Announcement } from '@/lib/types'
import { AnnouncementRow } from '@/components/cards'

export default function Announcements() {
  const [list, setList] = React.useState<Announcement[]>([])
  const [loading, setLoading] = React.useState(true)
  React.useEffect(() => {
    api
      .announcements()
      .then(setList)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl tracking-tight text-foreground">
        公告与活动
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">社团最新动态与活动安排</p>
      <div className="mt-6 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-muted"
            />
          ))
        ) : list.length > 0 ? (
          list.map((a) => <AnnouncementRow key={a.id} a={a} />)
        ) : (
          <div className="py-16 text-center text-muted-foreground">暂无公告</div>
        )}
      </div>
    </div>
  )
}
