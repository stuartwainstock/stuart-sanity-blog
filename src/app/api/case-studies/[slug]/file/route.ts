import {type NextRequest, NextResponse} from 'next/server'
import {downloadCaseStudyPdf} from '@/lib/caseStudy/privateStore'
import {accessCookieName, isValidCaseStudySlug, verifyAccessToken} from '@/lib/caseStudy/access'

export const dynamic = 'force-dynamic'

/**
 * GET: stream the case study PDF only when the request carries a valid unlock cookie.
 * Bytes come from a private Supabase Storage bucket — never from public cdn.sanity.io.
 * Add `?download=1` to force a download instead of inline viewing.
 */
export async function GET(request: NextRequest, {params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params

  if (!isValidCaseStudySlug(slug)) {
    return new NextResponse('Not found', {status: 404})
  }

  const token = request.cookies.get(accessCookieName(slug))?.value
  if (!verifyAccessToken(token, slug)) {
    return new NextResponse('Unauthorized', {status: 401})
  }

  const result = await downloadCaseStudyPdf(slug)
  if (!result.ok) {
    return new NextResponse(result.message, {status: result.status})
  }

  const download = request.nextUrl.searchParams.get('download') === '1'
  const filename = result.originalFilename.replace(/"/g, '')
  const disposition = `${download ? 'attachment' : 'inline'}; filename="${filename}"`

  return new NextResponse(result.bytes, {
    status: 200,
    headers: {
      'Content-Type': result.mimeType,
      'Content-Disposition': disposition,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
