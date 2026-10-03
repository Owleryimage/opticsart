import * as React from 'react'
import { api } from '@/lib/api'
import type { Exhibition } from '@/lib/types'
import { ExhibitionCard, SectionTitle } from '@/components/cards'

export default function Exhibitions() {
  const [list, setList] = React.useState<Exhibition[]>([])
  const [loading, setLoading] = React.useState(true)
  React.useEffect(() => {
    api
      .exhibitions()
      .then(setList)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <SectionTitle title="展览" sub="社团历次展览与活动" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[16/9] animate-pulse rounded-lg bg-muted"
            />
          ))
        ) : list.length > 0 ? (
          list.map((ex) => <ExhibitionCard key={ex.id} ex={ex} />)
        ) : (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            暂无展览
          </div>
        )}
      </div>
    </div>
  )
}
