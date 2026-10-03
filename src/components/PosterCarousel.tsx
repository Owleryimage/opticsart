import * as React from 'react'
import { cn } from '@/lib/utils'
import type { Announcement } from '@/lib/types'
import { navigate } from '@/lib/router'

const typeLabel = (t?: string) =>
  t === 'event' ? '活动' : t === 'notice' ? '通知' : t === 'news' ? '资讯' : '活动'

function fmtDate(a?: Announcement) {
  const ts = a?.createdAt
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

export default function PosterCarousel({ posters }: { posters: Announcement[] }) {
  const [idx, setIdx] = React.useState(0)
  const [paused, setPaused] = React.useState(false)
  const count = posters.length
  const safeIdx = count ? idx % count : 0

  const go = React.useCallback(
    (i: number) => setIdx(((i % count) + count) % count),
    [count],
  )
  const next = React.useCallback(() => go(safeIdx + 1), [go, safeIdx])
  const prev = React.useCallback(() => go(safeIdx - 1), [go, safeIdx])

  // 自动轮转（走马灯）：悬停暂停
  React.useEffect(() => {
    if (paused || count <= 1) return
    const t = setInterval(() => setIdx((x) => (x + 1) % count), 5500)
    return () => clearInterval(t)
  }, [paused, count])

  if (count === 0) {
    return (
      <div className="flex h-[calc(100dvh-3.5rem)] flex-col items-center justify-center bg-foreground text-background">
        <div className="kicker-red text-background/70">LUMINA</div>
        <div className="mt-3 text-2xl font-bold uppercase tracking-[-0.02em]">
          暂无活动海报
        </div>
        <div className="mt-2 text-sm text-background/60">
          请在后台「公告与活动」中添加带图片的活动。
        </div>
      </div>
    )
  }

  const current = posters[safeIdx]

  return (
    <div
      className="relative h-[calc(100dvh-3.5rem)] w-full overflow-hidden bg-foreground"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* 幻灯片：交叉淡入淡出 */}
      {posters.map((p, i) => (
        <button
          key={p.id}
          type="button"
          onClick={() => navigate('/announcement/' + p.id)}
          className={cn(
            'absolute inset-0 block h-full w-full transition-opacity duration-700 ease-out',
            i === safeIdx ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
          aria-label={p.title}
        >
          {p.image ? (
            <img
              src={p.image}
              alt={p.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-foreground text-background">
              {p.title}
            </div>
          )}
          {/* 左下角压暗，保证说明文字可读（瑞士：仅必要叠层） */}
          <span className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent" />
        </button>
      ))}

      {/* 说明文字（flush-left，瑞士网格左下角） */}
      <div className="absolute bottom-0 left-0 max-w-2xl p-5 sm:p-10">
        <div className="kicker-red text-white/80">{typeLabel(current.type)} · 当前活动</div>
        <h2 className="mt-2 text-3xl font-bold uppercase leading-[1.05] tracking-[-0.02em] text-white sm:text-5xl">
          {current.title}
        </h2>
        <div className="mt-3 flex items-center gap-3 text-sm uppercase tracking-[0.16em] text-white/80">
          <span className="inline-block h-px w-8 bg-swiss-red" />
          {fmtDate(current)}
        </div>
        <button
          type="button"
          onClick={() => navigate('/announcement/' + current.id)}
          className="mt-5 inline-block border border-white px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-white hover:text-foreground"
        >
          查看活动 →
        </button>
      </div>

      {/* 上一张 / 下一张 */}
      {count > 1 && (
        <div className="absolute right-5 top-5 flex gap-2 sm:right-10 sm:top-10">
          <button
            type="button"
            onClick={prev}
            aria-label="上一张"
            className="flex h-10 w-10 items-center justify-center border border-white/70 bg-black/30 text-white transition-colors hover:bg-white hover:text-foreground"
          >
            ←
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="下一张"
            className="flex h-10 w-10 items-center justify-center border border-white/70 bg-black/30 text-white transition-colors hover:bg-white hover:text-foreground"
          >
            →
          </button>
        </div>
      )}

      {/* 进度指示（小方块，激活为瑞士红） */}
      {count > 1 && (
        <div className="absolute bottom-5 right-5 flex gap-1.5 sm:bottom-10 sm:right-10">
          {posters.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => go(i)}
              aria-label={'第 ' + (i + 1) + ' 张'}
              className={cn(
                'h-1.5 w-6 transition-colors',
                i === safeIdx ? 'bg-swiss-red' : 'bg-white/50 hover:bg-white',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
