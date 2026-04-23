import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import ogs from 'open-graph-scraper'
import { promises as dns } from 'node:dns'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const sanityWriteToken = process.env.SANITY_API_WRITE_TOKEN
const addLinkApiKey = process.env.QUICK_ADD_API_KEY

const hasSanityConfig = Boolean(projectId && dataset && sanityWriteToken)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * SSRF guard — resolves the hostname and rejects any URL that points to
 * loopback, private, link-local, or cloud-metadata IP ranges.
 * Called immediately before open-graph-scraper makes an outbound fetch.
 */
const PRIVATE_IP_PATTERNS = [
  /^127\./,                       // loopback IPv4
  /^10\./,                        // RFC 1918
  /^172\.(1[6-9]|2\d|3[01])\./,  // RFC 1918
  /^192\.168\./,                  // RFC 1918
  /^169\.254\./,                  // link-local + AWS/GCP metadata endpoint
  /^0\./,                         // "this" network
  /^::1$/,                        // IPv6 loopback
  /^fc/i,                         // IPv6 ULA
  /^fe80/i,                       // IPv6 link-local
  /^fd/i,                         // IPv6 ULA
]

async function isSafeExternalUrl(value: string): Promise<boolean> {
  let hostname: string
  try {
    hostname = new URL(value).hostname
  } catch {
    return false
  }

  // Reject raw IP hostnames that match private ranges directly
  if (PRIVATE_IP_PATTERNS.some((r) => r.test(hostname))) return false

  // Resolve hostname and verify all returned addresses are public
  try {
    const v4 = await dns.lookup(hostname, { family: 4 }).catch(() => null)
    const v6 = await dns.lookup(hostname, { family: 6 }).catch(() => null)
    for (const addr of [v4?.address, v6?.address].filter(Boolean) as string[]) {
      if (PRIVATE_IP_PATTERNS.some((r) => r.test(addr))) return false
    }
  } catch {
    return false // Cannot resolve → do not fetch
  }

  return true
}

function normalizeUrl(value: string): string {
  const parsed = new URL(value)
  parsed.hash = ''

  if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
    parsed.pathname = parsed.pathname.slice(0, -1)
  }

  return parsed.toString()
}

function getSourceDomain(value: string): string {
  return new URL(value).hostname.replace(/^www\./, '')
}

/** Human-readable message when ogs returns `error: true` (result.error may not always be a string at runtime). */
function formatOgsFailure(ogsResponse: unknown): string {
  if (!ogsResponse || typeof ogsResponse !== 'object') {
    return 'Open Graph fetch failed'
  }
  const top = ogsResponse as Record<string, unknown>
  const inner = top.result
  if (inner && typeof inner === 'object') {
    const r = inner as Record<string, unknown>
    if (typeof r.error === 'string' && r.error.length > 0) {
      const code =
        r.errorDetails && typeof r.errorDetails === 'object'
          ? (r.errorDetails as { code?: string }).code
          : undefined
      return code ? `${r.error} (${code})` : r.error
    }
  }
  if (typeof top.error === 'string' && top.error.length > 0) {
    return top.error
  }
  try {
    return JSON.stringify(ogsResponse)
  } catch {
    return 'Open Graph fetch failed'
  }
}

function getErrorDetail(err: unknown): string {
  if (err instanceof Error) {
    return err.message
  }
  if (typeof err === 'string') {
    return err
  }
  if (err && typeof err === 'object') {
    const maybe = err as Record<string, unknown>
    const known =
      (typeof maybe.message === 'string' && maybe.message) ||
      (typeof maybe.description === 'string' && maybe.description) ||
      (typeof maybe.error === 'string' && maybe.error) ||
      (typeof maybe.details === 'string' && maybe.details)

    if (known) return known

    try {
      return JSON.stringify(err)
    } catch {
      return 'Unserializable non-Error object thrown'
    }
  }
  return 'Unknown error value thrown'
}

