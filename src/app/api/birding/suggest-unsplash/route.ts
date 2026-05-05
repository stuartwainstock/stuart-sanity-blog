import type {NextRequest} from 'next/server'
import {getSanityWriteClient} from '@/lib/sanity.server'
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
  if (allowed.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin)
  } else {
    // Hosted Studio ergonomics: if a proxy secret is configured, allow sanity.studio origins
    // even when SANITY_BIRDING_CORS_ORIGINS is missing/mis-scoped. The secret remains the
    // primary access control; CORS is only browser enforcement.
    const hasProxySecret = Boolean(process.env.BIRDING_SUGGEST_PROXY_SECRET?.trim())
    if (!hasProxySecret) return
    try {
      const h = new URL(origin).hostname
      if (!h.endsWith('.sanity.studio')) return
    } catch {
      return
    }
    headers.set('Access-Control-Allow-Origin', origin)
  }
  headers.set('Access-Control-Allow-Credentials', 'true')
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
  mode: 'suggest' | 'regenerate' | 'dismiss' | 'confirm'
  suggestedUrl?: string | null
  suggestedAltDraft?: string | null
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
  if (!unsplashKey) return {ok: false as const, reason: 'missing_key' as const}

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
  if (!res.ok) return {ok: false as const, reason: 'http_error' as const}

  const json: unknown = await res.json().catch(() => null)
  const hit =
    typeof json === 'object' &&
    json != null &&
    'results' in json &&
    Array.isArray((json as {results?: unknown}).results)
      ? (json as {results: unknown[]}).results[0]
      : null
  if (!hit) return {ok: false as const, reason: 'no_results' as const}

  const hitRecord = hit as Record<string, unknown>
  const urls = (hitRecord.urls as Record<string, unknown> | undefined) ?? {}
  const user = (hitRecord.user as Record<string, unknown> | undefined) ?? {}
  const links = (hitRecord.links as Record<string, unknown> | undefined) ?? {}
  const userLinks = (user.links as Record<string, unknown> | undefined) ?? {}
  const altDescription =
    (typeof hitRecord.alt_description === 'string' && hitRecord.alt_description.trim()) ||
    (typeof hitRecord.description === 'string' && hitRecord.description.trim()) ||
    null

  const imageUrl =
    (typeof urls.regular === 'string' && urls.regular) ||
    (typeof urls.small === 'string' && urls.small) ||
    null
  if (!imageUrl) return {ok: false as const, reason: 'no_results' as const}

  function withAttributionParams(raw: string | null): string | null {
    if (!raw) return null
    try {
      const u = new URL(raw)
      // Unsplash API guidelines: include attribution params on links.
      if (!u.searchParams.get('utm_source')) u.searchParams.set('utm_source', 'stuartwainstock')
      if (!u.searchParams.get('utm_medium')) u.searchParams.set('utm_medium', 'referral')
      return u.toString()
    } catch {
      return raw
    }
  }

  return {
    ok: true as const,
    imageUrl,
    photoPageUrl: withAttributionParams(typeof links.html === 'string' ? links.html : null),
    photographerName: typeof user.name === 'string' ? user.name : null,
    photographerPageUrl: withAttributionParams(
      typeof userLinks.html === 'string' ? userLinks.html : null
    ),
    altDescription,
  }
}

function buildFallbackQueries(args: {
  manual: string | null
  speciesName: string
  speciesCode: string
  locationLabel: string | null
}): string[] {
  const manual = args.manual?.trim() || ''
  if (manual) return [manual]

  const name = args.speciesName.trim() || 'bird'
  const code = args.speciesCode.trim()
  const loc = (args.locationLabel || '').trim()

  // Start specific → get progressively more forgiving.
  const candidates = [
    // Original
    buildSearchQuery(name, code, args.locationLabel),
    // Drop location
    [name, code, 'wild bird North America'].filter(Boolean).join(' ').trim(),
    // Drop species code (often too niche)
    [name, 'wild bird North America'].filter(Boolean).join(' ').trim(),
    // Drop region bias (fallback)
    [name, 'wild bird'].filter(Boolean).join(' ').trim(),
    // If name contains owl/woodpecker etc, keep name only.
    name,
  ]

  const out: string[] = []
  for (const q of candidates) {
    const t = q.replace(/\s+/g, ' ').trim()
    if (!t) continue
    if (!out.includes(t)) out.push(t)
  }
  // If we had a location, try it paired with name as a last resort.
  if (loc) {
    const q = `${name} ${loc}`.replace(/\s+/g, ' ').trim()
    if (!out.includes(q)) out.push(q)
  }
  return out
}

