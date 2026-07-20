import {type NextRequest, NextResponse} from 'next/server'
import {
  applyCaseStudyAdminCors,
  hashPasswordServer,
  isCaseStudyAdminAuthorized,
  newPasswordSalt,
} from '@/lib/caseStudy/adminAuth'
import {
  clearCaseStudyPassword,
  getCaseStudyAccess,
  upsertCaseStudyPassword,
} from '@/lib/caseStudy/privateStore'
import {isValidCaseStudySlug} from '@/lib/caseStudy/access'
import {getSanityWriteClient} from '@/lib/sanity.server'

export const dynamic = 'force-dynamic'

function jsonResponse(
  request: NextRequest,
  body: unknown,
  status: number,
): NextResponse {
  const headers = new Headers({'Cache-Control': 'no-store'})
  applyCaseStudyAdminCors(request, headers)
  return NextResponse.json(body, {status, headers})
}

export async function OPTIONS(request: NextRequest) {
  const headers = new Headers()
  applyCaseStudyAdminCors(request, headers)
  return new NextResponse(null, {status: 204, headers})
}

export async function GET(request: NextRequest, {params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  if (!isValidCaseStudySlug(slug)) {
    return jsonResponse(request, {ok: false, message: 'Not found.'}, 404)
  }
  if (!(await isCaseStudyAdminAuthorized(request))) {
    return jsonResponse(request, {ok: false, message: 'Unauthorized.'}, 401)
  }
  const row = await getCaseStudyAccess(slug)
  return jsonResponse(
    request,
    {
      ok: true,
      hasPassword: Boolean(row?.salt && row?.hash),
      hasPdf: Boolean(row?.pdf_object_key),
      originalFilename: row?.original_filename ?? null,
    },
    200,
  )
}

export async function POST(request: NextRequest, {params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  if (!isValidCaseStudySlug(slug)) {
    return jsonResponse(request, {ok: false, message: 'Not found.'}, 404)
  }
  if (!(await isCaseStudyAdminAuthorized(request))) {
    return jsonResponse(request, {ok: false, message: 'Unauthorized.'}, 401)
  }

  const body = (await request.json().catch(() => null)) as {password?: unknown} | null
  const password = typeof body?.password === 'string' ? body.password.trim() : ''
  if (password.length < 4) {
    return jsonResponse(request, {ok: false, message: 'Use at least 4 characters.'}, 400)
  }

  const salt = newPasswordSalt()
  const hash = hashPasswordServer(salt, password)
  const result = await upsertCaseStudyPassword({slug, salt, hash})
  if (!result.ok) {
    return jsonResponse(request, {ok: false, message: result.message}, 500)
  }

  // Mirror a non-secret flag onto the Sanity doc for Studio validation / preview.
  try {
    const client = getSanityWriteClient()
    const doc = await client.fetch<{_id: string} | null>(
      `*[_type == "caseStudy" && slug.current == $slug][0]{_id}`,
      {slug},
    )
    if (doc?._id) {
      await client
        .patch(doc._id)
        .set({access: {_type: 'caseStudyAccess', configured: 'yes'}})
        .commit()
    }
  } catch (err) {
    console.error('[caseStudy] failed to mirror access flag to Sanity', err)
  }

  return jsonResponse(request, {ok: true, hasPassword: true}, 200)
}

export async function DELETE(request: NextRequest, {params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  if (!isValidCaseStudySlug(slug)) {
    return jsonResponse(request, {ok: false, message: 'Not found.'}, 404)
  }
  if (!(await isCaseStudyAdminAuthorized(request))) {
    return jsonResponse(request, {ok: false, message: 'Unauthorized.'}, 401)
  }

  const result = await clearCaseStudyPassword(slug)
  if (!result.ok) {
    return jsonResponse(request, {ok: false, message: result.message}, 400)
  }

  try {
    const client = getSanityWriteClient()
    const doc = await client.fetch<{_id: string} | null>(
      `*[_type == "caseStudy" && slug.current == $slug][0]{_id}`,
      {slug},
    )
    if (doc?._id) {
      await client.patch(doc._id).unset(['access']).commit()
    }
  } catch (err) {
    console.error('[caseStudy] failed to clear Sanity access flag', err)
  }

  return jsonResponse(request, {ok: true}, 200)
}
