import type {StravaRunRow, StravaRunTableRow} from '@/lib/strava/types'
import {fetchActivityDetail} from '@/lib/strava/activityDetail'
import {gearIdFromRaw} from '@/lib/strava/gear'

/** City / state / country from Strava (often empty on list payload; may appear after detail fetch). */
function formatCityStateCountryFromRaw(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const city = typeof r.location_city === 'string' ? r.location_city.trim() : ''
  const state = typeof r.location_state === 'string' ? r.location_state.trim() : ''
  const country = typeof r.location_country === 'string' ? r.location_country.trim() : ''
  const parts = [city, state, country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : null
}

/**
 * Strava list responses usually omit human-readable location; `start_latlng` is more reliable.
 * Format: "lat, lng" (4 decimals) as a fallback label when city/state/country are absent.
 */
function formatStartLatLngFromRaw(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const arr = r.start_latlng
  if (!Array.isArray(arr) || arr.length < 2) return null
  const lat = Number(arr[0])
  const lng = Number(arr[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
}

export function formatLocationFromRaw(raw: unknown): string | null {
  return formatCityStateCountryFromRaw(raw) ?? formatStartLatLngFromRaw(raw)
}

/** Strava “Relative Effort” (API field `suffer_score`). */
export function parseRelativeEffortFromRaw(raw: unknown): number | null {
  if (!raw || typeof raw !== 'object') return null
  const v = (raw as Record<string, unknown>).suffer_score
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n) : null
}

/**
 * Merge `GET /activities/:id` location fields when list payload has no usable label.
 * Batched to limit concurrent Strava calls.
 */
export async function enrichRunsWithActivityDetailsForLocation(
  runs: StravaRunRow[],
  accessToken: string,
  batchSize = 5,
  /** Cap Strava detail calls (newest-first runs missing a label). */
  maxDetailFetches = 30,
): Promise<StravaRunRow[]> {
  const needs = runs.filter((r) => !formatLocationFromRaw(r.raw)).slice(0, maxDetailFetches)
  if (needs.length === 0) return runs

  const detailById = new Map<number, Record<string, unknown>>()

  for (let i = 0; i < needs.length; i += batchSize) {
    const batch = needs.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map((r) => fetchActivityDetail(accessToken, r.id)),
    )
    batch.forEach((r, idx) => {
      const d = results[idx]
      if (d && typeof d === 'object') {
        detailById.set(r.id, d as unknown as Record<string, unknown>)
      }
    })
  }

  return runs.map((r) => {
    const detail = detailById.get(r.id)
    if (!detail) return r
    const base =
      typeof r.raw === 'object' && r.raw !== null ? ({...(r.raw as Record<string, unknown>)} as Record<string, unknown>) : {}
    const merged: Record<string, unknown> = {
      ...base,
      location_city: base.location_city ?? detail.location_city,
      location_state: base.location_state ?? detail.location_state,
      location_country: base.location_country ?? detail.location_country,
      start_latlng: base.start_latlng ?? detail.start_latlng,
      suffer_score: base.suffer_score ?? detail.suffer_score,
    }
    return {...r, raw: merged}
  })
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
      relativeEffort: parseRelativeEffortFromRaw(r.raw),
    }
  })
}
