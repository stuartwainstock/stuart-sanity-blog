import {NextResponse, type NextRequest} from 'next/server'
import {createClient} from '@sanity/client'
import {hasValidAdminSession} from '@/lib/admin/session'

export const dynamic = 'force-dynamic'

function allowedOrigins(): string[] {
  const raw = process.env.SANITY_BIRDING_CORS_ORIGINS?.trim()
  if (!raw) return []
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

function applyCors(request: NextRequest, headers: Headers) {
  const origin = request.headers.get('origin')
  if (!origin) return
  const allowed = allowedOrigins()
  if (!allowed.includes(origin)) return
  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-birding-suggest-secret')
  headers.append('Vary', 'Origin')
}

function responseWithCors(
  request: NextRequest,
  body: BodyInit | null,
  status: number,
  extraHeaders?: Record<string, string>,
): Response {
  const headers = new Headers()
  if (extraHeaders) {
    for (const [k, v] of Object.entries(extraHeaders)) headers.set(k, v)
  }
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'no-store')
  applyCors(request, headers)
  return new Response(body, {status, headers})
}

function safeCompareString(a: string, b: string): boolean {
  // Small helper: avoid timing oracle, but keep it dependency-free here.
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}

async function isAuthorized(request: NextRequest): Promise<boolean> {
  // Same-origin (embedded Studio / site): admin session cookie gate.
  if (await hasValidAdminSession()) return true

  const expected = process.env.BIRDING_SUGGEST_PROXY_SECRET?.trim()
  if (!expected) return false

  const fromHeader = request.headers.get('x-birding-suggest-secret')?.trim()
  const fromAuth = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  const provided = fromHeader || fromAuth || ''
  if (!provided) return false
  return safeCompareString(provided, expected)
}

type RequestBody = {
  id: string
  mode: 'suggest' | 'regenerate' | 'dismiss'
}

type BirdSightingForSuggest = {
  _id: string
  _type: 'birdSighting'
  speciesName?: string
  speciesCode?: string
  locationLabel?: string | null
  cardImage?: unknown
  suggestedCoverSearchQueryManual?: string
  suggestedCoverSearchPage?: number
}

type UnsplashSuggestionPatch = {
  suggestedCoverProvider: 'unsplash'
  suggestedCoverImageUrl: string
  suggestedCoverImagePageUrl: string | null
  suggestedCoverPhotographerName: string | null
  suggestedCoverPhotographerPageUrl: string | null
  suggestedCoverAltDraft: string | null
  suggestedCoverSearchQueryLast: string
  suggestedCoverSearchPage: number
  imageSuggestionStatus: 'pending_review'
}

function getWriteClient() {
  const token = process.env.SANITY_API_WRITE_TOKEN
  if (!token) throw new Error('SANITY_API_WRITE_TOKEN is not set.')
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
  if (!projectId) throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID is not set.')
  return createClient({
    projectId,
    dataset,
    apiVersion: '2023-05-03',
    token,
    useCdn: false,
  })
}

function buildSearchQuery(speciesName: string, speciesCode: string, locationLabel: string | null): string {
  const name = (speciesName || '').trim() || 'bird'
  const code = (speciesCode || '').trim()
  const loc = (locationLabel || '').trim()
  const parts = [name, code, 'wild bird North America']
  if (loc) parts.push(loc)
  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

function buildAltDraft(speciesName: string, locationLabel: string | null, altDescription: string | null): string {
  const name = speciesName?.trim() || 'Bird'
  const loc = locationLabel?.trim()
  const locPhrase = loc ? ` Location: ${loc}.` : ''
  if (altDescription) {
    const base = `${name}: ${altDescription}.${locPhrase} Verify this photo matches the species before publishing.`
    return base.replace(/\s+/g, ' ').trim().slice(0, 400)
  }
  return `Photograph of a ${name}.${locPhrase} Verify the image matches this eBird species before publishing.`
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 400)
}

async function searchUnsplash(query: string, page: number) {
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY?.trim()
  if (!unsplashKey) return null

  const apiPage = Math.max(1, Math.min(10, page))
  const u = new URL('https://api.unsplash.com/search/photos')
  u.searchParams.set('query', query)
  u.searchParams.set('per_page', '1')
  u.searchParams.set('orientation', 'landscape')
  u.searchParams.set('page', String(apiPage))

  const res = await fetch(u.toString(), {
    headers: {
      Authorization: `Client-ID ${unsplashKey}`,
      'Accept-Version': 'v1',
    },
  })
  if (!res.ok) return null

  const json = (await res.json().catch(() => null)) as any
  const hit = Array.isArray(json?.results) ? json.results[0] : null
  if (!hit) return null

  const urls = hit.urls || {}
  const user = hit.user || {}
  const links = hit.links || {}
  const userLinks = user.links || {}
  const altDescription =
    (typeof hit.alt_description === 'string' && hit.alt_description.trim()) ||
    (typeof hit.description === 'string' && hit.description.trim()) ||
    null

  const imageUrl = urls.regular || urls.small || null
  if (!imageUrl) return null

  return {
    imageUrl,
    photoPageUrl: links.html || null,
    photographerName: typeof user.name === 'string' ? user.name : null,
    photographerPageUrl: userLinks.html || null,
    altDescription,
  }
}

