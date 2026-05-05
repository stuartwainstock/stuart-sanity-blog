import type {NextRequest} from 'next/server'
import {normalizeXenocantoFileUrl} from '@/lib/birding/xenocantoFileUrl'
import {getSanityWriteClient} from '@/lib/sanity.server'
import {hasValidAdminSession} from '@/lib/admin/session'

export const dynamic = 'force-dynamic'

// ── CORS ──────────────────────────────────────────────────────────────────────

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
  headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-birding-suggest-secret',
  )
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

// ── Auth ───────────────────────────────────────────────────────────────────────

function safeCompareString(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}

async function isAuthorized(request: NextRequest): Promise<boolean> {
  if (await hasValidAdminSession()) return true
  const expected = process.env.BIRDING_SUGGEST_PROXY_SECRET?.trim()
  if (!expected) return false
  const fromHeader = request.headers.get('x-birding-suggest-secret')?.trim()
  const fromAuth = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  const provided = fromHeader || fromAuth || ''
  if (!provided) return false
  return safeCompareString(provided, expected)
}

// ── Xeno-canto ────────────────────────────────────────────────────────────────

type XenocantoRecording = {
  id: string
  en: string         // English common name
  rec: string        // Recordist name
  cnt: string        // Country
  type: string       // Recording type (song, call, etc.)
  url: string        // Xeno-canto page URL
  file: string       // Direct audio file URL
  'file-name': string
  lic: string        // License URL
  q: string          // Quality (A–E)
  length: string     // Duration string e.g. "1:23"
}

type XenocantoResponse = {
  numRecordings: string
  recordings: XenocantoRecording[]
}

type XenocantoHit = {
  audioUrl: string
  sourceUrl: string
  recordist: string
  recordingType: string
  quality: string
  lengthSeconds: string
  license: string
}

/**
 * Build a ranked list of Xeno-canto query strings to try for a given species.
 * Prefers quality-A songs, then quality-A any type, then any quality.
 */
function buildQueries(speciesName: string, speciesCode: string): string[] {
  const name = `"${speciesName.trim() || 'bird'}"`
  const code = (speciesCode || '').trim()
  const candidates: string[] = [
    `${name} q:A type:song`,
    `${name} q:A type:call`,
    `${name} q:A`,
    `${name} q:B type:song`,
    `${name} q:B`,
    `${name}`,
  ]
  // Fall back to species code in case the common name isn't indexed
  if (code) {
    candidates.push(`${code} q:A`, code)
  }
  // Dedupe
  return [...new Set(candidates)]
}

