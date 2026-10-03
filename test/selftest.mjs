// 免网络自测：直接驱动路由处理函数，不监听端口、不发任何 socket。
import { routes } from '../server/index.mjs'
import { loadDB, getDB } from '../server/store.mjs'
import { seedIfEmpty } from '../server/seed.mjs'

loadDB()
seedIfEmpty(getDB())

function mockRes() {
  return {
    statusCode: 0,
    _headers: {},
    _body: '',
    writeHead(s, h) {
      this.statusCode = s
      this._headers = h
    },
    end(b) {
      this._body = b
    },
  }
}

function findRoute(method, path) {
  for (const r of routes) {
    if (r.method !== method) continue
    const m = r.re.exec(path)
    if (m) {
      const params = {}
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])))
      return { r, params }
    }
  }
  return null
}

function call(method, path, opts = {}) {
  const { body = {}, headers = {}, query = new URLSearchParams() } = opts
  const found = findRoute(method, path)
  if (!found) return { statusCode: 404, json: { error: 'no_route' } }
  const res = mockRes()
  const ctx = {
    req: { headers, method, url: path },
    res,
    u: new URL('http://x' + path + '?' + query.toString()),
    body,
    params: found.params,
    query,
  }
  found.r.handler(ctx)
  let json = null
  try {
    json = JSON.parse(res._body)
  } catch {}
  return { statusCode: res.statusCode, json, raw: res._body }
}

const results = []
function check(name, cond, extra = '') {
  results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`)
  if (!cond) process.exitCode = 1
}

// 1. 健康检查
const health = call('GET', '/api/health')
check('health 200', health.statusCode === 200)

// 2. 首页数据
const home = call('GET', '/api/home')
check('home 200', home.statusCode === 200, 'site=' + home.json?.settings?.siteName)
check('home 有示例主题', home.json?.themes?.length >= 1)
check('home 有精选作品', (home.json?.featuredWorks?.length || 0) >= 1)
check('home 有展览', (home.json?.exhibitions?.length || 0) >= 1)
check('首页作品已解析引用(摄影师名)', !!home.json?.featuredWorks?.[0]?.photographer?.name)

// 3. 登录
const login = call('POST', '/api/admin/login', {
  body: { username: 'admin', password: 'admin12345' },
})
check('login 200', login.statusCode === 200)
check('login 返回 token', !!login.json?.token)
const token = login.json?.token

// 4. 未带 token 访问后台应 401
const noAuth = call('GET', '/api/admin/works')
check('后台无 token 401', noAuth.statusCode === 401)

// 5. 带 token 列出作品
const listWorks = call('GET', '/api/admin/works', {
  headers: { authorization: 'Bearer ' + token },
})
check('后台列作品 200', listWorks.statusCode === 200, 'n=' + listWorks.json?.length)

// 6. 创建作品（含 base64 图片）
const png =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
const createWork = call('POST', '/api/admin/works', {
  headers: { authorization: 'Bearer ' + token },
  body: {
    title: '自测作品',
    description: 'x',
    image: png,
    themeId: home.json.themes[0].id,
    categoryId: home.json.categories[0].id,
    photographerId: home.json.photographers[0].id,
    year: 2026,
    published: true,
    featured: false,
  },
})
check('创建作品 201', createWork.statusCode === 201)
check('图片已落盘为 /uploads/', String(createWork.json?.image).startsWith('/uploads/'), createWork.json?.image)
const newId = createWork.json?.id

// 7. 公开接口可按主题过滤
const filtered = call('GET', '/api/works', {
  query: new URLSearchParams({ theme: home.json.themes[0].id }),
})
check('按主题过滤有结果', (filtered.json?.total || 0) >= 1)

// 8. 更新作品
const upd = call('PUT', '/api/admin/works/' + newId, {
  headers: { authorization: 'Bearer ' + token },
  body: { title: '自测作品-改' },
})
check('更新作品 200', upd.statusCode === 200, 'title=' + upd.json?.title)

// 9. 删除作品（清理）
const del = call('DELETE', '/api/admin/works/' + newId, {
  headers: { authorization: 'Bearer ' + token },
})
check('删除作品 200', del.statusCode === 200)

// 10. 错误口令登录应 401
const bad = call('POST', '/api/admin/login', {
  body: { username: 'admin', password: 'wrong' },
})
check('错误口令 401', bad.statusCode === 401)

console.log(results.join('\n'))
console.log('\n全部通过:', !process.exitCode)
