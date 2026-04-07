import {createHash, createHmac, randomBytes, timingSafeEqual} from 'crypto'
import {cookies} from 'next/headers'
import type {NextRequest} from 'next/server'

export const ADMIN_SESSION_COOKIE_NAME = 'site_admin_session'
const COOKIE_NAME = ADMIN_SESSION_COOKIE_NAME
const COOKIE_MAX_AGE_S = 60 * 60 * 24 * 30 // 30 days

type SessionPayload = {
  v: 1
  exp: number
  nonce: string
}

function getSigningKey(): string | null {
  const explicit = process.env.ADMIN_SESSION_SECRET?.trim()
  if (explicit) return explicit
  const pw = process.env.ADMIN_PASSWORD?.trim()
  if (!pw) return null
  return createHash('sha256').update(`v1:admin-session:${pw}`).digest('hex')
}

export function isStravaAdminAuthConfigured(): boolean {
  return Boolean(getSigningKey() && process.env.ADMIN_PASSWORD?.trim())
}

/** Local dev only: skip admin gate when explicitly allowed. */
export function allowInsecureStravaConnect(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.ALLOW_INSECURE_STRAVA_CONNECT === '1'
  )
}

function signPayload(payload: SessionPayload, key: string): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const sig = createHmac('sha256', key).update(body).digest('base64url')
  return `${body}.${sig}`
}

function verifyToken(token: string, key: string): SessionPayload | null {
  const dot = token.indexOf('.')
  if (dot < 0) return null
  const body = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = createHmac('sha256', key).update(body).digest('base64url')
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  } catch {
    return null
  }
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload
    if (parsed.v !== 1 || typeof parsed.exp !== 'number' || typeof parsed.nonce !== 'string') {
      return null
    }
    if (parsed.exp <= Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

export function createAdminSessionToken(): string {
  const key = getSigningKey()
  if (!key) throw new Error('Cannot create session: configure ADMIN_PASSWORD or ADMIN_SESSION_SECRET')
  const payload: SessionPayload = {
    v: 1,
    exp: Date.now() + COOKIE_MAX_AGE_S * 1000,
    nonce: randomBytes(16).toString('hex'),
  }
  return signPayload(payload, key)
}

export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token) return false
  const key = getSigningKey()
  if (!key) return false
  return verifyToken(token, key) != null
}

export function getAdminSessionCookieFromRequest(request: NextRequest): string | undefined {
  return request.cookies.get(COOKIE_NAME)?.value
}

/**
 * True when dev bypass is on, or signed session cookie is valid.
 * If admin auth is not configured (no password), returns false — caller should return 503 before redirecting to login.
 */
export async function hasValidAdminSession(): Promise<boolean> {
  if (allowInsecureStravaConnect()) return true
  if (!isStravaAdminAuthConfigured()) return false
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  return verifyAdminSessionToken(token)
}

export function adminSessionCookieOptions(): {
  name: string
  httpOnly: boolean
  sameSite: 'lax'
  secure: boolean
  path: string
  maxAge: number
} {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE_S,
  }
}

/** Safe in-app path only (open-redirect safe). */
export function safeRelativeRedirectPath(next: string | null | undefined): string {
  if (!next) return '/runs'
  const t = next.trim()
  if (!t.startsWith('/') || t.startsWith('//') || t.includes('\\')) return '/runs'
  return t
}
