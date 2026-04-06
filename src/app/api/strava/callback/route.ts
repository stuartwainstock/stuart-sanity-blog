import {cookies} from 'next/headers'
import {type NextRequest, NextResponse} from 'next/server'
import {exchangeAuthorizationCode} from '@/lib/strava/oauth'
import {saveStravaTokensFromExchange} from '@/lib/strava/tokens'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const error = url.searchParams.get('error')
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  const base = new URL('/runs', request.url)

  if (error) {
    base.searchParams.set('strava', 'error')
    base.searchParams.set('reason', error)
    return NextResponse.redirect(base)
  }

  const cookieStore = await cookies()
  const expected = cookieStore.get('strava_oauth_state')?.value
  cookieStore.delete('strava_oauth_state')

  if (!code || !state || !expected || state !== expected) {
    base.searchParams.set('strava', 'error')
    base.searchParams.set('reason', 'invalid_state')
    return NextResponse.redirect(base)
  }

  try {
    const tokens = await exchangeAuthorizationCode(code)
    await saveStravaTokensFromExchange(tokens)
    base.searchParams.set('strava', 'connected')
    return NextResponse.redirect(base)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'token_exchange_failed'
    base.searchParams.set('strava', 'error')
    base.searchParams.set('reason', message.slice(0, 200))
    return NextResponse.redirect(base)
  }
}
