import {cookies} from 'next/headers'
import {NextResponse} from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Starts Strava OAuth. User is redirected to Strava, then back to /api/strava/callback.
 * Register the same redirect URI in your Strava API application settings.
 */
export async function GET() {
  const clientId = process.env.STRAVA_CLIENT_ID
  const redirectUri = process.env.STRAVA_REDIRECT_URI
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {message: 'Missing STRAVA_CLIENT_ID or STRAVA_REDIRECT_URI'},
      {status: 500},
    )
  }

  const state = crypto.randomUUID()
  const cookieStore = await cookies()
  cookieStore.set('strava_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
    secure: process.env.NODE_ENV === 'production',
  })

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'activity:read_all',
    state,
  })

  return NextResponse.redirect(`https://www.strava.com/oauth/authorize?${params}`)
}
