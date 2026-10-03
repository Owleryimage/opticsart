import * as React from 'react'
import { cn } from '@/lib/utils'
import { api, getToken, clearRepo, getRepo } from '@/lib/api'
import { verifyRepo } from '@/lib/gh'
import { useRoute, navigate } from '@/lib/router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ImageField } from '@/components/ImageField'
import { useToast } from '@/components/ui/toast'
import { CollectionManager } from './CollectionManager'
import NavManager from './NavManager'
import {
  ANNOUNCEMENTS,
  CATEGORIES,
  EXHIBITIONS,
  PHOTOGRAPHERS,
  THEMES,
  WORKS,
  YEARS,
} from './configs'

const NAV = [
  { key: '', label: '概览' },
  { key: 'nav', label: '导航架构' },
  { key: 'works', label: '作品' },
  { key: 'themes', label: '主题' },
  { key: 'categories', label: '分类' },
  { key: 'photographers', label: '摄影师' },
  { key: 'years', label: '年份' },
  { key: 'exhibitions', label: '展览' },
  { key: 'announcements', label: '公告' },
  { key: 'settings', label: '站点设置' },
  { key: 'github', label: 'GitHub 连接' },
]

export default function AdminApp() {
  const route = useRoute()
  const [auth, setAuth] = React.useState<'checking' | 'in' | 'out'>('checking')

  React.useEffect(() => {
    const t = getToken()
    if (!t) {
      setAuth('out')
      return
    }
    api
      .me()
      .then(() => setAuth('in'))
      .catch(() => {
        clearRepo()
        setAuth('out')
      })
  }, [])

  if (auth === 'checking')
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        验证中…
      </div>
    )
  if (auth === 'out') return <Login onOk={() => setAuth('in')} />

  const sub = route.path.startsWith('/admin/')
    ? route.path.slice('/admin/'.length)
    : ''
  return <AdminShell sub={sub} />
}

function Login({ onOk }: { onOk: () => void }) {
  const existing = getRepo()
  const [owner, setOwner] = React.useState(existing?.owner || '')
  const [repo, setRepoName] = React.useState(existing?.repo || '')
  const [branch, setBranch] = React.useState(existing?.branch || 'main')
  const [token, setTokenVal] = React.useState('')
  const [err, setErr] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const toast = useToast()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      await api.login({ owner, repo, branch: branch || 'main', token })
      toast('已连接 GitHub 仓库', 'success')
      onOk()
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm"
      >
        <h1 className="text-2xl font-bold uppercase tracking-[-0.02em] text-foreground">
          连接 GitHub 仓库
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          本站为纯静态站，内容与图片存放在你的 GitHub 仓库中。登录后，后台的增删改会直接提交为 Git 提交。
        </p>
        <div className="mt-5 space-y-3">
          <div>
            <Label>仓库拥有者（owner）</Label>
            <Input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="例如：your-name"
            />
          </div>
          <div>
            <Label>仓库名（repo）</Label>
            <Input
              value={repo}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="例如：opticsart-site"
            />
          </div>
          <div>
            <Label>分支</Label>
            <Input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
            />
          </div>
          <div>
            <Label>GitHub Token</Label>
            <Input
              type="password"
              value={token}
              onChange={(e) => setTokenVal(e.target.value)}
              placeholder="github_pat_… 或 ghp_…"
            />
          </div>
          {err && <div className="text-sm text-swiss-red">{err}</div>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? '连接中…' : '连接并进入后台'}
          </Button>
        </div>
        <div className="mt-4 space-y-1 text-xs text-muted-foreground">
          <div>
            Token 需要 Fine-grained PAT：对目标仓库授予 <b>Contents: Read and write</b> 权限。
          </div>
          <div>Token 仅保存在你的浏览器本地，不会上传到任何第三方。</div>
        </div>
      </form>
    </div>
  )
}


