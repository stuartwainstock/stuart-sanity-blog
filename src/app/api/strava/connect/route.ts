import {cookies} from 'next/headers'
import {type NextRequest, NextResponse} from 'next/server'
import {
  allowInsecureStravaConnect,
  hasValidAdminSession,
  isStravaAdminAuthConfigured,
} from '@/lib/admin/session'

export const dynamic = 'force-dynamic'

/**
 * Starts Strava OAuth. User is redirected to Strava, then back to /api/strava/callback.
 * Register the same redirect URI in your Strava API application settings.
 *
 * In production, requires a valid admin session (see /admin/login) so unauthenticated visitors
 * cannot bind their Strava account to this site's singleton integration.
 */
export async function GET(request: NextRequest) {
  if (!allowInsecureStravaConnect()) {
    if (!isStravaAdminAuthConfigured()) {
      return NextResponse.json(
        {
          message:
            'Strava OAuth is not configured: set ADMIN_PASSWORD (and optionally ADMIN_SESSION_SECRET) in the environment, then sign in at /admin/login.',
        },
        {status: 503},
      )
    }
    if (!(await hasValidAdminSession())) {
      const login = new URL('/admin/login', request.url)
      login.searchParams.set('next', '/api/strava/connect')
      return NextResponse.redirect(login)
    }
  }

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
    scope: 'activity:read_all,profile:read_all',
    state,
  })

  return NextResponse.redirect(`https://www.strava.com/oauth/authorize?${params}`)
}