async function createResourceFromUrl(url: string) {
  if (!hasSanityConfig) {
    return { status: 500, body: { error: 'Server is missing Sanity write configuration.' } }
  }
  if (!url || !isValidUrl(url)) {
    return { status: 400, body: { error: 'Please provide a valid URL.' } }
  }

  try {
    const normalizedUrl = normalizeUrl(url)
    const sourceDomain = getSourceDomain(normalizedUrl)

    const client = createClient({
      projectId,
      dataset,
      apiVersion: '2023-05-03',
      token: sanityWriteToken,
      useCdn: false,
    })

    const existing = await client.fetch<{
      _id: string
      title?: string
      url?: string
      sourceDomain?: string
    } | null>(
      `*[_type == "resource" && normalizedUrl == $normalizedUrl][0]{
        _id,
        title,
        url,
        sourceDomain
      }`,
      { normalizedUrl }
    )

    if (existing) {
      return {
        status: 200,
        body: {
          ok: true,
          duplicate: true,
          id: existing._id,
          title: existing.title || normalizedUrl,
          url: existing.url || normalizedUrl,
          sourceDomain: existing.sourceDomain || sourceDomain,
        },
      }
    }

    // Metadata scraping can fail for certificate/network reasons on some sites.
    // We still create a resource so capture flow never blocks.
    let title = url
    let summary = ''
    let image = ''
    let metadataWarning: string | undefined

    // SSRF guard: block requests to private/link-local/metadata IP ranges.
    const safe = await isSafeExternalUrl(normalizedUrl)
    if (!safe) {
      return { status: 400, body: { error: 'URL resolves to a disallowed network range.' } }
    }

    // ogs can throw, or return { error: true, result: { error: "...", ... } } — never block create.
    try {
      const ogsResponse = await ogs({ url: normalizedUrl, timeout: 10000 })
      const { result, error } = ogsResponse as {
        result?: {
          success?: boolean
          error?: string
          ogTitle?: string
          twitterTitle?: string
          dcTitle?: string
          ogDescription?: string
          twitterDescription?: string
          dcDescription?: string
          ogImage?: { url?: string }[]
          twitterImage?: { url?: string }[]
        }
        error?: boolean | string
      }

      if (error) {
        metadataWarning = formatOgsFailure(ogsResponse)
      } else if (result) {
        title =
          result.ogTitle ||
          result.twitterTitle ||
          result.dcTitle ||
          url
        summary =
          result.ogDescription ||
          result.twitterDescription ||
          result.dcDescription ||
          ''
        image =
          result.ogImage?.[0]?.url ||
          result.twitterImage?.[0]?.url ||
          ''
      }
    } catch (ogsErr) {
      metadataWarning = getErrorDetail(ogsErr)
    }

    // Sanity `url` fields reject empty strings — omit `image` when missing.
    const created = await client.create({
      _type: 'resource',
      title,
      url: normalizedUrl,
      sourceDomain,
      normalizedUrl,
      summary,
      ...(image ? { image } : {}),
      mediaType: 'article',
      status: 'inbox',
      tags: [],
      addedDate: new Date().toISOString(),
    })

    return {
      status: 201,
      body: {
        ok: true,
        duplicate: false,
        id: created._id,
        title: created.title,
        url: created.url,
        sourceDomain: created.sourceDomain,
        ...(metadataWarning ? { metadataWarning } : {}),
      },
    }
  } catch (err) {
    console.error('Failed to add link:', err)
    const message = getErrorDetail(err)
    return {
      status: 500,
      body: {
        error: 'Unexpected server error while adding link.',
        // Helps debug Vercel logs + client without exposing stack in production detail field
        detail: message,
      },
    }
  }
}

export async function POST(request: NextRequest) {
  const incomingApiKey = request.headers.get('x-api-key')
  if (!addLinkApiKey || incomingApiKey !== addLinkApiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
  }

  let body: { url?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400, headers: corsHeaders })
  }

  const result = await createResourceFromUrl(body.url?.trim() || '')
  return NextResponse.json(result.body, { status: result.status, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const incomingApiKey = searchParams.get('key')
  const url = searchParams.get('url')?.trim() || ''

  if (!addLinkApiKey || incomingApiKey !== addLinkApiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await createResourceFromUrl(url)
  return NextResponse.json(result.body, { status: result.status })
}
