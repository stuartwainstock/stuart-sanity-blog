import {normalizeGaEnvForVercel, normalizeGaPropertyId} from '@/lib/analytics/gaEnv'
import {probeGa4MinimalReport} from '@/lib/analytics/ga4DataProbe'
import type {NextRequest} from 'next/server'

/**
 * Returns the real GA4 Data API outcome (including Google error bodies).
 * Disabled unless `ANALYTICS_DIAGNOSE_SECRET` is set and the request sends matching
 * `x-analytics-diagnose-secret` (avoid leaving this open on the public web).
 */
export async function GET(request: NextRequest) {
  const expected = process.env.ANALYTICS_DIAGNOSE_SECRET?.trim()
  if (!expected) {
    return new Response(null, {status: 404})
  }

  const provided =
    request.headers.get('x-analytics-diagnose-secret')?.trim() ??
    request.nextUrl.searchParams.get('secret')?.trim()

  if (!provided || provided !== expected) {
    return new Response(null, {status: 404})
  }

  normalizeGaEnvForVercel()
  normalizeGaPropertyId()

  const result = await probeGa4MinimalReport()

  return Response.json(result, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
