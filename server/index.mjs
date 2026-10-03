// 极简摄影作品站 —— 零依赖 Node 服务
// 职责：REST API（公开 + 后台鉴权 CRUD）、图片落盘、静态资源与 SPA 托管。
// 部署形态：单进程监听 PORT，同一端口同时提供 API 与前端。
import { createServer } from 'node:http'
import {
  writeFileSync,
  existsSync,
  statSync,
  readFileSync,
  mkdirSync,
} from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname } from 'node:path'
import {
  getDB,
  saveDB,
  newId,
  UPLOAD_DIR,
  DATA_DIR,
  loadDB,
  ensureNav,
} from './store.mjs'
import { hashPassword, verifyPassword, signToken, verifyToken } from './auth.mjs'
import { seedIfEmpty } from './seed.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST_DIR = join(__dirname, '..', 'dist')
const PORT = Number(process.env.PORT) || 3000
const MAX_BODY = 16 * 1024 * 1024 // 16MB

// ---------- 基础工具 ----------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

function sendFile(res, filePath) {
  try {
    const buf = readFileSync(filePath)
    const ext = filePath.slice(filePath.lastIndexOf('.'))
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': buf.length,
      'Cache-Control': 'public, max-age=3600',
    })
    res.end(buf)
  } catch {
    res.writeHead(404)
    res.end('not found')
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > MAX_BODY) {
        reject(new Error('body_too_large'))
        req.destroy()
      } else chunks.push(c)
    })
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(new Error('invalid_json'))
      }
    })
    req.on('error', reject)
  })
}

