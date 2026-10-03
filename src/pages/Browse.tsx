import * as React from 'react'
import { api } from '@/lib/api'
import { useRoute, navigate } from '@/lib/router'
import type { Category, Photographer, Theme, Work, YearItem } from '@/lib/types'
import { WorkCard } from '@/components/WorkCard'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function Browse() {
  const route = useRoute()
  const q = route.query
  const [works, setWorks] = React.useState<Work[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [themes, setThemes] = React.useState<Theme[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [photographers, setPhotographers] = React.useState<Photographer[]>([])
  const [years, setYears] = React.useState<YearItem[]>([])
  const [search, setSearch] = React.useState(q.q || '')

  React.useEffect(() => {
    Promise.all([
      api.themes(),
      api.categories(),
      api.photographers(),
      api.years(),
    ])
      .then(([t, c, p, y]) => {
        setThemes(t)
        setCategories(c)
        setPhotographers(p)
        setYears(y)
      })
      .catch(() => {})
  }, [])

  const qkey = JSON.stringify(q)
  React.useEffect(() => {
    setLoading(true)
    const params: Record<string, string> = {}
    for (const k of ['theme', 'category', 'photographer', 'year', 'q'])
      if (q[k]) params[k] = q[k]
    api
      .works(params)
      .then((d) => {
        setWorks(d.items)
        setTotal(d.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [qkey])

  function setFilter(key: string, value: string) {
    const next = { ...q }
    if (value) next[key] = value
    else delete next[key]
    const qs = Object.entries(next)
      .map(([k, v]) => k + '=' + encodeURIComponent(v))
      .join('&')
    navigate('/browse' + (qs ? '?' + qs : ''))
  }
  function onSearch() {
    setFilter('q', search.trim())
  }

  const active = q.theme || q.category || q.photographer || q.year || q.q

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div>
        <h1 className="font-serif text-3xl tracking-tight text-foreground">
          作品
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">共 {total} 幅</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
        <Select
          value={q.theme || ''}
          onChange={(e) => setFilter('theme', e.target.value)}
          className="w-auto min-w-[8rem]"
        >
          <option value="">全部主题</option>
          {themes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <Select
          value={q.category || ''}
          onChange={(e) => setFilter('category', e.target.value)}
          className="w-auto min-w-[8rem]"
        >
          <option value="">全部分类</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          value={q.photographer || ''}
          onChange={(e) => setFilter('photographer', e.target.value)}
          className="w-auto min-w-[8rem]"
        >
          <option value="">全部摄影师</option>
          {photographers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Select
          value={q.year || ''}
          onChange={(e) => setFilter('year', e.target.value)}
          className="w-auto min-w-[7rem]"
        >
          <option value="">全部年份</option>
          {years.map((y) => (
            <option key={y.id} value={String(y.year)}>
              {y.year}
            </option>
          ))}
        </Select>
        <div className="flex min-w-[12rem] flex-1 items-center gap-2">
          <Input
            placeholder="搜索标题 / 地点…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch()
            }}
          />
          <Button variant="outline" onClick={onSearch}>
            搜索
          </Button>
        </div>
        {active && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch('')
              navigate('/browse')
            }}
          >
            清除筛选
          </Button>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] animate-pulse rounded-lg bg-muted"
            />
          ))
        ) : works.length > 0 ? (
          works.map((w) => <WorkCard key={w.id} work={w} />)
        ) : (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            没有符合条件的作品
          </div>
        )}
      </div>
    </div>
  )
}
