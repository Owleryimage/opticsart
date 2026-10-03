export interface Settings {
  siteName: string
  societyName: string
  siteDescription: string
  about: string
  contact: string
  logo?: string
  coverImage?: string
  // 顶部 Banner 导航架构（后台可调整）
  nav?: NavEntry[]
}

// 顶部 Banner 的单条导航项。type 决定点击后的跳转目标：
//  home         → 首页海报轮播
//  photographer → 具体摄影师详情（target = 摄影师 id）
//  activity     → 具体活动项目详情（target = 公告/活动 id）
//  exhibition   → 具体小型线上展览详情（target = 展览 id）
//  about        → 关于页
//  admin        → 管理后台
//  link         → 外链（target = URL）
export interface NavEntry {
  id: string
  label: string
  type: 'home' | 'photographer' | 'activity' | 'exhibition' | 'about' | 'admin' | 'link'
  target?: string
  order?: number
}

export interface Theme {
  id: string
  name: string
  description?: string
  coverImage?: string
  order?: number
}

export interface Category {
  id: string
  name: string
  description?: string
  order?: number
}

export interface Photographer {
  id: string
  name: string
  bio?: string
  avatar?: string
  website?: string
  order?: number
}

export interface YearItem {
  id: string
  year: number
  description?: string
}

export interface WorkRef {
  id: string
  name: string
  avatar?: string
}

export interface Work {
  id: string
  title: string
  description?: string
  image?: string
  themeId?: string
  categoryId?: string
  photographerId?: string
  year?: number
  location?: string
  camera?: string
  featured?: boolean
  published?: boolean
  order?: number
  createdAt?: number
  theme?: WorkRef
  category?: WorkRef
  photographer?: WorkRef
  yearObj?: { id: string; year: number }
}

export interface Exhibition {
  id: string
  title: string
  subtitle?: string
  description?: string
  coverImage?: string
  startDate?: string
  endDate?: string
  location?: string
  status?: string
  curator?: string
  workIds?: string[]
  published?: boolean
  order?: number
  createdAt?: number
  works?: Work[]
}

export interface Announcement {
  id: string
  title: string
  body?: string
  image?: string
  type?: string
  pinned?: boolean
  published?: boolean
  createdAt?: number
  expiresAt?: string
}

export interface HomeData {
  settings: Settings
  themes: Theme[]
  categories: Category[]
  photographers: Photographer[]
  years: YearItem[]
  featuredWorks: Work[]
  exhibitions: Exhibition[]
  announcements: Announcement[]
  // 首页轮播使用的「当前活动海报」：已发布且带图片的公告
  posters: Announcement[]
  counts: {
    works: number
    photographers: number
    themes: number
    exhibitions: number
  }
}
