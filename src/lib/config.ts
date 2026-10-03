// GitHub 仓库连接配置（纯静态站：内容全部存放在 GitHub 仓库中）
export interface RepoConfig {
  owner: string
  repo: string
  branch: string
  token?: string
}

const LS_KEY = 'opticsart_repo'

export function getRepo(): RepoConfig | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const c = JSON.parse(raw)
    return c && c.owner && c.repo ? { ...c, branch: c.branch || 'main' } : null
  } catch {
    return null
  }
}

export function setRepo(c: RepoConfig) {
  localStorage.setItem(LS_KEY, JSON.stringify(c))
}

export function clearRepo() {
  localStorage.removeItem(LS_KEY)
}

// 仓库内数据存储路径
export const DATA_PATH = 'data/db.json'
export const UPLOAD_DIR = 'data/uploads'

export function cdnBase(c: RepoConfig) {
  return `https://cdn.jsdelivr.net/gh/${c.owner}/${c.repo}@${c.branch}`
}

export function rawBase(c: RepoConfig) {
  return `https://raw.githubusercontent.com/${c.owner}/${c.repo}/${c.branch}`
}
