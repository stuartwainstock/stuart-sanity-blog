import {type NextRequest, NextResponse} from 'next/server'
import {triggerUnsplashDownload} from '@/lib/unsplash/client'

export const dynamic = 'force-dynamic'

/**
 * Fires Unsplash's required "download" tracking ping when a searched photo is actually
 * loaded into the pixel-art canvas (per Unsplash API guidelines — this is separate from
 * search, which doesn't count as a "download"). Best-effort: never blocks the user.
 */
export async function POST(request: NextRequest) {
  let body: {downloadLocation?: unknown}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ok: false, message: 'Invalid JSON.'}, {status: 400})
  }

  const downloadLocation = typeof body.downloadLocation === 'string' ? body.downloadLocation.trim() : ''
  if (!downloadLocation) {
    return NextResponse.json({ok: false, message: 'Missing downloadLocation.'}, {status: 400})
  }

  await triggerUnsplashDownload(downloadLocation)
  return NextResponse.json({ok: true})
}
