// 纯静态站的数据层：内容存放在 GitHub 仓库的 data/db.json 中，
// 前台经 jsDelivr CDN 加速读取，后台通过 GitHub Contents API 写入（浏览器端 Git CMS）。
import type {
  Announcement,
  Category,
  Exhibition,
  HomeData,
  Photographer,
  Settings,
  Theme,
  Work,
  YearItem,
} from './types'
import { DATA_PATH, UPLOAD_DIR, cdnBase, getRepo, setRepo, clearRepo } from './config'
import { readJsonFile, uploadImageToRepo, verifyRepo, writeTextFile } from './gh'

// ---------- 兼容旧调用：Token 存取 ----------
export function getToken(): string | null {
  return getRepo()?.token || null
}
export function setToken(t: string | null) {
  if (!t) return
  const c = getRepo() || { owner: '', repo: '', branch: 'main' }
  setRepo({ ...c, token: t })
}
export { getRepo, setRepo, clearRepo, verifyRepo }
export type { RepoConfig } from './config'

// ---------- 基础读取 ----------
async function fetchJson(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`数据加载失败 (${res.status})`)
  return res.json()
}

const EMPTY_DB = {
  settings: {} as Settings,
  themes: [] as Theme[],
  categories: [] as Category[],
  photographers: [] as Photographer[],
  years: [] as YearItem[],
  works: [] as Work[],
  exhibitions: [] as Exhibition[],
  announcements: [] as Announcement[],
}

function normalize(db: any) {
  const d = { ...EMPTY_DB, ...(db || {}) }
  for (const k of Object.keys(EMPTY_DB)) {
    if (!Array.isArray((d as any)[k]) && k !== 'settings')
      (d as any)[k] = []
  }
  d.settings = d.settings || ({} as Settings)
  return d
}

let cache: any = null
let cacheKey = ''

/** 前台读取（优先 CDN，缓存优先，性能好） */
export async function loadDb(force = false) {
  const cfg = getRepo()
  const key = cfg ? `${cfg.owner}/${cfg.repo}@${cfg.branch}` : 'local'
  if (!force && cache && cacheKey === key) return cache
  let raw: any
  if (cfg) {
    raw = await fetchJson(`${cdnBase(cfg)}/${DATA_PATH}`)
  } else {
    // 未连接仓库时使用内置兜底数据；用相对路径以兼容 Pages 的 /<repo>/ 子路径部署
    raw = await fetchJson('./data/db.json')
    raw = rewriteAssetPaths(raw)
  }
  cache = normalize(raw)
  cacheKey = key
  return cache
}

/** 兜底数据里的 /uploads/… 改为相对路径，避免在子路径部署时 404 */
function rewriteAssetPaths(raw: any) {
  if (!raw || typeof raw !== 'object') return raw
  for (const key of Object.keys(raw)) {
    const v = raw[key]
    if (Array.isArray(v)) {
      raw[key] = v.map((item) =>
        item && typeof item === 'object' ? mapUploadPaths(item) : item,
      )
    } else if (typeof v === 'string' && v.startsWith('/uploads/')) {
      raw[key] = '.' + v
    }
  }
  return raw
}
function mapUploadPaths(obj: any) {
  for (const k of Object.keys(obj)) {
    if (typeof obj[k] === 'string' && obj[k].startsWith('/uploads/'))
      obj[k] = '.' + obj[k]
  }
  return obj
}

export async function refreshDb() {
  return loadDb(true)
}

/** 后台读取（绕过 CDN 缓存，保证读到最新；仓库尚无数据文件时回落到内置数据） */
async function readLive() {
  const cfg = requireRepo()
  try {
    const { json } = await readJsonFile(cfg, DATA_PATH)
    if (json) return normalize(json)
  } catch (e) {
    // 回落到 CDN / 本地
  }
  try {
    return normalize(await fetchJson(`${cdnBase(cfg)}/${DATA_PATH}`))
  } catch {
    return normalize(await fetchJson('/data/db.json').catch(() => EMPTY_DB))
  }
}

function requireRepo() {
  const cfg = getRepo()
  if (!cfg) throw new Error('尚未连接 GitHub 仓库，请先登录后台并完成连接')
  return cfg
}

