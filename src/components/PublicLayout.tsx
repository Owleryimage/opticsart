import * as React from 'react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { useRoute, navHref } from '@/lib/router'
import type { NavEntry } from '@/lib/types'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const route = useRoute()
  const [cfg, setCfg] = React.useState<{ settings: any } | null>(null)
  React.useEffect(() => {
    api.config().then(setCfg).catch(() => {})
  }, [])

  const siteName = cfg?.settings?.siteName || '光影视界'
  const societyName = cfg?.settings?.societyName || '光影摄影社团'
  const nav: NavEntry[] = cfg?.settings?.nav || []

  // 当前激活项：依据路由与各导航项的目标路径比对
  const activePath = route.path || '/'
  function isActive(e: NavEntry) {
    const href = navHref(e).replace(/^#/, '')
    if (e.type === 'home') return activePath === '/' || activePath === ''
    if (e.type === 'admin') return activePath.startsWith('/admin')
    return href === activePath
  }

  // 首页只展示图片与菜单，隐藏页脚文字块
  const isHome = activePath === '/' || activePath === ''

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* 顶部 Banner：瑞士国际主义网格——左侧字标，右侧大写字距导航 */}
      <header className="sticky top-0 z-40 border-b border-foreground bg-background">
        <div className="shell flex h-14 items-center justify-between gap-4">
          <a
            href="#/"
            className="flex items-baseline gap-2 text-foreground"
            aria-label="返回首页"
          >
            <span className="inline-block h-2.5 w-2.5 bg-swiss-red" />
            <span className="text-lg font-bold uppercase tracking-[-0.03em]">
              {siteName}
            </span>
          </a>

          <nav className="flex items-center gap-1 overflow-x-auto">
            {nav.map((e) => {
              const href = navHref(e)
              const active = isActive(e)
              const external = e.type === 'link'
              return (
                <a
                  key={e.id}
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  className={cn(
                    'whitespace-nowrap px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] transition-colors',
                    active
                      ? 'bg-foreground text-background'
                      : 'text-foreground/70 hover:text-foreground',
                  )}
                >
                  {e.label}
                </a>
              )
            })}
          </nav>
        </div>
      </header>

      <main className={cn('flex-1', isHome && 'flex flex-col')}>{children}</main>

      {!isHome && (
        <footer className="rule-top">
          <div className="shell flex flex-col gap-3 py-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-base font-bold uppercase tracking-[-0.02em] text-foreground">
                {societyName}
              </div>
              <div className="mt-2 max-w-md whitespace-pre-line text-sm text-muted-foreground">
                {cfg?.settings?.contact || ''}
              </div>
            </div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              © {new Date().getFullYear()} {siteName}
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
