import {type NextRequest, NextResponse} from 'next/server'
import {sanityClient} from '@/lib/sanity'
import {CASE_STUDY_ACCESS_QUERY} from '@/lib/queries'
import {verifyPassword} from '@/lib/caseStudy/password'
import {
  accessCookieName,
  accessCookieOptions,
  createAccessToken,
  isCaseStudyAccessConfigured,
  isValidCaseStudySlug,
} from '@/lib/caseStudy/access'

export const dynamic = 'force-dynamic'

/**
 * POST: verify a case study's share password server-side and, on success, set a
 * signed httpOnly cookie scoped to that slug. The plaintext is compared (timing-safe)
 * against the salted hash stored in Sanity; it is never returned to the client.
 */
export async function POST(request: NextRequest, {params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params

  if (!isValidCaseStudySlug(slug)) {
    return NextResponse.json({ok: false, message: 'Not found.'}, {status: 404})
  }

  if (!isCaseStudyAccessConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Case study access is not configured (set CASE_STUDY_SESSION_SECRET).',
      },
      {status: 503},
    )
  }

  let password = ''
  const contentType = request.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    const body = (await request.json().catch(() => null)) as {password?: unknown} | null
    password = typeof body?.password === 'string' ? body.password : ''
  } else {
    const form = await request.formData()
    password = String(form.get('password') ?? '')
  }

  if (!password) {
    return NextResponse.json({ok: false, message: 'Enter the password.'}, {status: 400})
  }

  const access = await sanityClient
    .fetch<{salt?: string; hash?: string} | null>(
      CASE_STUDY_ACCESS_QUERY,
      {slug},
      {useCdn: false},
    )
    .catch(() => null)

  if (!access?.salt || !access?.hash) {
    return NextResponse.json(
      {ok: false, message: 'This case study is not available.'},
      {status: 404},
    )
  }

  if (!verifyPassword(access.salt, access.hash, password)) {
    return NextResponse.json({ok: false, message: 'Incorrect password.'}, {status: 401})
  }

  const res = NextResponse.json({ok: true})
  res.cookies.set(accessCookieName(slug), createAccessToken(slug), accessCookieOptions())
  return res
}