// ---------- 引用解析（原本在服务端完成，现移至客户端） ----------
function decorateWork(w: any, db: any) {
  const t = db.themes.find((x: any) => x.id === w.themeId)
  const c = db.categories.find((x: any) => x.id === w.categoryId)
  const p = db.photographers.find((x: any) => x.id === w.photographerId)
  const y = db.years.find((x: any) => x.year === w.year)
  return {
    ...w,
    theme: t ? { id: t.id, name: t.name } : null,
    category: c ? { id: c.id, name: c.name } : null,
    photographer: p ? { id: p.id, name: p.name, avatar: p.avatar } : null,
    yearObj: y ? { id: y.id, year: y.year } : { year: w.year },
  }
}

// ---------- 图片上传：把表单里的 base64 提交到仓库，换成 CDN 地址 ----------
async function uploadEmbedded(payload: any) {
  const cfg = requireRepo()
  for (const key of Object.keys(payload || {})) {
    const v = payload[key]
    if (typeof v !== 'string' || !v.startsWith('data:image/')) continue
    const m = /^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/.exec(v)
    if (!m) continue
    const mime = m[1].toLowerCase()
    const ext = mime === 'jpeg' ? 'jpg' : mime === 'svg+xml' ? 'svg' : mime
    const name = `img-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`
    const dest = `${UPLOAD_DIR}/${name}`
    await uploadImageToRepo(cfg, dest, m[2])
    payload[key] = `${cdnBase(cfg)}/${dest}`
  }
  return payload
}

function newId() {
  return (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)).toUpperCase()
}

// ---------- 写：读取远端 -> 变更 -> 提交 ----------
async function commitDb(mutate: (db: any) => void, message: string) {
  const cfg = requireRepo()
  let sha: string | undefined
  let db: any
  try {
    const r = await readJsonFile(cfg, DATA_PATH)
    sha = r.sha
    db = r.json ? normalize(r.json) : null
  } catch {
    db = null
  }
  if (!db) db = normalize(await fetchJson('/data/db.json').catch(() => EMPTY_DB))
  mutate(db)
  await writeTextFile(cfg, DATA_PATH, JSON.stringify(db, null, 2), sha, message)
  cacheKey = '' // 让前台下次读取刷新
}

