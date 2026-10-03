// 零依赖管理员鉴权：scrypt 口令哈希 + HS256 自签名令牌。
import {
  scryptSync,
  randomBytes,
  createHmac,
  timingSafeEqual,
} from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { DATA_DIR } from './store.mjs'

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url')
}

export function hashPassword(pw, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(pw, salt, 64).toString('hex')
  return { salt, hash }
}

export function verifyPassword(pw, salt, hash) {
  const h = scryptSync(pw, salt, 64)
  const hh = Buffer.from(hash, 'hex')
  return h.length === hh.length && timingSafeEqual(h, hh)
}

// 服务端签名密钥持久化到磁盘，保证重启后已签发的令牌仍然有效。
const SECRET_FILE = join(DATA_DIR, 'secret.txt')
let secret = null
function getSecret() {
  if (secret) return secret
  if (existsSync(SECRET_FILE)) {
    secret = readFileSync(SECRET_FILE, 'utf8').trim()
  } else {
    secret = randomBytes(32).toString('hex')
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(SECRET_FILE, secret)
  }
  return secret
}

const TOKEN_TTL = 60 * 60 * 24 * 7 // 7 天

export function signToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const body = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL,
  }
  const h = b64url(header)
  const p = b64url(body)
  const sig = createHmac('sha256', getSecret())
    .update(`${h}.${p}`)
    .digest('base64url')
  return `${h}.${p}.${sig}`
}

export function verifyToken(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [h, p, sig] = parts
    const expected = createHmac('sha256', getSecret())
      .update(`${h}.${p}`)
      .digest('base64url')
    if (
      sig.length !== expected.length ||
      !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    )
      return null
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString())
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}
