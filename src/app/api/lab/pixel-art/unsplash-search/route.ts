import {type NextRequest, NextResponse} from 'next/server'
import {searchUnsplashPhotos} from '@/lib/unsplash/client'

export const dynamic = 'force-dynamic'

/**
 * Public, unauthenticated Unsplash search proxy for the /lab/pixel-art playground.
 * Shares UNSPLASH_ACCESS_KEY (and the same src/lib/unsplash/client.ts request logic)
 * with src/app/api/birding/suggest-unsplash — this route is intentionally public
 * (it's a kids'-playground feature), so it stays conservative about request shape
 * to avoid needlessly burning the shared quota.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim().slice(0, 100)
  if (!query) {
    return NextResponse.json({message: 'Missing query.'}, {status: 400})
  }

  const result = await searchUnsplashPhotos({query, perPage: 9, orientation: 'squarish'})

  if (!result.ok) {
    const messages: Record<typeof result.reason, string> = {
      missing_key: 'Unsplash search is not configured on this site (missing UNSPLASH_ACCESS_KEY).',
      rate_limited: 'Unsplash rate limit reached — try again later.',
      http_error: `Unsplash search failed (HTTP ${result.status ?? '?'}).`,
      network_error: 'Could not reach Unsplash.',
    }
    const statuses: Record<typeof result.reason, number> = {
      missing_key: 503,
      rate_limited: 429,
      http_error: 502,
      network_error: 502,
    }
    return NextResponse.json({message: messages[result.reason]}, {status: statuses[result.reason]})
  }

  return NextResponse.json({ok: true, results: result.results})
}
