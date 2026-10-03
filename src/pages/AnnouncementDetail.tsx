import * as React from 'react'
import { api } from '@/lib/api'
import type { Announcement } from '@/lib/types'
import { navigate } from '@/lib/router'

const typeLabel = (t?: string) =>
  t === 'event' ? '活动' : t === 'notice' ? '通知' : t === 'news' ? '资讯' : '活动'

export default function AnnouncementDetail({ id }: { id: string }) {
  const [a, setA] = React.useState<Announcement | null>(null)
  const [err, setErr] = React.useState('')

  React.useEffect(() => {
    api
      .announcement(id)
      .then(setA)
      .catch((e) => setErr(e.message))
  }, [id])

  if (err)
    return (
      <div className="shell py-20 text-center text-swiss-red">{err}</div>
    )
  if (!a)
    return <div className="shell py-20 text-center text-muted-foreground">加载中…</div>

  return (
    <article>
      {/* 海报 / 头图：瑞士全幅 */}
      {a.image && (
        <div className="w-full bg-foreground">
          <img
            src={a.image}
            alt={a.title}
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      )}

      <div className="shell max-w-3xl py-10 sm:py-14">
        <button
          onClick={() => navigate('/')}
          className="kicker mb-4 inline-block text-swiss-red"
        >
          ← 返回首页
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <span className="kicker-red">{typeLabel(a.type)}</span>
          {a.createdAt && (
            <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {new Date(a.createdAt).toLocaleDateString('zh-CN')}
            </span>
          )}
        </div>

        <h1 className="mt-3 text-3xl font-bold uppercase leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl">
          {a.title}
        </h1>

        {a.body && (
          <div className="rule-top mt-6 whitespace-pre-line pt-6 text-base leading-7 text-foreground/90">
            {a.body}
          </div>
        )}
      </div>
    </article>
  )
}