// ---------- 对外：完整保持原有调用签名 ----------
export const api = {
  // 公开
  async home(): Promise<HomeData> {
    const db = await loadDb()
    const byOrder = (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
    const anns = db.announcements
      .filter((a: any) => a.published)
      .sort(
        (a: any, b: any) =>
          (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt,
      )
    return {
      settings: db.settings,
      themes: [...db.themes].sort(byOrder),
      categories: [...db.categories].sort(byOrder),
      photographers: [...db.photographers].sort(byOrder),
      years: [...db.years].sort((a: any, b: any) => b.year - a.year),
      featuredWorks: db.works
        .filter((w: any) => w.published && w.featured)
        .sort(byOrder)
        .map((w: any) => decorateWork(w, db)),
      exhibitions: db.exhibitions
        .filter((e: any) => e.published)
        .sort((a: any, b: any) =>
          (a.startDate || '').localeCompare(b.startDate || ''),
        )
        .map((e: any) => ({
          ...e,
          works: (e.workIds || [])
            .map((id: string) => db.works.find((w: any) => w.id === id))
            .filter(Boolean)
            .map((w: any) => decorateWork(w, db)),
        })),
      announcements: anns.slice(0, 8),
      posters: anns.filter((a: any) => a.image),
      counts: {
        works: db.works.filter((w: any) => w.published).length,
        photographers: db.photographers.length,
        themes: db.themes.length,
        exhibitions: db.exhibitions.filter((e: any) => e.published).length,
      },
    }
  },
  async config() {
    const db = await loadDb()
    return { settings: db.settings }
  },
  async themes() {
    const db = await loadDb()
    return [...db.themes].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
  },
  async categories() {
    const db = await loadDb()
    return [...db.categories].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
  },
  async photographers() {
    const db = await loadDb()
    return [...db.photographers].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
  },
  async years() {
    const db = await loadDb()
    return [...db.years].sort((a: any, b: any) => b.year - a.year)
  },
  async works(q?: Record<string, string>) {
    const db = await loadDb()
    let list = db.works.filter((w: any) => w.published)
    const kw = q?.q?.toLowerCase()
    if (q?.theme) list = list.filter((w: any) => w.themeId === q.theme)
    if (q?.category) list = list.filter((w: any) => w.categoryId === q.category)
    if (q?.photographer)
      list = list.filter((w: any) => w.photographerId === q.photographer)
    if (q?.year) list = list.filter((w: any) => String(w.year) === q.year)
    if (q?.featured === '1') list = list.filter((w: any) => w.featured)
    if (kw)
      list = list.filter(
        (w: any) =>
          (w.title || '').toLowerCase().includes(kw) ||
          (w.description || '').toLowerCase().includes(kw) ||
          (w.location || '').toLowerCase().includes(kw),
      )
    return {
      total: list.length,
      items: list
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        .map((w: any) => decorateWork(w, db)),
    }
  },
  async work(id: string) {
    const db = await loadDb()
    const w = db.works.find((x: any) => x.id === id)
    if (!w) throw new Error('not_found')
    return decorateWork(w, db)
  },
  async exhibitions() {
    const db = await loadDb()
    return db.exhibitions
      .filter((e: any) => e.published)
      .sort((a: any, b: any) => (a.startDate || '').localeCompare(b.startDate || ''))
  },
  async exhibition(id: string) {
    const db = await loadDb()
    const e = db.exhibitions.find((x: any) => x.id === id)
    if (!e) throw new Error('not_found')
    return {
      ...e,
      works: (e.workIds || [])
        .map((i: string) => db.works.find((w: any) => w.id === i))
        .filter(Boolean)
        .map((w: any) => decorateWork(w, db)),
    }
  },
  async announcements() {
    const db = await loadDb()
    return db.announcements
      .filter((a: any) => a.published)
      .sort(
        (a: any, b: any) =>
          (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt,
      )
  },
  async announcement(id: string) {
    const db = await loadDb()
    const a = db.announcements.find((x: any) => x.id === id)
    if (!a) throw new Error('not_found')
    return a
  },

  // 后台（直接向 GitHub 提交通改）
  login: async (cfg: { owner: string; repo: string; branch: string; token: string }) => {
    await verifyRepo(cfg)
    setRepo(cfg)
    return { ok: true }
  },
  me: async () => {
    const cfg = requireRepo()
    await verifyRepo(cfg)
    return { username: `${cfg.owner}/${cfg.repo}` }
  },
  async adminList(name: string) {
    const db = await readLive()
    return (db as any)[name] || []
  },
  async adminCreate(name: string, body: any) {
    const payload = await uploadEmbedded({ ...body })
    const item = {
      ...payload,
      id: newId(),
      order: payload.order ?? 0,
      createdAt: payload.createdAt ?? Date.now(),
    }
    await commitDb((db) => {
      db[name] = db[name] || []
      db[name].push(item)
    }, `Create ${name}: ${item.title || item.name || item.id}`)
    return item
  },
  async adminUpdate(name: string, id: string, body: any) {
    const payload = await uploadEmbedded({ ...body })
    let result: any = null
    await commitDb((db) => {
      db[name] = db[name] || []
      const i = db[name].findIndex((x: any) => x.id === id)
      if (i >= 0) {
        result = { ...db[name][i], ...payload, id }
        db[name][i] = result
      }
    }, `Update ${name}: ${id}`)
    return result
  },
  async adminDelete(name: string, id: string) {
    await commitDb((db) => {
      db[name] = (db[name] || []).filter((x: any) => x.id !== id)
    }, `Delete ${name}: ${id}`)
    return { ok: true }
  },
  async settings(body: Partial<Settings>) {
    const payload = await uploadEmbedded({ ...body })
    let saved: any = null
    await commitDb((db) => {
      db.settings = { ...db.settings, ...payload }
      saved = db.settings
    }, 'Update site settings')
    return saved
  },
}
