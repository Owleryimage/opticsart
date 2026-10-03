// 首次运行时写入默认管理员与示例内容（含本地生成的 SVG 占位图），
// 让站点开箱即有可展示的结构。用户可在后台自由删除 / 修改。
import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { UPLOAD_DIR, newId, saveDB } from './store.mjs'
import { hashPassword } from './auth.mjs'

function svgPlaceholder({ label, sub, from, to, w = 1200, h = 800 }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect width="${w}" height="${h}" fill="#000" opacity="0.12"/>
  <text x="50%" y="46%" fill="#fff" font-family="serif" font-size="56" text-anchor="middle" opacity="0.92">${label}</text>
  <text x="50%" y="56%" fill="#fff" font-family="sans-serif" font-size="24" text-anchor="middle" opacity="0.7">${sub}</text>
</svg>`
  const name = `seed-${newId().toLowerCase()}.svg`
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true })
  writeFileSync(join(UPLOAD_DIR, name), svg)
  return `/uploads/${name}`
}

export function seedIfEmpty(db) {
  let changed = false

  // 默认管理员
  if (!db.admin) {
    const pw = process.env.ADMIN_PASSWORD || 'admin12345'
    const { salt, hash } = hashPassword(pw)
    db.admin = { username: 'admin', salt, hash, createdAt: Date.now() }
    console.log(
      `\n[seed] 已创建默认管理员  用户名: admin  密码: ${pw}\n[seed] 上线前请务必在后台修改密码。\n`,
    )
    changed = true
  }

  if (db.themes.length === 0) {
    const t1 = { id: newId(), name: '城市夜景', description: '霓虹、车流与孤独的建筑轮廓。', order: 1 }
    const t2 = { id: newId(), name: '自然光影', description: '山川、草木与一天里的光。', order: 2 }
    db.themes.push(t1, t2)

    const c1 = { id: newId(), name: '纪实', description: '真实发生的瞬间。', order: 1 }
    const c2 = { id: newId(), name: '风光', description: '自然与地景。', order: 2 }
    const c3 = { id: newId(), name: '人像', description: '面孔与情绪。', order: 3 }
    const c4 = { id: newId(), name: '街头', description: '城市里的偶然。', order: 4 }
    db.categories.push(c1, c2, c3, c4)

    const p1 = {
      id: newId(),
      name: '林深',
      bio: '关注城市与人的距离，偏好冷色调的长曝光。',
      avatar: svgPlaceholder({ label: '林深', sub: 'PHOTOGRAPHER', from: '#1f2937', to: '#4b5563' }),
      order: 1,
    }
    const p2 = {
      id: newId(),
      name: '苏野',
      bio: '用自然光记录山野与季节的更替。',
      avatar: svgPlaceholder({ label: '苏野', sub: 'PHOTOGRAPHER', from: '#064e3b', to: '#0f766e' }),
      order: 2,
    }
    db.photographers.push(p1, p2)

    for (const y of [2024, 2025, 2026]) {
      db.years.push({ id: newId(), year: y, description: '' })
    }

    const samples = [
      { title: '夜行', theme: t1.id, category: c4.id, photographer: p1.id, year: 2026, hue: ['#0f172a', '#312e81'], featured: true },
      { title: '霓虹巷', theme: t1.id, category: c4.id, photographer: p1.id, year: 2025, hue: ['#1e1b4b', '#7c3aed'], featured: true },
      { title: '潮间带', theme: t2.id, category: c2.id, photographer: p2.id, year: 2025, hue: ['#064e3b', '#0d9488'], featured: true },
      { title: '晨雾山脊', theme: t2.id, category: c2.id, photographer: p2.id, year: 2024, hue: ['#334155', '#94a3b8'] },
      { title: '等车的人', theme: t1.id, category: c1.id, photographer: p1.id, year: 2026, hue: ['#27272a', '#52525b'] },
      { title: '窗边', theme: t2.id, category: c3.id, photographer: p2.id, year: 2026, hue: ['#3f3f46', '#a1a1aa'] },
    ]
    for (const s of samples) {
      db.works.push({
        id: newId(),
        title: s.title,
        description: `${s.title} — 社团示例作品，可在后台替换为正稿。`,
        image: svgPlaceholder({ label: s.title, sub: '示例作品', from: s.hue[0], to: s.hue[1] }),
        themeId: s.theme,
        categoryId: s.category,
        photographerId: s.photographer,
        year: s.year,
        location: '示例城市',
        camera: '',
        featured: !!s.featured,
        published: true,
        order: db.works.length,
        createdAt: Date.now(),
      })
    }

    const exCover = svgPlaceholder({ label: '2026 年度光影展', sub: 'ANNUAL EXHIBITION', from: '#111827', to: '#1d4ed8', w: 1600, h: 900 })
    db.exhibitions.push({
      id: newId(),
      title: '2026 年度光影展',
      subtitle: '光、城市与远方',
      description: '本年度社团精选作品联展，呈现城市夜景与自然光影两条线索。',
      coverImage: exCover,
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      location: '示例美术馆 2 号厅',
      status: 'upcoming',
      curator: '光影摄影社团策展组',
      workIds: db.works.filter((w) => w.featured).map((w) => w.id),
      published: true,
      order: 1,
      createdAt: Date.now(),
    })

    const posterA = svgPlaceholder({ label: '2026 年度光影展', sub: 'OPENING SOON · 11.01', from: '#111111', to: '#e30613', w: 1600, h: 900 })
    const posterB = svgPlaceholder({ label: '街头摄影工作坊', sub: 'WORKSHOP · 限额 20 人', from: '#0f172a', to: '#2563eb', w: 1600, h: 900 })
    const posterC = svgPlaceholder({ label: '城市光影采风', sub: 'FIELD TRIP · 报名中', from: '#1c1917', to: '#a16207', w: 1600, h: 900 })

    db.announcements.push({
      id: newId(),
      title: '2026 年度光影展开幕预告',
      body: '年度联展将于 11 月 1 日开幕，欢迎社员与公众参观。具体票务信息随后公布。',
      image: posterA,
      type: 'event',
      pinned: true,
      published: true,
      createdAt: Date.now(),
      expiresAt: '',
    })
    db.announcements.push({
      id: newId(),
      title: '街头摄影工作坊招募',
      body: '由资深社员带领，两周四次线下课程，从取景到后期完整训练。面向全体社员开放报名。',
      image: posterB,
      type: 'event',
      pinned: false,
      published: true,
      createdAt: Date.now() - 1000 * 60 * 60 * 24,
      expiresAt: '',
    })
    db.announcements.push({
      id: newId(),
      title: '城市光影采风报名',
      body: '周末城市步行采风，路线覆盖老城区与滨江，配备领队与器材借用。名额有限，先到先得。',
      image: posterC,
      type: 'notice',
      pinned: false,
      published: true,
      createdAt: Date.now() - 1000 * 60 * 60 * 48,
      expiresAt: '',
    })

    changed = true
  }

  if (changed) saveDB()
  return changed
}
