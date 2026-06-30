import {type NextRequest, NextResponse} from 'next/server'
import {sanityClient} from '@/lib/sanity'
import {CASE_STUDY_FILE_QUERY} from '@/lib/queries'
import {accessCookieName, isValidCaseStudySlug, verifyAccessToken} from '@/lib/caseStudy/access'

export const dynamic = 'force-dynamic'

type CaseStudyFile = {
  title?: string
  slug?: string
  pdfFile?: {
    asset?: {
      url?: string
      mimeType?: string
      originalFilename?: string
    }
  }
}

/**
 * GET: stream the case study PDF only when the request carries a valid unlock cookie.
 * The cdn.sanity.io asset URL is resolved and fetched server-side, so it never reaches
 * the browser. Add `?download=1` to force a download instead of inline viewing.
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

  const doc = await sanityClient
    .fetch<CaseStudyFile | null>(CASE_STUDY_FILE_QUERY, {slug}, {useCdn: false})
    .catch(() => null)

  const url = doc?.pdfFile?.asset?.url
  if (!url) {
    return new NextResponse('Not found', {status: 404})
  }

  const upstream = await fetch(url).catch(() => null)
  if (!upstream || !upstream.ok || !upstream.body) {
    return new NextResponse('Unable to load PDF', {status: 502})
  }

  const download = request.nextUrl.searchParams.get('download') === '1'
  const filename = (doc?.pdfFile?.asset?.originalFilename || `${slug}.pdf`).replace(/"/g, '')
  const disposition = `${download ? 'attachment' : 'inline'}; filename="${filename}"`

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': doc?.pdfFile?.asset?.mimeType || 'application/pdf',
      'Content-Disposition': disposition,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