export async function POST(request: NextRequest) {
  const ok = await isAuthorized(request)
  if (!ok) {
    return responseWithCors(
      request,
      JSON.stringify({
        message:
          'Unauthorized. For hosted Studio, set SANITY_STUDIO_BIRDING_SUGGEST_SECRET in the Studio build and BIRDING_SUGGEST_PROXY_SECRET + SANITY_BIRDING_CORS_ORIGINS on the site.',
      }),
      401,
      {'Content-Type': 'application/json'},
    )
  }

  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return responseWithCors(
      request,
      JSON.stringify({message: 'Invalid JSON.'}),
      400,
      {'Content-Type': 'application/json'},
    )
  }

  const id = String(body.id ?? '').trim()
  const mode = body.mode
  if (!id || (mode !== 'suggest' && mode !== 'regenerate' && mode !== 'dismiss')) {
    return responseWithCors(
      request,
      JSON.stringify({message: 'Missing id or invalid mode.'}),
      400,
      {'Content-Type': 'application/json'},
    )
  }

  try {
    const client = getWriteClient()

    const doc = await client.fetch<BirdSightingForSuggest | null>(
      `*[_type == "birdSighting" && _id == $id][0]{
        _id,
        _type,
        speciesName,
        speciesCode,
        locationLabel,
        cardImage,
        suggestedCoverSearchQueryManual,
        suggestedCoverSearchPage
      }`,
      {id},
    )

    if (!doc) {
      return responseWithCors(
        request,
        JSON.stringify({message: 'Not found.'}),
        404,
        {'Content-Type': 'application/json'},
      )
    }
    if (doc.cardImage) {
      return responseWithCors(
        request,
        JSON.stringify({message: 'Card image already exists; not suggesting.'}),
        409,
        {'Content-Type': 'application/json'},
      )
    }

    const speciesName = doc.speciesName?.trim() || 'Bird'
    const speciesCode = doc.speciesCode?.trim() || ''
    const manual = doc.suggestedCoverSearchQueryManual?.trim()
    const query = manual || buildSearchQuery(speciesName, speciesCode, doc.locationLabel ?? null)

    if (mode === 'dismiss') {
      const patch = {
        imageSuggestionStatus: 'dismissed' as const,
        suggestedCoverProvider: 'none' as const,
        suggestedCoverImageUrl: null,
        suggestedCoverImagePageUrl: null,
        suggestedCoverPhotographerName: null,
        suggestedCoverPhotographerPageUrl: null,
        suggestedCoverAltDraft: null,
      }
      await client.patch(doc._id).set(patch).commit()
      return responseWithCors(
        request,
        JSON.stringify({ok: true, patch}),
        200,
        {'Content-Type': 'application/json'},
      )
    }

    const currentPage = Number(doc.suggestedCoverSearchPage) || 1
    const nextPage = mode === 'regenerate' ? Math.min(10, currentPage + 1) : 1

    const hit = await searchUnsplash(query, nextPage)
    if (!hit?.imageUrl) {
      return responseWithCors(
        request,
        JSON.stringify({message: 'No Unsplash results.'}),
        404,
        {'Content-Type': 'application/json'},
      )
    }

    const patch: UnsplashSuggestionPatch = {
      suggestedCoverProvider: 'unsplash',
      suggestedCoverImageUrl: hit.imageUrl,
      suggestedCoverImagePageUrl: hit.photoPageUrl,
      suggestedCoverPhotographerName: hit.photographerName,
      suggestedCoverPhotographerPageUrl: hit.photographerPageUrl,
      suggestedCoverAltDraft: buildAltDraft(speciesName, doc.locationLabel ?? null, hit.altDescription),
      suggestedCoverSearchQueryLast: query,
      suggestedCoverSearchPage: nextPage,
      imageSuggestionStatus: 'pending_review',
    }

    await client.patch(doc._id).set(patch).commit()
    return responseWithCors(
      request,
      JSON.stringify({ok: true, patch}),
      200,
      {'Content-Type': 'application/json'},
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : 'suggest_failed'
    return responseWithCors(
      request,
      JSON.stringify({message}),
      500,
      {'Content-Type': 'application/json'},
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return responseWithCors(request, null, 204)
}

