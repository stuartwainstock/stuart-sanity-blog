/**
 * GA4 proxy for `sanity-plugin-ga-dashboard`. Authenticates with Google using server-only env vars.
 *
 * Embedded Studio (`/studio`): same-origin `/api/analytics` works without CORS.
 * Hosted Studio (`*.sanity.studio`): set `NEXT_PUBLIC_SANITY_GA_API_URL` in the Studio build and
 * `SANITY_ANALYTICS_CORS_ORIGINS` on this app (Vercel) so the browser may read the response.
 *
 * @see https://github.com/hardik-143/sanity-plugin-ga-dashboard#setup
 */
import {timingSafeEqual} from 'crypto'
import {normalizeGaEnvForVercel, normalizeGaPropertyId} from '@/lib/analytics/gaEnv'
import {hasValidAdminSession, isStravaAdminAuthConfigured} from '@/lib/admin/session'
import {GET as gaDashboardGET} from 'sanity-plugin-ga-dashboard/api'
import type {NextRequest} from 'next/server'

function safeCompareString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

function allowedOrigins(): string[] {
  const raw = process.env.SANITY_ANALYTICS_CORS_ORIGINS?.trim()
  if (!raw) return []
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

/**
 * `sanity-plugin-ga-dashboard` builds requests as `${apiUrl}?range=${n}`. If `apiUrl` already
 * contains `?secret=...`, the result is `...?secret=TOKEN?range=30`, which corrupts `secret`.
 * Fix by splitting the merged value and restoring `secret` + `range` query params.
 */
function normalizeGaDashboardPluginUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl)
    const secret = u.searchParams.get('secret')
    if (secret && secret.includes('?range=')) {
      const [s, tail] = secret.split('?range=')
      u.searchParams.set('secret', s.trim())
      const range = tail?.split('&')[0]?.trim()
      if (range) u.searchParams.set('range', range)
    }
    return u.toString()
  } catch {
    return rawUrl
  }
}

function applyCors(request: NextRequest, headers: Headers) {
  const origin = request.headers.get('origin')
  if (!origin) return
  const allowed = allowedOrigins()
  if (!allowed.includes(origin)) return
  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-analytics-proxy-secret',
  )
  headers.append('Vary', 'Origin')
}

/**
 * Server-side auth for analytics data.
 *
 * - Same-origin (embedded Studio): admin session cookie gate.
 * - Hosted Studio: send `ANALYTICS_PROXY_SECRET` either as query param `?secret=...` or header
 *   `x-analytics-proxy-secret: ...` (CORS is defense-in-depth, not access control).
 */
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

async function isAuthorized(request: NextRequest): Promise<boolean> {
  // Prefer the signed admin session cookie when available (same-origin).
  if (await hasValidAdminSession()) return true

  const expected = process.env.ANALYTICS_PROXY_SECRET?.trim()
  if (!expected) return false

  const provided =
    request.headers.get('x-analytics-proxy-secret')?.trim() ??
    request.nextUrl.searchParams.get('secret')?.trim() ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()

  if (!provided) return false
  return safeCompareString(provided, expected)
}

export async function GET(request: NextRequest) {
  const normalizedUrl = normalizeGaDashboardPluginUrl(request.url)
  const req = new NextRequest(normalizedUrl, {headers: request.headers})

  const ok = await isAuthorized(req)
  if (!ok) {
    // If there is no shared secret configured, surface a clear misconfiguration instead of
    // implying the endpoint is meant to be public.
    if (!process.env.ANALYTICS_PROXY_SECRET?.trim() && !isStravaAdminAuthConfigured()) {
      return responseWithCors(
        request,
        JSON.stringify({
          message:
            'Analytics proxy is not configured. Set ANALYTICS_PROXY_SECRET or configure admin auth (ADMIN_PASSWORD).',
        }),
        503,
        {'Content-Type': 'application/json'},
      )
    }
    // 404 without leaking details; CORS still applied so hosted Studio sees auth failure, not a CORS error.
    return responseWithCors(request, null, 404)
  }

  normalizeGaEnvForVercel()
  normalizeGaPropertyId()
  const res = await gaDashboardGET(req)
  const headers = new Headers(res.headers)
  headers.set('Cache-Control', 'no-store')
  applyCors(request, headers)
  return new Response(res.body, {status: res.status, headers})
}

export async function OPTIONS(request: NextRequest) {
  const headers = new Headers()
  applyCors(request, headers)
  if (!headers.has('Access-Control-Allow-Origin')) {
    return new Response(null, {status: 403})
  }
  return new Response(null, {status: 204, headers})
}
