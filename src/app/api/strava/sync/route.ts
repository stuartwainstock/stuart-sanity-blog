import {type NextRequest, NextResponse} from 'next/server'
import {syncStravaRuns} from '@/lib/strava/sync'

export const dynamic = 'force-dynamic'

/**
 * Pull runs from Strava into Supabase.
 * If STRAVA_SYNC_SECRET is set, require: Authorization: Bearer <secret>
 * (for cron / manual curl). Otherwise allowed without auth (local dev only—set the secret in production).
 */
export async function POST(request: NextRequest) {
  const expected = process.env.STRAVA_SYNC_SECRET
  if (expected) {
    const auth = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
    if (auth !== expected) {
      return NextResponse.json({message: 'Unauthorized'}, {status: 401})
    }
  }

  try {
    const result = await syncStravaRuns()
    return NextResponse.json({ok: true, ...result})
  } catch (e) {
    const message = e instanceof Error ? e.message : 'sync_failed'
    const status = message.includes('not connected') ? 400 : 500
    return NextResponse.json({ok: false, message}, {status})
  }
}