function AdminShell({ sub }: { sub: string }) {
  function logout() {
    clearRepo()
    navigate('/admin')
    window.location.reload()
  }
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <aside className="hidden w-56 shrink-0 border-r border-border p-4 md:block">
          <div className="font-serif text-lg text-foreground">管理后台</div>
          <nav className="mt-4 space-y-1">
            {NAV.map((n) => (
              <a
                key={n.key}
                href={'#/admin/' + n.key}
                className={cn(
                  'block rounded-md px-3 py-2 text-sm transition-colors',
                  sub === n.key
                    ? 'bg-accent font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-accent/50',
                )}
              >
                {n.label}
              </a>
            ))}
            <a
              href="#/"
              className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50"
            >
              ← 返回站点
            </a>
            <button
              onClick={logout}
              className="block w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/50"
            >
              退出登录
            </button>
          </nav>
        </aside>
        <div className="flex-1">
          <header className="flex items-center justify-between border-b border-border px-4 py-3 md:px-6">
            <div className="font-serif text-lg text-foreground md:hidden">
              管理后台
            </div>
            <div className="text-sm text-muted-foreground md:ml-auto">
              内容管理
            </div>
          </header>
          <div className="p-4 md:p-6">
            <AdminContent sub={sub} />
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminContent({ sub }: { sub: string }) {
  function logout() {
    clearRepo()
    navigate('/admin')
    window.location.reload()
  }
  switch (sub) {
    case 'works':
      return <CollectionManager config={WORKS} />
    case 'themes':
      return <CollectionManager config={THEMES} />
    case 'categories':
      return <CollectionManager config={CATEGORIES} />
    case 'photographers':
      return <CollectionManager config={PHOTOGRAPHERS} />
    case 'years':
      return <CollectionManager config={YEARS} />
    case 'exhibitions':
      return <CollectionManager config={EXHIBITIONS} />
    case 'announcements':
      return <CollectionManager config={ANNOUNCEMENTS} />
    case 'nav':
      return <NavManager />
    case 'settings':
      return <SettingsForm />
    case 'github':
      return <GitHubForm onDisconnect={logout} />
    default:
      return <Dashboard />
  }
}

function Dashboard() {
  const [stats, setStats] = React.useState<Record<string, number> | null>(null)
  React.useEffect(() => {
    Promise.all([
      api.adminList('works'),
      api.adminList('photographers'),
      api.adminList('themes'),
      api.adminList('exhibitions'),
      api.adminList('announcements'),
      api.adminList('categories'),
    ])
      .then(([w, p, t, e, a, c]) =>
        setStats({
          works: w.length,
          photographers: p.length,
          themes: t.length,
          exhibitions: e.length,
          announcements: a.length,
          categories: c.length,
        }),
      )
      .catch(() => {})
  }, [])

  const cards = [
    ['作品', stats?.works, '#/admin/works'],
    ['摄影师', stats?.photographers, '#/admin/photographers'],
    ['主题', stats?.themes, '#/admin/themes'],
    ['分类', stats?.categories, '#/admin/categories'],
    ['展览', stats?.exhibitions, '#/admin/exhibitions'],
    ['公告', stats?.announcements, '#/admin/announcements'],
  ]
  return (
    <div>
      <h2 className="font-serif text-2xl text-foreground">概览</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        在左侧管理作品、主题、展览与公告，保存后前台自动更新。
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {cards.map(([label, val, link]) => (
          <a
            key={label as string}
            href={link as string}
            className="rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md"
          >
            <div className="text-3xl font-semibold text-foreground">
              {val ?? '—'}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {label as string}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

function SettingsForm() {
  const toast = useToast()
  const [s, setS] = React.useState<any>(null)
  const [busy, setBusy] = React.useState(false)
  React.useEffect(() => {
    api
      .config()
      .then((c) => setS(c.settings))
      .catch(() => {})
  }, [])

  function set(k: string, v: any) {
    setS((x: any) => ({ ...x, [k]: v }))
  }
  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.settings(s)
      toast('站点设置已保存', 'success')
    } catch (e2: any) {
      toast(e2.message, 'error')
    } finally {
      setBusy(false)
    }
  }
  if (!s) return <div className="text-muted-foreground">加载中…</div>
  return (
    <form onSubmit={save} className="max-w-xl space-y-4">
      <h2 className="font-serif text-2xl text-foreground">站点设置</h2>
      <div>
        <Label>站点名称</Label>
        <Input
          value={s.siteName || ''}
          onChange={(e) => set('siteName', e.target.value)}
        />
      </div>
      <div>
        <Label>社团名称</Label>
        <Input
          value={s.societyName || ''}
          onChange={(e) => set('societyName', e.target.value)}
        />
      </div>
      <div>
        <Label>站点简介</Label>
        <Textarea
          value={s.siteDescription || ''}
          onChange={(e) => set('siteDescription', e.target.value)}
        />
      </div>
      <div>
        <Label>社团介绍（关于页）</Label>
        <Textarea
          value={s.about || ''}
          onChange={(e) => set('about', e.target.value)}
        />
      </div>
      <div>
        <Label>联系方式</Label>
        <Textarea
          value={s.contact || ''}
          onChange={(e) => set('contact', e.target.value)}
        />
      </div>
      <div>
        <Label>站点 Logo（可选）</Label>
        <ImageField
          value={s.logo}
          onChange={(v) => set('logo', v)}
          label="Logo 图片"
        />
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? '保存中…' : '保存'}
      </Button>
    </form>
  )
}

function GitHubForm({ onDisconnect }: { onDisconnect: () => void }) {
  const cfg = getRepo()
  const toast = useToast()
  const [state, setState] = React.useState<'idle' | 'checking'>('idle')
  const [info, setInfo] = React.useState('')

  async function test() {
    if (!cfg) return
    setState('checking')
    try {
      const name = await verifyRepo(cfg)
      setInfo(name)
      toast('连接正常', 'success')
    } catch (e: any) {
      setInfo('')
      toast(e.message, 'error')
    } finally {
      setState('idle')
    }
  }

  if (!cfg)
    return <div className="text-muted-foreground">尚未连接 GitHub 仓库。</div>

  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-2xl font-bold uppercase tracking-[-0.02em] text-foreground">
        GitHub 连接
      </h2>
      <p className="text-sm text-muted-foreground">
        后台的所有修改（内容、图片、导航架构）都会直接提交到该仓库，
        前台经 jsDelivr CDN 读取，更新通常在数分钟内生效。
      </p>
      <dl className="divide-y divide-border border border-border">
        {(
          [
            ['拥有者', cfg.owner],
            ['仓库', cfg.repo],
            ['分支', cfg.branch],
            ['Token', cfg.token ? '已保存（********）' : '未设置'],
          ] as [string, string][]
        ).map(([k, v]) => (
          <div key={k} className="flex items-center justify-between px-4 py-3">
            <dt className="text-sm text-muted-foreground">{k}</dt>
            <dd className="text-sm text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
      {info && (
        <div className="text-sm text-foreground">已验证仓库：{info}</div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button onClick={test} disabled={state === 'checking'}>
          {state === 'checking' ? '检测中…' : '测试连接'}
        </Button>
        <Button variant="outline" onClick={onDisconnect}>
          断开连接
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">
        提示：图片保留 2560px（2K）长边分辨率，无需第三方图床。
      </div>
    </div>
  )
}
