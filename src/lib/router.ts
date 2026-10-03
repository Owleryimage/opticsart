import * as React from 'react'

export function parseHash() {
  const raw =
    typeof window !== 'undefined'
      ? window.location.hash.replace(/^#/, '') || '/'
      : '/'
  const [path, qs = ''] = raw.split('?')
  const query = Object.fromEntries(new URLSearchParams(qs))
  return { path: path || '/', query }
}

export function navigate(to: string) {
  if (typeof window !== 'undefined')
    window.location.hash = to.startsWith('#') ? to : '#' + to
}

export function useRoute() {
  const [r, setR] = React.useState(parseHash())
  React.useEffect(() => {
    const on = () => setR(parseHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return r
}

export interface MatchedRoute {
  name: string
  id?: string
  query: Record<string, string>
}

// 由后台配置的导航项计算跳转地址（hash 路由）。
// link 类型为外链，直接返回 target URL。
export function navHref(entry: {
  type: string
  target?: string
}): string {
  switch (entry.type) {
    case 'home':
      return '#/'
    case 'photographer':
      return entry.target ? '#/photographer/' + entry.target : '#/photographers'
    case 'activity':
      return entry.target ? '#/announcement/' + entry.target : '#/announcements'
    case 'exhibition':
      return entry.target ? '#/exhibition/' + entry.target : '#/exhibitions'
    case 'about':
      return '#/about'
    case 'admin':
      return '#/admin'
    case 'link':
      return entry.target || '#/'
    default:
      return '#/'
  }
}

export function matchRoute(path: string, query: Record<string, string>): MatchedRoute {
  if (path === '/' || path === '') return { name: 'home', query }
  const parts = path.split('/').filter(Boolean)
  const [seg, id] = parts
  switch (seg) {
    case 'browse':
      return { name: 'browse', query }
    case 'work':
      return { name: id ? 'work' : 'browse', id, query }
    case 'exhibition':
      return { name: id ? 'exhibition' : 'exhibitions', id, query }
    case 'photographer':
      return { name: id ? 'photographer' : 'photographers', id, query }
    case 'about':
      return { name: 'about', query }
    case 'announcement':
      return { name: id ? 'announcement' : 'announcements', id, query }
    case 'announcements':
      return { name: 'announcements', query }
    default:
      return { name: 'home', query }
  }
}
