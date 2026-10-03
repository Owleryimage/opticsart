// GitHub Contents API 客户端：在浏览器里直接读写仓库文件（无需服务端）。
import type { RepoConfig } from './config'
import { DATA_PATH } from './config'

const API = 'https://api.github.com'

// 浏览器端 UTF-8 <-> Base64（不使用 Node 的 Buffer）
function utf8ToBase64(s: string) {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin)
}
function base64ToUtf8(b64: string) {
  const bin = atob(b64.replace(/\s/g, ''))
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

function authHeaders(c: RepoConfig): Record<string, string> {
  return {
    ...(c.token ? { Authorization: `Bearer ${c.token}` } : {}),
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

function contentsUrl(c: RepoConfig, path: string, ref?: string) {
  const base = `${API}/repos/${c.owner}/${c.repo}/contents/${path}`
  return ref ? `${base}?ref=${encodeURIComponent(ref)}` : base
}

async function ensure(res: Response) {
  if (res.ok) return
  let msg = `GitHub ${res.status}`
  try {
    const j = await res.json()
    if (j?.message) msg = j.message
  } catch {}
  if (res.status === 401) msg = 'Token 无效或已过期'
  if (res.status === 403) msg = 'Token 权限不足，或触发了 GitHub API 限流'
  if (res.status === 404) msg = '未找到该文件或仓库，请检查 owner / repo / 分支名'
  throw new Error(msg)
}

export async function verifyRepo(c: RepoConfig): Promise<string> {
  const res = await fetch(`${API}/repos/${c.owner}/${c.repo}`, { headers: authHeaders(c) })
  await ensure(res)
  const j = await res.json()
  return j?.full_name || `${c.owner}/${c.repo}`
}

/** 读取 JSON 文件，返回内容与写入所需的 sha */
export async function readJsonFile(
  c: RepoConfig,
  path: string,
): Promise<{ json: any; sha: string | undefined }> {
  const res = await fetch(contentsUrl(c, path, c.branch), { headers: authHeaders(c) })
  if (res.status === 404) return { json: null, sha: undefined }
  await ensure(res)
  const j = await res.json()
  return { json: JSON.parse(base64ToUtf8(j.content || '')), sha: j.sha }
}

/** 写入（新建或更新）一个 UTF-8 文本文件 */
export async function writeTextFile(
  c: RepoConfig,
  path: string,
  text: string,
  sha: string | undefined,
  message: string,
) {
  const res = await fetch(contentsUrl(c, path), {
    method: 'PUT',
    headers: { ...authHeaders(c), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: utf8ToBase64(text),
      ...(sha ? { sha } : {}),
      branch: c.branch,
    }),
  })
  await ensure(res)
  return res.json()
}

/** 上传图片（纯 base64 payload）到仓库 */
export async function uploadImageToRepo(
  c: RepoConfig,
  destPath: string,
  base64: string,
): Promise<void> {
  const res = await fetch(contentsUrl(c, destPath), {
    method: 'PUT',
    headers: { ...authHeaders(c), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Upload image ${destPath}`,
      content: base64,
      branch: c.branch,
    }),
  })
  await ensure(res)
}

export { DATA_PATH }