function isAllowedUnsplashUrl(url: string): boolean {
  try {
    const u = new URL(url)
    const h = u.hostname.toLowerCase()
    return (
      h === 'images.unsplash.com' ||
      h.endsWith('.images.unsplash.com') ||
      h === 'unsplash.com' ||
      h.endsWith('.unsplash.com')
    )
  } catch {
    return false
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
  if (
    !id ||
    (mode !== 'suggest' &&
      mode !== 'regenerate' &&
      mode !== 'dismiss' &&
      mode !== 'confirm')
  ) {
    return responseWithCors(
      request,
      JSON.stringify({message: 'Missing id or invalid mode.'}),
      400,
      {'Content-Type': 'application/json'},
    )
  }

  try {
    const client = getSanityWriteClient()

    const candidateIds = (() => {
      const base = id.replace(/^drafts\./, '')
      const draft = `drafts.${base}`
      // Preserve caller order first; then try the other form.
      return id.startsWith('drafts.') ? [id, base] : [id, draft]
    })()

    const doc = await client.fetch<
      (BirdSightingForSuggest & {
        suggestedCoverImageUrl?: string | null
        suggestedCoverAltDraft?: string | null
        cardImageAlt?: string | null
      }) | null
    >(
      `*[
        _type == "birdSighting"
        && _id in $ids
      ][0]{
        _id,
        _type,
        speciesName,
        speciesCode,
        locationLabel,
        cardImage,
        cardImageAlt,
        suggestedCoverImageUrl,
        suggestedCoverAltDraft,
        suggestedCoverSearchQueryManual,
        suggestedCoverSearchPage
      }`,
      {ids: candidateIds},
    )

    if (!doc) {
      return responseWithCors(
        request,
        JSON.stringify({message: 'Not found.', triedIds: candidateIds}),
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
    const manual = doc.suggestedCoverSearchQueryManual?.trim() ?? null
    const queries = buildFallbackQueries({
      manual,
      speciesName,
      speciesCode,
      locationLabel: doc.locationLabel ?? null,
    })

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

    if (mode === 'confirm') {
      const requestedUrl = typeof body.suggestedUrl === 'string' ? body.suggestedUrl.trim() : ''
      const fallbackUrl = (doc.suggestedCoverImageUrl || '').trim()
      const url = requestedUrl || fallbackUrl
      if (!url) {
        return responseWithCors(
          request,
          JSON.stringify({message: 'No suggested image URL to confirm.'}),
          400,
          {'Content-Type': 'application/json'},
        )
      }
      if (!isAllowedUnsplashUrl(url)) {
        return responseWithCors(
          request,
          JSON.stringify({message: 'Suggested URL is not an allowed Unsplash host.'}),
          400,
          {'Content-Type': 'application/json'},
        )
      }

      // Download the suggested image and upload to Sanity as a real image asset.
      const res = await fetch(url)
      if (!res.ok) {
        return responseWithCors(
          request,
          JSON.stringify({message: `Failed to download suggested image (HTTP ${res.status}).`}),
          502,
          {'Content-Type': 'application/json'},
        )
      }
      const arrayBuffer = await res.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const safeName = speciesName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 60)
      const filename = `${safeName || 'bird'}-${doc._id.slice(-12)}.jpg`

      const asset = await client.assets.upload('image', buffer, {
        filename,
        contentType: res.headers.get('content-type') || 'image/jpeg',
        source: {
          id: doc._id,
          name: 'unsplash',
          url,
        },
      })

      const patch: Record<string, unknown> = {
        cardImage: {
          _type: 'image',
          asset: {_type: 'reference', _ref: asset._id},
        },
      }

      const requestedAlt =
        typeof body.suggestedAltDraft === 'string' ? body.suggestedAltDraft.trim() : ''
      const altDraft = (requestedAlt || doc.suggestedCoverAltDraft || '').trim()
      const existingAlt = (doc.cardImageAlt || '').trim()
      if (!existingAlt && altDraft) patch.cardImageAlt = altDraft

      // If we successfully set the card image, mark the workflow done.
      patch.imageSuggestionStatus = 'none'

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

    let picked: {query: string; hit: Awaited<ReturnType<typeof searchUnsplash>> & {ok: true}} | null = null
    let lastReason: string | null = null
    for (const q of queries) {
      const res = await searchUnsplash(q, nextPage)
      if (res.ok) {
        picked = {query: q, hit: res}
        break
      }
      lastReason = res.reason
      if (res.reason === 'missing_key') break
    }

    if (!picked) {
      return responseWithCors(
        request,
        JSON.stringify({
          message:
            lastReason === 'missing_key'
              ? 'Missing UNSPLASH_ACCESS_KEY on the site environment.'
              : 'No Unsplash results.',
          triedQueries: queries.slice(0, 5),
          page: nextPage,
        }),
        lastReason === 'missing_key' ? 500 : 404,
        {'Content-Type': 'application/json'},
      )
    }

    const {query, hit} = picked
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

