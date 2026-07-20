import 'server-only'
import {randomBytes, timingSafeEqual} from 'crypto'
import type {NextRequest} from 'next/server'
import {hasValidAdminSession} from '@/lib/admin/session'
import {hashPassword} from '@/lib/caseStudy/password'

/**
 * Auth for case-study Studio admin APIs (password + PDF upload).
 * Same-origin / embedded Studio: admin session cookie.
 * Hosted *.sanity.studio: shared CASE_STUDY_ADMIN_SECRET header.
 */

function safeCompareString(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch {
    return false
  }
}

export async function isCaseStudyAdminAuthorized(request: NextRequest): Promise<boolean> {
  if (await hasValidAdminSession()) return true

  const expected = process.env.CASE_STUDY_ADMIN_SECRET?.trim()
  if (!expected) return false

  const fromHeader = request.headers.get('x-case-study-admin-secret')?.trim()
  const fromAuth = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  const provided = fromHeader || fromAuth || ''
  if (!provided) return false
  return safeCompareString(provided, expected)
}

export function caseStudyAdminCorsOrigins(): string[] {
  const raw = process.env.CASE_STUDY_ADMIN_CORS_ORIGINS?.trim()
  if (!raw) return []
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

export function applyCaseStudyAdminCors(request: NextRequest, headers: Headers): void {
  const origin = request.headers.get('origin')
  if (!origin) return
  const allowed = caseStudyAdminCorsOrigins()
  const hasSecret = Boolean(process.env.CASE_STUDY_ADMIN_SECRET?.trim())
  let ok = allowed.includes(origin)
  if (!ok && hasSecret) {
    try {
      const h = new URL(origin).hostname
      if (h.endsWith('.sanity.studio')) ok = true
    } catch {
      /* ignore */
    }
  }
  if (!ok) return
  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Access-Control-Allow-Credentials', 'true')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-case-study-admin-secret',
  )
  headers.append('Vary', 'Origin')
}

export function newPasswordSalt(): string {
  return randomBytes(16).toString('hex')
}

export {hashPassword as hashPasswordServer}
