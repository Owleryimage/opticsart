// 零依赖 JSON 数据仓储：加载 / 保存 / 种子数据。
// 生产环境如要更高并发或更大体量，可把本文件替换为云数据库实现，对外接口不变。
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const __dirname = dirname(fileURLToPath(import.meta.url))
export const DATA_DIR = join(__dirname, 'data')
export const UPLOAD_DIR = join(DATA_DIR, 'uploads')
export const DB_FILE = join(DATA_DIR, 'db.json')

const DEFAULT_SETTINGS = {
  siteName: 'OpticsArt',
  societyName: 'OpticsArt光学视觉艺术协会',
  siteDescription: '一个由摄影与视觉艺术爱好者组成的专业协会，记录光线、时间与真实的瞬间。',
  about:
    'OpticsArt 光学视觉艺术协会汇聚了热衷于用影像与光学表达世界的创作者。我们举办展览、工作坊与采风活动，致力于让每一帧画面都承载思考。',
  contact: '邮箱：contact@opticsart.example.com　地址：示例市示例区光学路 1 号',
}

function emptyDb() {
  return {
    settings: { ...DEFAULT_SETTINGS },
    admin: null,
    themes: [],
    categories: [],
    photographers: [],
    years: [],
    works: [],
    exhibitions: [],
    announcements: [],
  }
}

let db = null

// 保证 settings.nav 存在：若无（旧数据 / 首次运行），依据现有内容生成一套
// 默认顶部 Banner 架构（首页 + 具体摄影师 + 具体活动 + 具体展览 + 后台）。
// 后台一旦保存过 nav，这里便不再覆盖。
export function ensureNav(database) {
  const nav = database.settings && database.settings.nav
  if (Array.isArray(nav) && nav.length) return
  const entries = []
  entries.push({ id: newId(), label: '首页', type: 'home', order: 0 })
  database.photographers.slice(0, 3).forEach((p, i) =>
    entries.push({
      id: newId(),
      label: p.name,
      type: 'photographer',
      target: p.id,
      order: i + 1,
    }),
  )
  database.announcements
    .filter((a) => a.published && a.image)
    .slice(0, 3)
    .forEach((a, i) =>
      entries.push({
        id: newId(),
        label: a.title,
        type: 'activity',
        target: a.id,
        order: 100 + i,
      }),
    )
  database.exhibitions
    .filter((e) => e.published)
    .slice(0, 3)
    .forEach((e, i) =>
      entries.push({
        id: newId(),
        label: e.title,
        type: 'exhibition',
        target: e.id,
        order: 200 + i,
      }),
    )
  entries.push({ id: newId(), label: '后台', type: 'admin', order: 999 })
  database.settings = database.settings || {}
  database.settings.nav = entries
}

export function loadDB() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true })
  if (existsSync(DB_FILE)) {
    try {
      db = JSON.parse(readFileSync(DB_FILE, 'utf8'))
    } catch {
      db = emptyDb()
    }
  } else {
    db = emptyDb()
  }
  for (const k of Object.keys(emptyDb())) {
    if (!(k in db)) db[k] = emptyDb()[k]
  }
  return db
}

export function getDB() {
  if (!db) loadDB()
  return db
}

export function saveDB() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
}

export function newId() {
  // 短 id，便于在 URL 中阅读
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  ).toUpperCase()
}

export { DEFAULT_SETTINGS }
