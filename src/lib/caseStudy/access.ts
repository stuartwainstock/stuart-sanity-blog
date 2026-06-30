import 'server-only'
import {createHmac, randomBytes, timingSafeEqual} from 'crypto'
import {cookies} from 'next/headers'

/**
 * Per-case-study unlock sessions. After a visitor enters the correct password, the
 * unlock route issues an HMAC-signed, httpOnly cookie scoped to that slug. The PDF
 * proxy and gate page verify this cookie before serving or revealing the document.
 *
 * Mirrors the signing approach in src/lib/admin/session.ts.
 */
const COOKIE_PREFIX = 'cs_access_'
const COOKIE_MAX_AGE_S = 60 * 60 * 24 * 7 // 7 days
const SLUG_PATTERN = /^[a-z0-9-]+$/

type AccessPayload = {
  v: 1
  exp: number
  slug: string
  nonce: string
}

export function isValidCaseStudySlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug)
}

export function isCaseStudyAccessConfigured(): boolean {
  return Boolean(process.env.CASE_STUDY_SESSION_SECRET?.trim())
}

function getSigningKey(): string | null {
  return process.env.CASE_STUDY_SESSION_SECRET?.trim() || null
}

export function accessCookieName(slug: string): string {
  return `${COOKIE_PREFIX}${slug}`
}

function signPayload(payload: AccessPayload, key: string): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const sig = createHmac('sha256', key).update(body).digest('base64url')
  return `${body}.${sig}`
}

function verifyToken(token: string, key: string, slug: string): boolean {
  const dot = token.indexOf('.')
  if (dot < 0) return false
  const body = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = createHmac('sha256', key).update(body).digest('base64url')
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false
  } catch {
    return false
  }
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as AccessPayload
    if (parsed.v !== 1 || typeof parsed.exp !== 'number' || typeof parsed.slug !== 'string') {
      return false
    }
    if (parsed.slug !== slug) return false
    if (parsed.exp <= Date.now()) return false
    return true
  } catch {
    return false
  }
}

export function createAccessToken(slug: string): string {
  const key = getSigningKey()
  if (!key) throw new Error('CASE_STUDY_SESSION_SECRET is not set.')
  const payload: AccessPayload = {
    v: 1,
    exp: Date.now() + COOKIE_MAX_AGE_S * 1000,
    slug,
    nonce: randomBytes(16).toString('hex'),
  }
  return signPayload(payload, key)
}

export function verifyAccessToken(token: string | undefined | null, slug: string): boolean {
  if (!token) return false
  const key = getSigningKey()
  if (!key) return false
  return verifyToken(token, key, slug)
}

/** True when the current request carries a valid unlock cookie for this slug. */
export async function hasCaseStudyAccess(slug: string): Promise<boolean> {
  if (!isValidCaseStudySlug(slug)) return false
  const store = await cookies()
  const token = store.get(accessCookieName(slug))?.value
  return verifyAccessToken(token, slug)
}

export function accessCookieOptions(): {
  httpOnly: boolean
  sameSite: 'lax'
  secure: boolean
  path: string
  maxAge: number
} {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE_S,
  }
}
