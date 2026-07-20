import {type NextRequest, NextResponse} from 'next/server'
import {getCaseStudyAccess} from '@/lib/caseStudy/privateStore'
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
 * signed httpOnly cookie scoped to that slug. Salt/hash live in private Supabase
 * storage — never in the public Sanity dataset.
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

  const access = await getCaseStudyAccess(slug)
  if (!access?.salt || !access?.hash || !access.pdf_object_key) {
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
