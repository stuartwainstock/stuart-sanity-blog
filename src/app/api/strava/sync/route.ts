import {type NextRequest, NextResponse} from 'next/server'
import {syncStravaRuns} from '@/lib/strava/sync'

export const dynamic = 'force-dynamic'

/**
 * Pull runs from Strava into Supabase.
 *
 * GET  — Vercel Cron (runs daily at 06:00 UTC via vercel.json).
 *         Vercel automatically provides Authorization: Bearer <CRON_SECRET>.
 *         Set CRON_SECRET in Vercel project environment variables.
 *
 * POST — Manual trigger or external curl.
 *         If STRAVA_SYNC_SECRET is set, requires: Authorization: Bearer <secret>.
 *         Otherwise allowed without auth (local dev only — always set the secret in production).
 */

function runSync() {
  return syncStravaRuns()
    .then((result) => NextResponse.json({ok: true, ...result}))
    .catch((e) => {
      const message = e instanceof Error ? e.message : 'sync_failed'
      const status = message.includes('not connected') ? 400 : 500
      return NextResponse.json({ok: false, message}, {status})
    })
}

/** Vercel Cron — validates CRON_SECRET injected by Vercel. */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
    if (auth !== cronSecret) {
      return NextResponse.json({message: 'Unauthorized'}, {status: 401})
    }
  }
  return runSync()
}

/** Manual trigger / external curl — validates STRAVA_SYNC_SECRET. */
export async function POST(request: NextRequest) {
  const expected = process.env.STRAVA_SYNC_SECRET
  if (expected) {
    const auth = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
    if (auth !== expected) {
      return NextResponse.json({message: 'Unauthorized'}, {status: 401})
    }
  }
  return runSync()
}
