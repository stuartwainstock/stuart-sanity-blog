import {NextRequest, NextResponse} from 'next/server'
import {getSanityWriteClient} from '@/lib/sanity.server'
import ogs from 'open-graph-scraper'
import {fetchHtmlFollowingSafeRedirects, isHttpUrl, isSafeExternalUrl} from '@/lib/ssrf'

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
  return new NextResponse(null, {status: 204, headers: corsHeaders})
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

/** Log full detail server-side; never return raw network/status strings to the client. */
function metadataWarningForReason(
  reason: 'unsafe_url' | 'redirect_limit' | 'http_error' | 'too_large' | 'network_error' | 'timeout',
): string {
  switch (reason) {
    case 'unsafe_url':
      return 'URL is not allowed for metadata fetch.'
    case 'redirect_limit':
      return 'Too many redirects while fetching metadata.'
    case 'too_large':
      return 'Remote page exceeded size limit for metadata fetch.'
    case 'timeout':
      return 'Timed out while fetching metadata.'
    case 'http_error':
    case 'network_error':
    default:
      return 'Could not fetch Open Graph metadata.'
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
    return {status: 500, body: {error: 'Server is missing Sanity write configuration.'}}
  }
  if (!url || !isHttpUrl(url)) {
    return {status: 400, body: {error: 'Please provide a valid URL.'}}
  }

  try {
    const normalizedUrl = normalizeUrl(url)
    const sourceDomain = getSourceDomain(normalizedUrl)

    const client = getSanityWriteClient()

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
      {normalizedUrl},
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

    // SSRF guard: validate the initial URL, then fetch with manual redirect re-checks.
    const safe = await isSafeExternalUrl(normalizedUrl)
    if (!safe) {
      return {status: 400, body: {error: 'URL resolves to a disallowed network range.'}}
    }

    try {
      const fetched = await fetchHtmlFollowingSafeRedirects(normalizedUrl, {
        timeoutMs: 10_000,
        maxHops: 5,
        maxBodyBytes: 1_500_000,
      })

      if (!fetched.ok) {
        metadataWarning = metadataWarningForReason(fetched.reason)
        console.warn('[add-link] metadata fetch blocked/failed', {
          reason: fetched.reason,
          url: normalizedUrl,
        })
      } else {
        // Pass HTML so open-graph-scraper does not perform its own redirect-following fetch.
        // timeout is in seconds for OGS (not used for network when html is set).
        const ogsResponse = await ogs({html: fetched.html, timeout: 10})
        const {result, error} = ogsResponse as {
          result?: {
            success?: boolean
            error?: string
            ogTitle?: string
            twitterTitle?: string
            dcTitle?: string
            ogDescription?: string
            twitterDescription?: string
            dcDescription?: string
            ogImage?: {url?: string}[]
            twitterImage?: {url?: string}[]
          }
          error?: boolean | string
        }

        if (error) {
          metadataWarning = 'Could not parse Open Graph metadata.'
          console.warn('[add-link] ogs parse failed', {url: normalizedUrl, error})
        } else if (result) {
          title = result.ogTitle || result.twitterTitle || result.dcTitle || url
          summary =
            result.ogDescription || result.twitterDescription || result.dcDescription || ''
          image = result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || ''
        }
      }
    } catch (ogsErr) {
      metadataWarning = 'Could not fetch Open Graph metadata.'
      console.warn('[add-link] metadata exception', {
        url: normalizedUrl,
        detail: getErrorDetail(ogsErr),
      })
    }

    // Sanity `url` fields reject empty strings — omit `image` when missing.
    const created = await client.create({
      _type: 'resource',
      title,
      url: normalizedUrl,
      sourceDomain,
      normalizedUrl,
      summary,
      ...(image ? {image} : {}),
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
        ...(metadataWarning ? {metadataWarning} : {}),
      },
    }
  } catch (err) {
    console.error('Failed to add link:', err)
    return {
      status: 500,
      body: {
        error: 'Unexpected server error while adding link.',
      },
    }
  }
}

export async function POST(request: NextRequest) {
  const incomingApiKey = request.headers.get('x-api-key')
  if (!addLinkApiKey || incomingApiKey !== addLinkApiKey) {
    return NextResponse.json({error: 'Unauthorized'}, {status: 401, headers: corsHeaders})
  }

  let body: {url?: string} = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({error: 'Invalid JSON body.'}, {status: 400, headers: corsHeaders})
  }

  const result = await createResourceFromUrl(body.url?.trim() || '')
  return NextResponse.json(result.body, {status: result.status, headers: corsHeaders})
}

export async function GET(request: NextRequest) {
  const {searchParams} = new URL(request.url)
  const incomingApiKey = searchParams.get('key')
  const url = searchParams.get('url')?.trim() || ''

  if (!addLinkApiKey || incomingApiKey !== addLinkApiKey) {
    return NextResponse.json({error: 'Unauthorized'}, {status: 401})
  }

  const result = await createResourceFromUrl(url)
  return NextResponse.json(result.body, {status: result.status})
}