function storeImage(dataUrl) {
  const m = /^data:(image\/(png|jpe?g|webp|gif|svg\+xml));base64,(.+)$/i.exec(
    dataUrl,
  )
  if (!m) return null
  const ext = m[2] === 'jpeg' ? 'jpg' : m[2] === 'svg+xml' ? 'svg' : m[2]
  const buf = Buffer.from(m[3], 'base64')
  if (buf.length > 16 * 1024 * 1024) throw new Error('image_too_large')
  const name = `img-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true })
  writeFileSync(join(UPLOAD_DIR, name), buf)
  return `/uploads/${name}`
}

function processImages(obj, fields) {
  for (const f of fields) {
    if (typeof obj[f] === 'string' && obj[f].startsWith('data:image/')) {
      const stored = storeImage(obj[f])
      if (stored) obj[f] = stored
    }
  }
  return obj
}

// ---------- 路由 ----------
const routes = []
function add(method, pattern, handler) {
  const keys = []
  const re = new RegExp(
    '^' +
      pattern.replace(/:[^/]+/g, (m) => {
        keys.push(m.slice(1))
        return '([^/]+)'
      }) +
      '$',
  )
  routes.push({ method, re, keys, handler })
}

function requireAuth(handler) {
  return (ctx) => {
    const auth = ctx.req.headers['authorization'] || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    const payload = token ? verifyToken(token) : null
    if (!payload) return sendJson(ctx.res, 401, { error: 'unauthorized' })
    ctx.user = payload
    return handler(ctx)
  }
}

// ---------- 引用解析 ----------
function decorateWork(w) {
  const db = getDB()
  const t = db.themes.find((x) => x.id === w.themeId)
  const c = db.categories.find((x) => x.id === w.categoryId)
  const p = db.photographers.find((x) => x.id === w.photographerId)
  const y = db.years.find((x) => x.year === w.year)
  return {
    ...w,
    theme: t ? { id: t.id, name: t.name } : null,
    category: c ? { id: c.id, name: c.name } : null,
    photographer: p ? { id: p.id, name: p.name, avatar: p.avatar } : null,
    yearObj: y ? { id: y.id, year: y.year } : { year: w.year },
  }
}

// ================= 公开接口 =================
add('GET', '/api/health', (ctx) => sendJson(ctx.res, 200, { ok: true }))

add('GET', '/api/config', (ctx) => {
  const db = getDB()
  sendJson(ctx.res, 200, {
    settings: db.settings,
    counts: {
      works: db.works.filter((w) => w.published).length,
      photographers: db.photographers.length,
      themes: db.themes.length,
      exhibitions: db.exhibitions.filter((e) => e.published).length,
    },
  })
})

add('GET', '/api/home', (ctx) => {
  const db = getDB()
  const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0)
  sendJson(ctx.res, 200, {
    settings: db.settings,
    themes: [...db.themes].sort(byOrder),
    categories: [...db.categories].sort(byOrder),
    photographers: [...db.photographers].sort(byOrder),
    years: [...db.years].sort((a, b) => b.year - a.year),
    featuredWorks: db.works
      .filter((w) => w.published && w.featured)
      .sort(byOrder)
      .map(decorateWork),
    exhibitions: db.exhibitions
      .filter((e) => e.published)
      .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))
      .map((e) => ({
        ...e,
        works: (e.workIds || [])
          .map((id) => db.works.find((w) => w.id === id))
          .filter(Boolean)
          .map(decorateWork),
      })),
    announcements: db.announcements
      .filter((a) => a.published)
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt)
      .slice(0, 8),
    // 首页轮播：当前活动海报（已发布且带图片），置顶优先
    posters: db.announcements
      .filter((a) => a.published && a.image)
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt),
    counts: {
      works: db.works.filter((w) => w.published).length,
      photographers: db.photographers.length,
      themes: db.themes.length,
      exhibitions: db.exhibitions.filter((e) => e.published).length,
    },
  })
})

add('GET', '/api/themes', (ctx) =>
  sendJson(
    ctx.res,
    200,
    [...getDB().themes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  ),
)
add('GET', '/api/categories', (ctx) =>
  sendJson(
    ctx.res,
    200,
    [...getDB().categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  ),
)
add('GET', '/api/photographers', (ctx) =>
  sendJson(
    ctx.res,
    200,
    [...getDB().photographers].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  ),
)
add('GET', '/api/years', (ctx) =>
  sendJson(ctx.res, 200, [...getDB().years].sort((a, b) => b.year - a.year)),
)

add('GET', '/api/works', (ctx) => {
  const db = getDB()
  const q = ctx.query
  let list = db.works.filter((w) => w.published)
  if (q.get('theme')) list = list.filter((w) => w.themeId === q.get('theme'))
  if (q.get('category')) list = list.filter((w) => w.categoryId === q.get('category'))
  if (q.get('photographer')) list = list.filter((w) => w.photographerId === q.get('photographer'))
  if (q.get('year')) list = list.filter((w) => String(w.year) === q.get('year'))
  if (q.get('featured') === '1') list = list.filter((w) => w.featured)
  if (q.get('q')) {
    const kw = q.get('q').toLowerCase()
    list = list.filter(
      (w) =>
        (w.title || '').toLowerCase().includes(kw) ||
        (w.description || '').toLowerCase().includes(kw) ||
        (w.location || '').toLowerCase().includes(kw),
    )
  }
  list = list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || b.createdAt - a.createdAt)
  const total = list.length
  const limit = Math.min(Number(q.get('limit')) || 60, 200)
  const offset = Number(q.get('offset')) || 0
  sendJson(ctx.res, 200, {
    total,
    items: list.slice(offset, offset + limit).map(decorateWork),
  })
})

add('GET', '/api/works/:id', (ctx) => {
  const w = getDB().works.find((x) => x.id === ctx.params.id)
  if (!w || !w.published) return sendJson(ctx.res, 404, { error: 'not_found' })
  sendJson(ctx.res, 200, decorateWork(w))
})

add('GET', '/api/exhibitions', (ctx) =>
  sendJson(
    ctx.res,
    200,
    getDB()
      .exhibitions.filter((e) => e.published)
      .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || '')),
  ),
)

add('GET', '/api/exhibitions/:id', (ctx) => {
  const db = getDB()
  const e = db.exhibitions.find((x) => x.id === ctx.params.id)
  if (!e || !e.published) return sendJson(ctx.res, 404, { error: 'not_found' })
  sendJson(ctx.res, 200, {
    ...e,
    works: (e.workIds || [])
      .map((id) => db.works.find((w) => w.id === id))
      .filter(Boolean)
      .map(decorateWork),
  })
})

add('GET', '/api/announcements', (ctx) =>
  sendJson(
    ctx.res,
    200,
    getDB()
      .announcements.filter((a) => a.published)
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt),
  ),
)

add('GET', '/api/announcements/:id', (ctx) => {
  const db = getDB()
  const a = db.announcements.find((x) => x.id === ctx.params.id)
  if (!a || !a.published) return sendJson(ctx.res, 404, { error: 'not_found' })
  sendJson(ctx.res, 200, a)
})

// ================= 后台接口 =================
add('POST', '/api/admin/login', (ctx) => {
  const db = getDB()
  const { username, password } = ctx.body
  if (!db.admin) return sendJson(ctx.res, 400, { error: 'no_admin' })
  if (
    username !== db.admin.username ||
    !verifyPassword(password || '', db.admin.salt, db.admin.hash)
  )
    return sendJson(ctx.res, 401, { error: 'invalid_credentials' })
  const token = signToken({ sub: db.admin.username })
  sendJson(ctx.res, 200, { token, username: db.admin.username })
})

add('GET', '/api/admin/me', requireAuth((ctx) =>
  sendJson(ctx.res, 200, { username: ctx.user.sub }),
))

add('POST', '/api/admin/password', requireAuth((ctx) => {
  const db = getDB()
  const { oldPassword, newPassword } = ctx.body
  if (!verifyPassword(oldPassword || '', db.admin.salt, db.admin.hash))
    return sendJson(ctx.res, 400, { error: 'old_password_wrong' })
  if (!newPassword || String(newPassword).length < 6)
    return sendJson(ctx.res, 400, { error: 'weak_password' })
  const { salt, hash } = hashPassword(newPassword)
  db.admin.salt = salt
  db.admin.hash = hash
  saveDB()
  sendJson(ctx.res, 200, { ok: true })
}))

add('POST', '/api/admin/settings', requireAuth((ctx) => {
  const db = getDB()
  const body = { ...ctx.body }
  processImages(body, ['logo', 'coverImage'])
  db.settings = { ...db.settings, ...body }
  saveDB()
  sendJson(ctx.res, 200, db.settings)
}))

// 通用集合 CRUD（后台）
const COLLECTIONS = {
  themes: ['coverImage'],
  categories: [],
  photographers: ['avatar'],
  years: [],
  works: ['image'],
  exhibitions: ['coverImage'],
  announcements: [],
}
for (const [name, imageFields] of Object.entries(COLLECTIONS)) {
  add('GET', `/api/admin/${name}`, requireAuth((ctx) =>
    sendJson(ctx.res, 200, getDB()[name]),
  ))
  add('POST', `/api/admin/${name}`, requireAuth((ctx) => {
    const item = { ...ctx.body }
    processImages(item, imageFields)
    item.id = newId()
    if (!('createdAt' in item)) item.createdAt = Date.now()
    if (item.order == null) item.order = getDB()[name].length
    getDB()[name].push(item)
    saveDB()
    sendJson(ctx.res, 201, item)
  }))
  add('PUT', `/api/admin/${name}/:id`, requireAuth((ctx) => {
    const list = getDB()[name]
    const idx = list.findIndex((x) => x.id === ctx.params.id)
    if (idx < 0) return sendJson(ctx.res, 404, { error: 'not_found' })
    const item = { ...list[idx], ...ctx.body, id: list[idx].id }
    processImages(item, imageFields)
    list[idx] = item
    saveDB()
    sendJson(ctx.res, 200, item)
  }))
  add('DELETE', `/api/admin/${name}/:id`, requireAuth((ctx) => {
    const list = getDB()[name]
    const idx = list.findIndex((x) => x.id === ctx.params.id)
    if (idx < 0) return sendJson(ctx.res, 404, { error: 'not_found' })
    list.splice(idx, 1)
    saveDB()
    sendJson(ctx.res, 200, { ok: true })
  }))
}

// ================= 调度 =================
function serveUpload(req, res, path) {
  if (req.method !== 'GET' && req.method !== 'HEAD')
    return sendJson(res, 405, { error: 'method_not_allowed' })
  const name = decodeURIComponent(path.slice('/uploads/'.length))
  const filePath = join(UPLOAD_DIR, name)
  if (!filePath.startsWith(UPLOAD_DIR) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404)
    res.end('not found')
    return
  }
  sendFile(res, filePath)
}

function serveStatic(req, res, path) {
  if (req.method !== 'GET' && req.method !== 'HEAD')
    return sendJson(res, 405, { error: 'method_not_allowed' })
  if (!existsSync(join(DIST_DIR, 'index.html'))) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(
      '<h1>前端尚未构建</h1><p>请运行 <code>npm run build</code> 后再启动 <code>npm start</code>。</p>',
    )
    return
  }
  let rel = decodeURIComponent(path)
  if (rel === '/') rel = '/index.html'
  const filePath = join(DIST_DIR, rel)
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403)
    res.end('forbidden')
    return
  }
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    sendFile(res, filePath)
  } else {
    sendFile(res, join(DIST_DIR, 'index.html')) // SPA 回退
  }
}

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }
  try {
    const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    const path = u.pathname
    if (path.startsWith('/uploads/')) return serveUpload(req, res, path)
    if (path.startsWith('/api/')) {
      let body = {}
      if (req.method === 'POST' || req.method === 'PUT') {
        try {
          body = await readBody(req)
        } catch (e) {
          return sendJson(res, 400, { error: e.message })
        }
      }
      for (const r of routes) {
        if (r.method !== req.method) continue
        const m = r.re.exec(path)
        if (!m) continue
        const params = {}
        r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])))
        return r.handler({ req, res, u, body, params, query: u.searchParams })
      }
      return sendJson(res, 404, { error: 'not_found', path })
    }
    return serveStatic(req, res, path)
  } catch (e) {
    console.error('[server error]', e)
    sendJson(res, 500, { error: 'server_error' })
  }
})

// 启动（仅作为主模块直接运行时才监听端口；被测试 import 时不启动）
export { server, routes }

// 跨平台判定主模块：argv[1] 可能是相对路径，需先 resolve 成绝对路径再转 file URL，
// 否则 Windows 下 import.meta.url（file:// 形式）与 fileURLToPath 结果无法相等。
const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href

if (isMain) {
  loadDB()
  seedIfEmpty(getDB())
  // 必须在 seed 之后生成默认导航架构，才能引用到已建好的摄影师 / 活动 / 展览
  ensureNav(getDB())
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[lumina] 服务已启动  http://0.0.0.0:${PORT}`)
  })
}
