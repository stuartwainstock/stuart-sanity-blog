import type {StravaActivitySummary} from '@/lib/strava/types'

const API = 'https://www.strava.com/api/v3'

export async function listActivityPage(
  accessToken: string,
  page: number,
  options?: {after?: number; before?: number},
  perPage = 200,
): Promise<StravaActivitySummary[]> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(Math.min(perPage, 200)),
  })
  if (options?.after != null) params.set('after', String(options.after))
  if (options?.before != null) params.set('before', String(options.before))

  const res = await fetch(`${API}/athlete/activities?${params}`, {
    headers: {Authorization: `Bearer ${accessToken}`},
    next: {revalidate: 0},
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Strava activities failed: ${res.status} ${text}`)
  }

  return res.json() as Promise<StravaActivitySummary[]>
}
