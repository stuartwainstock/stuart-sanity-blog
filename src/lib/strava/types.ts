/** Strava OAuth token response (subset). */
export type StravaTokenResponse = {
  token_type: string
  expires_at: number
  expires_in: number
  refresh_token: string
  access_token: string
  athlete?: {
    id: number
  }
}

/** Row from Supabase `strava_activities` for map + table. */
export type StravaRunRow = {
  id: number
  name: string | null
  start_date: string
  distance_m: number | null
  map_polyline: string | null
}

/** Activity summary from GET /athlete/activities (subset). */
export type StravaActivitySummary = {
  id: number
  name: string
  distance: number
  moving_time: number
  elapsed_time: number
  sport_type: string
  start_date: string
  map?: {
    id: string
    summary_polyline?: string
    polyline?: string
  }
}
