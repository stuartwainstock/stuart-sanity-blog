import {createServerSupabase} from '@/lib/supabase/server'
import {refreshAccessToken} from '@/lib/strava/oauth'
import type {StravaTokenResponse} from '@/lib/strava/types'

const SKEW_MS = 5 * 60 * 1000

function expiresAtToDate(expiresAtUnix: number): string {
  return new Date(expiresAtUnix * 1000).toISOString()
}

async function persistTokens(data: StravaTokenResponse) {
  const supabase = createServerSupabase()
  const {data: existing} = await supabase
    .from('strava_oauth')
    .select('athlete_id')
    .eq('id', 'singleton')
    .maybeSingle()

  const athleteId = data.athlete?.id ?? existing?.athlete_id ?? null
  const expiresAt = expiresAtToDate(data.expires_at)
  const {error} = await supabase.from('strava_oauth').upsert(
    {
      id: 'singleton',
      athlete_id: athleteId,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: expiresAt,
      scope: null,
      updated_at: new Date().toISOString(),
    },
    {onConflict: 'id'},
  )
  if (error) throw new Error(`Failed to save Strava tokens: ${error.message}`)
}

/** Returns a valid access token, refreshing if needed. */
export async function getValidStravaAccessToken(): Promise<string> {
  const supabase = createServerSupabase()
  const {data: row, error} = await supabase.from('strava_oauth').select('*').eq('id', 'singleton').maybeSingle()

  if (error) throw new Error(`Strava oauth read failed: ${error.message}`)
  if (!row?.refresh_token) {
    throw new Error('Strava is not connected. Visit /api/strava/connect first.')
  }

  const expires = new Date(row.expires_at).getTime()
  if (expires > Date.now() + SKEW_MS) {
    return row.access_token
  }

  const refreshed = await refreshAccessToken(row.refresh_token)
  await persistTokens(refreshed)
  return refreshed.access_token
}

export async function saveStravaTokensFromExchange(data: StravaTokenResponse) {
  await persistTokens(data)
}