async function searchXenocanto(
  query: string,
  page: number,
): Promise<{ok: true; hit: XenocantoHit} | {ok: false; reason: string}> {
  const u = new URL('https://xeno-canto.org/api/2/recordings')
  u.searchParams.set('query', query)
  u.searchParams.set('page', String(Math.max(1, page)))

  const res = await fetch(u.toString(), {
    headers: {'User-Agent': 'stuartwainstock.com birding dashboard'},
  })

  if (!res.ok) return {ok: false, reason: `xc_http_${res.status}`}

  const json = (await res.json().catch(() => null)) as XenocantoResponse | null
  if (!json || !Array.isArray(json.recordings) || json.recordings.length === 0) {
    return {ok: false, reason: 'no_results'}
  }

  const rec = json.recordings[0]
  if (!rec.file?.trim()) return {ok: false, reason: 'no_file_url'}

  return {
    ok: true,
    hit: {
      audioUrl: normalizeXenocantoFileUrl(rec.file),
      sourceUrl: rec.url.startsWith('http') ? rec.url.trim() : `https:${rec.url.trim()}`,
      recordist: rec.rec?.trim() || 'Unknown',
      recordingType: rec.type?.trim() || 'recording',
      quality: rec.q?.trim() || '?',
      lengthSeconds: rec.length?.trim() || '',
      license: rec.lic?.trim() || '',
    },
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

type RequestBody = {
  id: string
  mode: 'suggest' | 'regenerate' | 'dismiss' | 'confirm'
  page?: number
}

type BirdSightingDoc = {
  _id: string
  speciesName?: string
  speciesCode?: string
  callAudioUrl?: string | null
  audioSuggestionStatus?: string | null
  suggestedAudioUrl?: string | null
  suggestedAudioRecordist?: string | null
  suggestedAudioSourceUrl?: string | null
  suggestedAudioPage?: number | null
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return responseWithCors(
      request,
      JSON.stringify({message: 'Unauthorized. Set BIRDING_SUGGEST_PROXY_SECRET on the site and SANITY_STUDIO_BIRDING_SUGGEST_SECRET in the Studio build.'}),
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
  if (!id || !['suggest', 'regenerate', 'dismiss', 'confirm'].includes(mode)) {
    return responseWithCors(
      request,
      JSON.stringify({message: 'Missing id or invalid mode.'}),
      400,
      {'Content-Type': 'application/json'},
    )
  }

  try {
    const client = getSanityWriteClient()

    // Resolve draft + published IDs
    const base = id.replace(/^drafts\./, '')
    const draft = `drafts.${base}`
    const candidateIds = id.startsWith('drafts.') ? [id, base] : [id, draft]

    const doc = await client.fetch<BirdSightingDoc | null>(
      `*[_type == "birdSighting" && _id in $ids][0]{
        _id,
        speciesName,
        speciesCode,
        callAudioUrl,
        audioSuggestionStatus,
        suggestedAudioUrl,
        suggestedAudioRecordist,
        suggestedAudioSourceUrl,
        suggestedAudioPage
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

    // ── Dismiss ──────────────────────────────────────────────────────────────
    if (mode === 'dismiss') {
      const patch = {
        audioSuggestionStatus: 'dismissed' as const,
        suggestedAudioUrl: null,
        suggestedAudioRecordist: null,
        suggestedAudioSourceUrl: null,
        suggestedAudioType: null,
        suggestedAudioQuality: null,
        suggestedAudioLength: null,
        suggestedAudioPage: null,
      }
      await client.patch(doc._id).set(patch).commit()
      return responseWithCors(
        request,
        JSON.stringify({ok: true, patch}),
        200,
        {'Content-Type': 'application/json'},
      )
    }

    // ── Confirm ───────────────────────────────────────────────────────────────
    if (mode === 'confirm') {
      const url = doc.suggestedAudioUrl?.trim()
      if (!url) {
        return responseWithCors(
          request,
          JSON.stringify({message: 'No suggested audio URL to confirm.'}),
          400,
          {'Content-Type': 'application/json'},
        )
      }
      // Write the confirmed URL to the standard callAudioUrl field.
      // Attribution stays in suggestedAudioRecordist / suggestedAudioSourceUrl
      // so BirdCard can show it alongside the player.
      const patch = {
        callAudioUrl: url,
        audioSuggestionStatus: 'none' as const,
        suggestedAudioUrl: null,
      }
      await client.patch(doc._id).set(patch).commit()
      return responseWithCors(
        request,
        JSON.stringify({ok: true, patch}),
        200,
        {'Content-Type': 'application/json'},
      )
    }

    // ── Suggest / Regenerate ─────────────────────────────────────────────────
    const speciesName = doc.speciesName?.trim() || 'bird'
    const speciesCode = doc.speciesCode?.trim() || ''
    const queries = buildQueries(speciesName, speciesCode)
    const currentPage = Number(doc.suggestedAudioPage) || 1
    const nextPage = mode === 'regenerate' ? Math.min(20, currentPage + 1) : 1

    let picked: XenocantoHit | null = null
    let lastReason = 'no_results'

    for (const q of queries) {
      const result = await searchXenocanto(q, nextPage)
      if (result.ok) {
        picked = result.hit
        break
      }
      lastReason = result.reason
    }

    if (!picked) {
      return responseWithCors(
        request,
        JSON.stringify({
          message: lastReason === 'no_results' ? 'No Xeno-canto results found.' : `Xeno-canto error: ${lastReason}`,
          triedQueries: queries.slice(0, 4),
        }),
        404,
        {'Content-Type': 'application/json'},
      )
    }

    const patch = {
      audioSuggestionStatus: 'pending_review' as const,
      suggestedAudioUrl: picked.audioUrl,
      suggestedAudioRecordist: picked.recordist,
      suggestedAudioSourceUrl: picked.sourceUrl,
      suggestedAudioType: picked.recordingType,
      suggestedAudioQuality: picked.quality,
      suggestedAudioLength: picked.lengthSeconds,
      suggestedAudioPage: nextPage,
    }
    await client.patch(doc._id).set(patch).commit()
    return responseWithCors(
      request,
      JSON.stringify({ok: true, patch}),
      200,
      {'Content-Type': 'application/json'},
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : 'suggest_audio_failed'
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
