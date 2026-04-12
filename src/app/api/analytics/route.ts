/**
 * GA4 proxy for `sanity-plugin-ga-dashboard`. Authenticates with Google using server-only env vars.
 *
 * Embedded Studio (`/studio`): same-origin `/api/analytics` works without CORS.
 * Hosted Studio (`*.sanity.studio`): set `NEXT_PUBLIC_SANITY_GA_API_URL` in the Studio build and
 * `SANITY_ANALYTICS_CORS_ORIGINS` on this app (Vercel) so the browser may read the response.
 *
 * @see https://github.com/hardik-143/sanity-plugin-ga-dashboard#setup
 */
import {GET as gaDashboardGET} from 'sanity-plugin-ga-dashboard/api'
import type {NextRequest} from 'next/server'

/**
 * Vercel and some dashboards store the PEM as one line with literal `\n` sequences.
 * `jose` (used by the plugin) needs real newline characters in `GA_PRIVATE_KEY`.
 */
function normalizeGaEnvForVercel() {
  const k = process.env.GA_PRIVATE_KEY
  if (k && k.includes('\\n')) {
    process.env.GA_PRIVATE_KEY = k.replace(/\\n/g, '\n')
  }
}

function allowedOrigins(): string[] {
  const raw = process.env.SANITY_ANALYTICS_CORS_ORIGINS?.trim()
  if (!raw) return []
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

function applyCors(request: NextRequest, headers: Headers) {
  const origin = request.headers.get('origin')
  if (!origin) return
  const allowed = allowedOrigins()
  if (!allowed.includes(origin)) return
  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  headers.append('Vary', 'Origin')
}

export async function GET(request: NextRequest) {
  normalizeGaEnvForVercel()
  const res = await gaDashboardGET(request)
  const headers = new Headers(res.headers)
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
