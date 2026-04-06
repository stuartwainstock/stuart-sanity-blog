/** Strava gear / shoes resolution for activity `gear_id`. */

const API = 'https://www.strava.com/api/v3'

type SummaryGear = {
  id: string | number
  name?: string
  nickname?: string | null
  brand_name?: string
  model_name?: string
}

export function gearIdFromRaw(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null
  const id = (raw as Record<string, unknown>).gear_id
  if (id == null || id === '' || id === 'none') return null
  return String(id)
}

function formatGearName(g: SummaryGear): string {
  const nick = typeof g.nickname === 'string' ? g.nickname.trim() : ''
  if (nick) return nick
  const name = typeof g.name === 'string' ? g.name.trim() : ''
  if (name) return name
  const brand = typeof g.brand_name === 'string' ? g.brand_name.trim() : ''
  const model = typeof g.model_name === 'string' ? g.model_name.trim() : ''
  const combined = [brand, model].filter(Boolean).join(' ')
  return combined || 'Gear'
}

async function fetchGearById(accessToken: string, gearId: string): Promise<string | null> {
  const res = await fetch(`${API}/gear/${encodeURIComponent(gearId)}`, {
    headers: {Authorization: `Bearer ${accessToken}`},
    next: {revalidate: 0},
  })
  if (!res.ok) return null
  const g = (await res.json()) as SummaryGear
  return formatGearName(g)
}

/**
 * Map Strava gear id → display name using athlete shoes (and optional per-id fetch).
 * Requires `profile:read_all` on the OAuth token for `GET /athlete` shoes list.
 */
export async function buildGearNameMap(
  accessToken: string,
  gearIdsFromActivities: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>()

  const athleteRes = await fetch(`${API}/athlete`, {
    headers: {Authorization: `Bearer ${accessToken}`},
    next: {revalidate: 0},
  })

  if (athleteRes.ok) {
    const athlete = (await athleteRes.json()) as {shoes?: SummaryGear[]}
    for (const g of athlete.shoes ?? []) {
      map.set(String(g.id), formatGearName(g))
    }
  }

  const uniqueNeeded = [...new Set(gearIdsFromActivities.filter(Boolean))].filter((id) => !map.has(id))

  const capped = uniqueNeeded.slice(0, 25)
  await Promise.all(
    capped.map(async (id) => {
      const label = await fetchGearById(accessToken, id)
      if (label) map.set(id, label)
    }),
  )

  return map
}
