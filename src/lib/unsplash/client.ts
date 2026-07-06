import 'server-only'
import type {UnsplashPhoto} from '@/lib/unsplash/types'

const API = 'https://api.unsplash.com'

/**
 * Single place every server-side feature (birding suggestions, pixel-art picker, ...)
 * goes through to talk to Unsplash. All of them share one UNSPLASH_ACCESS_KEY and its
 * quota, so search shape/limits live here once instead of being re-implemented per feature.
 */

export type UnsplashSearchOk = {ok: true; results: UnsplashPhoto[]}
export type UnsplashSearchErr = {
  ok: false
  reason: 'missing_key' | 'http_error' | 'rate_limited' | 'network_error'
  status?: number
}
export type UnsplashSearchResult = UnsplashSearchOk | UnsplashSearchErr

/** Appends Unsplash's required attribution UTM params to a unsplash.com link. */
export function withUnsplashAttributionParams(raw: string | null): string | null {
  if (!raw) return null
  try {
    const u = new URL(raw)
    if (!u.searchParams.get('utm_source')) u.searchParams.set('utm_source', 'stuartwainstock')
    if (!u.searchParams.get('utm_medium')) u.searchParams.set('utm_medium', 'referral')
    return u.toString()
  } catch {
    return raw
  }
}

function normalizePhoto(raw: unknown): UnsplashPhoto | null {
  const r = raw as Record<string, unknown>
  const urls = (r.urls as Record<string, unknown> | undefined) ?? {}
  const user = (r.user as Record<string, unknown> | undefined) ?? {}
  const links = (r.links as Record<string, unknown> | undefined) ?? {}
  const userLinks = (user.links as Record<string, unknown> | undefined) ?? {}

  const id = typeof r.id === 'string' ? r.id : ''
  const thumbUrl = typeof urls.small === 'string' ? urls.small : ''
  const regularUrl = (typeof urls.regular === 'string' && urls.regular) || thumbUrl
  if (!id || !regularUrl) return null

  return {
    id,
    thumbUrl: thumbUrl || regularUrl,
    regularUrl,
    width: typeof r.width === 'number' ? r.width : 0,
    height: typeof r.height === 'number' ? r.height : 0,
    altDescription:
      (typeof r.alt_description === 'string' && r.alt_description.trim()) ||
      (typeof r.description === 'string' && r.description.trim()) ||
      null,
    photographerName: typeof user.name === 'string' ? user.name : null,
    photographerPageUrl: withUnsplashAttributionParams(
      typeof userLinks.html === 'string' ? userLinks.html : null,
    ),
    photoPageUrl: withUnsplashAttributionParams(typeof links.html === 'string' ? links.html : null),
    downloadLocation: typeof links.download_location === 'string' ? links.download_location : null,
  }
}

/**
 * GET /search/photos. Returns normalized results (possibly empty — check `.results.length`,
 * an empty array is still `ok: true`) or a typed error reason to show/branch on.
 */
export async function searchUnsplashPhotos(options: {
  query: string
  page?: number
  perPage?: number
  orientation?: 'landscape' | 'portrait' | 'squarish'
}): Promise<UnsplashSearchResult> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY?.trim()
  if (!accessKey) return {ok: false, reason: 'missing_key'}

  const url = new URL(`${API}/search/photos`)
  url.searchParams.set('query', options.query)
  url.searchParams.set('per_page', String(Math.max(1, Math.min(30, options.perPage ?? 9))))
  url.searchParams.set('page', String(Math.max(1, Math.min(10, options.page ?? 1))))
  if (options.orientation) url.searchParams.set('orientation', options.orientation)

  let res: Response
  try {
    res = await fetch(url.toString(), {
      headers: {Authorization: `Client-ID ${accessKey}`, 'Accept-Version': 'v1'},
      next: {revalidate: 0},
    })
  } catch {
    return {ok: false, reason: 'network_error'}
  }

  if (!res.ok) {
    return {ok: false, reason: res.status === 403 ? 'rate_limited' : 'http_error', status: res.status}
  }

  const json = (await res.json().catch(() => null)) as {results?: unknown[]} | null
  const rawResults = Array.isArray(json?.results) ? json.results : []
  const results = rawResults.map(normalizePhoto).filter((p): p is UnsplashPhoto => p !== null)

  return {ok: true, results}
}

/**
 * Fires Unsplash's required "download" tracking ping — must be called whenever a
 * searched photo is actually used (loaded into a canvas, uploaded to Sanity, etc.),
 * separately from search. Best-effort: never throws.
 */
export async function triggerUnsplashDownload(downloadLocation: string): Promise<void> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY?.trim()
  if (!accessKey) return
  if (!downloadLocation.startsWith(`${API}/`)) return
  try {
    await fetch(downloadLocation, {headers: {Authorization: `Client-ID ${accessKey}`}})
  } catch {
    // Ignore — attribution-compliance ping only, never user-facing.
  }
}
