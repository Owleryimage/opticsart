import * as React from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Announcement, Exhibition, NavEntry, Photographer, Settings } from '@/lib/types'

const TYPE_OPTIONS: { value: NavEntry['type']; label: string }[] = [
  { value: 'home', label: '首页（海报轮播）' },
  { value: 'photographer', label: '具体摄影师' },
  { value: 'activity', label: '具体活动项目' },
  { value: 'exhibition', label: '具体线上展览' },
  { value: 'about', label: '关于页' },
  { value: 'admin', label: '管理后台' },
  { value: 'link', label: '外链' },
]

const needsTarget = (t: string) =>
  t === 'photographer' || t === 'activity' || t === 'exhibition' || t === 'link'

function blankEntry(): NavEntry {
  return {
    id: 'new-' + Math.random().toString(36).slice(2, 8),
    label: '',
    type: 'photographer',
    target: '',
    order: 999,
  }
}

export default function NavManager() {
  const toast = useToast()
  const [settings, setSettings] = React.useState<Settings | null>(null)
  const [nav, setNav] = React.useState<NavEntry[]>([])
  const [phots, setPhots] = React.useState<Photographer[]>([])
  const [anncs, setAncs] = React.useState<Announcement[]>([])
  const [exhs, setExhs] = React.useState<Exhibition[]>([])
  const [editing, setEditing] = React.useState<NavEntry | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    Promise.all([
      api.config(),
      api.adminList('photographers'),
      api.adminList('announcements'),
      api.adminList('exhibitions'),
    ])
      .then(([cfg, p, a, e]) => {
        setSettings(cfg.settings)
        setNav([...(cfg.settings.nav || [])].sort((x, y) => (x.order ?? 0) - (y.order ?? 0)))
        setPhots(p)
        setAncs(a)
        setExhs(e)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function targetLabel(e: NavEntry) {
    if (e.type === 'photographer') return phots.find((x) => x.id === e.target)?.name || '—'
    if (e.type === 'activity') return anncs.find((x) => x.id === e.target)?.title || '—'
    if (e.type === 'exhibition') return exhs.find((x) => x.id === e.target)?.title || '—'
    if (e.type === 'link') return e.target || '—'
    return '—'
  }

  async function persist(next: NavEntry[]) {
    if (!settings) return
    setBusy(true)
    try {
      const saved = await api.settings({ ...settings, nav: next })
      setSettings(saved)
      setNav([...(saved.nav || [])].sort((x, y) => (x.order ?? 0) - (y.order ?? 0)))
      toast('导航架构已保存', 'success')
    } catch (e2: any) {
      toast(e2.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  function remove(id: string) {
    persist(nav.filter((x) => x.id !== id))
  }
  function move(id: string, dir: -1 | 1) {
    const sorted = [...nav].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const i = sorted.findIndex((x) => x.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= sorted.length) return
    const a = sorted[i]
    const b = sorted[j]
    const oa = a.order ?? 0
    a.order = b.order ?? 0
    b.order = oa
    persist([...sorted])
  }

  function saveEdit() {
    if (!editing || !editing.label.trim()) {
      toast('请填写标签', 'error')
      return
    }
    const base = nav.some((x) => x.id === editing.id)
      ? nav.map((x) => (x.id === editing.id ? { ...editing } : x))
      : [...nav, { ...editing, order: nav.length }]
    persist(base)
    setEditing(null)
  }

  if (loading)
    return <div className="text-muted-foreground">加载中…</div>

  return (
    <div className="max-w-3xl">
      <div className="flex items-end justify-between gap-4 pt-5">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-[-0.02em] text-foreground">
            导航架构
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            配置顶部 Banner 的菜单项：可指向具体摄影师、活动项目、线上展览或外链。前台首页据此切换展示。
          </p>
        </div>
        <Button
          onClick={() => setEditing(blankEntry())}
          disabled={busy}
        >
          + 新增菜单项
        </Button>
      </div>

      {/* 列表 */}
      <div className="rule-top mt-5 divide-y divide-border">
        {nav.length === 0 && (
          <div className="py-10 text-center text-muted-foreground">暂无菜单项</div>
        )}
        {nav.map((e) => (
          <div key={e.id} className="flex items-center gap-3 py-3">
            <div className="flex-1">
              <div className="font-medium text-foreground">{e.label}</div>
              <div className="mt-0.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {TYPE_OPTIONS.find((t) => t.value === e.type)?.label}
                {needsTarget(e.type) ? ' · ' + targetLabel(e) : ''}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => move(e.id, -1)}
                className="h-7 w-7 border border-border text-foreground transition-colors hover:bg-accent"
                aria-label="上移"
              >
                ↑
              </button>
              <button
                onClick={() => move(e.id, 1)}
                className="h-7 w-7 border border-border text-foreground transition-colors hover:bg-accent"
                aria-label="下移"
              >
                ↓
              </button>
              <button
                onClick={() => setEditing({ ...e })}
                className="h-7 border border-border px-2 text-xs text-foreground transition-colors hover:bg-accent"
              >
                编辑
              </button>
              <button
                onClick={() => remove(e.id)}
                className="h-7 border border-border px-2 text-xs text-swiss-red transition-colors hover:bg-accent"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 编辑面板 */}
      {editing && (
        <div className="rule-top mt-6 border border-border bg-card p-4">
          <div className="text-lg font-bold uppercase tracking-[-0.02em] text-foreground">
            {nav.some((x) => x.id === editing.id) ? '编辑菜单项' : '新增菜单项'}
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <Label>标签（菜单显示文字）</Label>
              <Input
                value={editing.label}
                onChange={(ev) => setEditing({ ...editing, label: ev.target.value })}
                placeholder="如：林深 / 2026 年度光影展"
              />
            </div>
            <div>
              <Label>类型</Label>
              <select
                value={editing.type}
                onChange={(ev) =>
                  setEditing({ ...editing, type: ev.target.value as NavEntry['type'] })
                }
                className="h-9 w-full border border-input bg-background px-2 text-foreground"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {editing.type === 'photographer' && (
              <div>
                <Label>指向摄影师</Label>
                <select
                  value={editing.target || ''}
                  onChange={(ev) => setEditing({ ...editing, target: ev.target.value })}
                  className="h-9 w-full border border-input bg-background px-2 text-foreground"
                >
                  <option value="">— 请选择 —</option>
                  {phots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {editing.type === 'activity' && (
              <div>
                <Label>指向活动项目（公告）</Label>
                <select
                  value={editing.target || ''}
                  onChange={(ev) => setEditing({ ...editing, target: ev.target.value })}
                  className="h-9 w-full border border-input bg-background px-2 text-foreground"
                >
                  <option value="">— 请选择 —</option>
                  {anncs.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                      {a.image ? '（含海报）' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {editing.type === 'exhibition' && (
              <div>
                <Label>指向线上展览</Label>
                <select
                  value={editing.target || ''}
                  onChange={(ev) => setEditing({ ...editing, target: ev.target.value })}
                  className="h-9 w-full border border-input bg-background px-2 text-foreground"
                >
                  <option value="">— 请选择 —</option>
                  {exhs.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {editing.type === 'link' && (
              <div>
                <Label>外链地址</Label>
                <Input
                  value={editing.target || ''}
                  onChange={(ev) => setEditing({ ...editing, target: ev.target.value })}
                  placeholder="https://"
                />
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button onClick={saveEdit} disabled={busy}>
                {busy ? '保存中…' : '保存'}
              </Button>
              <Button variant="outline" onClick={() => setEditing(null)} disabled={busy}>
                取消
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
