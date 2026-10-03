import type { Work } from '@/lib/types'

export function WorkCard({ work }: { work: Work }) {
  const meta = [work.photographer?.name, work.category?.name, work.yearObj?.year]
    .filter(Boolean)
    .join(' · ')
  return (
    <a
      href={'#/work/' + work.id}
      className="group block overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {work.image ? (
          <img
            src={work.image}
            alt={work.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            暂无图片
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="truncate text-sm font-medium text-foreground">
          {work.title}
        </div>
        {meta && (
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {meta}
          </div>
        )}
      </div>
    </a>
  )
}
