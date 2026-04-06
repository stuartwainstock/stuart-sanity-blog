import type {StravaRunRow, StravaRunTableRow} from '@/lib/strava/types'
import {gearIdFromRaw} from '@/lib/strava/gear'

export function formatLocationFromRaw(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const city = typeof r.location_city === 'string' ? r.location_city.trim() : ''
  const state = typeof r.location_state === 'string' ? r.location_state.trim() : ''
  const country = typeof r.location_country === 'string' ? r.location_country.trim() : ''
  const parts = [city, state, country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : null
}

export function enrichRunsForTable(
  runs: StravaRunRow[],
  gearById: Map<string, string>,
): StravaRunTableRow[] {
  return runs.map((r) => {
    const gid = gearIdFromRaw(r.raw)
    const shoeLabel = gid ? gearById.get(gid) ?? null : null
    return {
      id: r.id,
      start_date: r.start_date,
      distance_m: r.distance_m,
      locationLabel: formatLocationFromRaw(r.raw),
      shoeLabel,
    }
  })
}
