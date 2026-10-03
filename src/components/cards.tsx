import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin } from 'lucide-react'
import type { Announcement, Exhibition } from '@/lib/types'

export function SectionTitle({
  title,
  sub,
  link,
  linkText,
}: {
  title: string
  sub?: string
  link?: string
  linkText?: string
}) {
  return (
    <div className="rule-top flex items-end justify-between gap-4 pt-5">
      <div>
        <h2 className="text-2xl font-bold uppercase tracking-[-0.02em] text-foreground">
          {title}
        </h2>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {link && (
        <a
          href={link}
          className="shrink-0 text-xs font-medium uppercase tracking-[0.16em] text-swiss-red transition-colors hover:text-foreground"
        >
          {linkText} →
        </a>
      )}
    </div>
  )
}

export function ExhibitionCard({ ex }: { ex: Exhibition }) {
  const statusLabel =
    ex.status === 'ongoing'
      ? '展出中'
      : ex.status === 'upcoming'
        ? '即将开幕'
        : ex.status === 'ended'
          ? '已结束'
          : ''
  return (
    <a
      href={'#/exhibition/' + ex.id}
      className="group block overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
    >
      <div className="aspect-[16/9] overflow-hidden bg-muted">
        {ex.coverImage && (
          <img
            src={ex.coverImage}
            alt={ex.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-foreground">{ex.title}</h3>
          {statusLabel && (
            <Badge variant="muted" className="text-xs">
              {statusLabel}
            </Badge>
          )}
        </div>
        {ex.subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{ex.subtitle}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {ex.startDate && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {ex.startDate}
              {ex.endDate ? ' – ' + ex.endDate : ''}
            </span>
          )}
          {ex.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {ex.location}
            </span>
          )}
        </div>
      </div>
    </a>
  )
}

export function AnnouncementRow({ a }: { a: Announcement }) {
  const typeLabel =
    a.type === 'event'
      ? '活动'
      : a.type === 'notice'
        ? '通知'
        : a.type === 'news'
          ? '资讯'
          : ''
  const date = a.createdAt
    ? new Date(a.createdAt).toLocaleDateString('zh-CN')
    : ''
  return (
    <a
      href="#/announcements"
      className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/40"
    >
      <div className="flex flex-wrap items-center gap-2">
        {a.pinned && (
          <Badge variant="secondary" className="text-xs">
            置顶
          </Badge>
        )}
        {typeLabel && (
          <Badge variant="outline" className="text-xs">
            {typeLabel}
          </Badge>
        )}
        {date && (
          <span className="text-xs text-muted-foreground">{date}</span>
        )}
      </div>
      <div className="mt-2 font-medium text-foreground">{a.title}</div>
      {a.body && (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {a.body}
        </p>
      )}
    </a>
  )
}
