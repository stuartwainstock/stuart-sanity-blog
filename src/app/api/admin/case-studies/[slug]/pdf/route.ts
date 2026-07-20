import {type NextRequest, NextResponse} from 'next/server'
import {applyCaseStudyAdminCors, isCaseStudyAdminAuthorized} from '@/lib/caseStudy/adminAuth'
import {getCaseStudyAccess, uploadCaseStudyPdf} from '@/lib/caseStudy/privateStore'
import {isValidCaseStudySlug} from '@/lib/caseStudy/access'
import {getSanityWriteClient} from '@/lib/sanity.server'

export const dynamic = 'force-dynamic'

const MAX_PDF_BYTES = 50 * 1024 * 1024

function jsonResponse(request: NextRequest, body: unknown, status: number): NextResponse {
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

  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) {
    return jsonResponse(request, {ok: false, message: 'Upload a PDF file.'}, 400)
  }
  if (file.type && file.type !== 'application/pdf') {
    return jsonResponse(request, {ok: false, message: 'Only PDF uploads are allowed.'}, 400)
  }
  if (file.size > MAX_PDF_BYTES) {
    return jsonResponse(request, {ok: false, message: 'PDF exceeds 50 MiB limit.'}, 400)
  }

  const bytes = await file.arrayBuffer()
  const result = await uploadCaseStudyPdf({
    slug,
    bytes,
    originalFilename: file.name || `${slug}.pdf`,
    mimeType: 'application/pdf',
  })
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
      await client
        .patch(doc._id)
        .set({
          pdfProtection: {
            _type: 'caseStudyPdfProtection',
            configured: 'yes',
            originalFilename: file.name || `${slug}.pdf`,
          },
        })
        .unset(['pdfFile'])
        .commit()
    }
  } catch (err) {
    console.error('[caseStudy] failed to mirror pdf flag to Sanity', err)
  }

  return jsonResponse(
    request,
    {ok: true, originalFilename: file.name || `${slug}.pdf`},
    200,
  )
}
