import {timingSafeEqual} from 'crypto'
import {type NextRequest, NextResponse} from 'next/server'
import {
  ADMIN_SESSION_COOKIE_NAME,
  adminSessionCookieOptions,
  createAdminSessionToken,
  isStravaAdminAuthConfigured,
  safeRelativeRedirectPath,
} from '@/lib/admin/session'

export const dynamic = 'force-dynamic'

function safeCompareString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/**
 * POST: verify ADMIN_PASSWORD, set signed httpOnly session cookie, redirect to `next` path.
 */
export async function POST(request: NextRequest) {
  if (!isStravaAdminAuthConfigured()) {
    return NextResponse.json({message: 'Admin login is not configured (set ADMIN_PASSWORD).'}, {status: 503})
  }

  const form = await request.formData()
  const password = String(form.get('password') ?? '')
  const next = safeRelativeRedirectPath(String(form.get('next') ?? ''))
  const expected = process.env.ADMIN_PASSWORD?.trim() ?? ''

  if (!expected || !safeCompareString(password, expected)) {
    return NextResponse.json({message: 'Invalid password.'}, {status: 401})
  }

  const token = createAdminSessionToken()
  const target = new URL(next, request.url)
  const res = NextResponse.redirect(target, 303)
  const opts = adminSessionCookieOptions()
  res.cookies.set(opts.name, token, {
    httpOnly: opts.httpOnly,
    sameSite: opts.sameSite,
    secure: opts.secure,
    path: opts.path,
    maxAge: opts.maxAge,
  })
  return res
}

/** Clear admin session (logout). */
export async function DELETE() {
  const res = NextResponse.json({ok: true})
  const opts = adminSessionCookieOptions()
  res.cookies.set(ADMIN_SESSION_COOKIE_NAME, '', {
    httpOnly: opts.httpOnly,
    sameSite: opts.sameSite,
    secure: opts.secure,
    path: opts.path,
    maxAge: 0,
  })
  return res
}
