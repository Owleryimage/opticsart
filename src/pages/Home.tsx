import * as React from 'react'
import { api } from '@/lib/api'
import type { HomeData } from '@/lib/types'
import PosterCarousel from '@/components/PosterCarousel'

export default function Home() {
  const [data, setData] = React.useState<HomeData | null>(null)
  const [err, setErr] = React.useState('')

  React.useEffect(() => {
    api
      .home()
      .then(setData)
      .catch((e) => setErr(e.message))
  }, [])

  if (err)
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center text-swiss-red">
        {err}
      </div>
    )
  if (!data)
    return (
      <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center bg-foreground text-background/60">
        加载中…
      </div>
    )

  // 首页只展示图片（活动海报轮播）与顶部菜单
  return <PosterCarousel posters={data.posters || []} />
}
