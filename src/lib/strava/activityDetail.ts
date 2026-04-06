const API = 'https://www.strava.com/api/v3'

/** Detailed activity (fields we merge for location / effort). */
export type StravaDetailedActivity = {
  id: number
  location_city?: string | null
  location_state?: string | null
  location_country?: string | null
  start_latlng?: number[] | null
  /** Relative Effort in the app; `suffer_score` in the API. */
  suffer_score?: number | null
}

export async function fetchActivityDetail(
  accessToken: string,
  activityId: number,
): Promise<StravaDetailedActivity | null> {
  const res = await fetch(`${API}/activities/${activityId}`, {
    headers: {Authorization: `Bearer ${accessToken}`},
    next: {revalidate: 0},
  })
  if (!res.ok) return null
  return res.json() as Promise<StravaDetailedActivity>
}
