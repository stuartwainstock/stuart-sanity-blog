import {createServerSupabase} from '@/lib/supabase/server'
import {
  MAX_UNIQUE_REVERSE_GEOCODE,
  NOMINATIM_REQUEST_GAP_MS,
  coordBucketKey,
  reverseGeocodePlaceLabel,
  sleep,
} from '@/lib/geocoding/nominatim'
import type {StravaRunRow, StravaRunTableRow} from '@/lib/strava/types'
import {needsReverseGeocodeForRaw, parseStartLatLngFromRaw} from '@/lib/strava/runDisplay'

export type ReverseGeocodeCacheRow = {
  bucket_key: string
  label: string
  lat: number
  lng: number
  updated_at?: string
}

const CACHE_TABLE = 'strava_reverse_geocode_cache'

/**
 * Render-path helper: replace coordinate-only labels using cached reverse-geocode labels.
 * Never calls Nominatim; safe for page load performance.
 */
export async function applyCachedReverseGeocodeLabels(
  rows: StravaRunTableRow[],
  runsById: Map<number, StravaRunRow>,
): Promise<StravaRunTableRow[]> {
  if (process.env.STRAVA_REVERSE_GEOCODE === '0') return rows

  const byBucket = new Map<string, {lat: number; lng: number}>()
  const runIdsByBucket = new Map<string, number[]>()
  const bucketOrder: string[] = []

  for (const row of rows) {
    const run = runsById.get(row.id)
    if (!run || !needsReverseGeocodeForRaw(run.raw)) continue
    const ll = parseStartLatLngFromRaw(run.raw)
    if (!ll) continue
    const key = coordBucketKey(ll.lat, ll.lng)
    if (!byBucket.has(key)) {
      byBucket.set(key, ll)
      runIdsByBucket.set(key, [])
      bucketOrder.push(key)
    }
    runIdsByBucket.get(key)!.push(row.id)
  }

  if (bucketOrder.length === 0) return rows

  const supabase = createServerSupabase()
  const {data, error} = await supabase
    .from(CACHE_TABLE)
    .select('bucket_key,label')
    .in('bucket_key', bucketOrder)

  if (error || !data) return rows

  const labelByBucket = new Map<string, string>()
  for (const r of data as {bucket_key: string; label: string}[]) {
    if (r.bucket_key && r.label) labelByBucket.set(r.bucket_key, r.label)
  }

  const idToLabel = new Map<number, string>()
  for (const key of bucketOrder) {
    const label = labelByBucket.get(key)
    if (!label) continue
    for (const id of runIdsByBucket.get(key) ?? []) idToLabel.set(id, label)
  }

  if (idToLabel.size === 0) return rows

  return rows.map((row) => {
    const resolved = idToLabel.get(row.id)
    if (!resolved) return row
    return {...row, locationLabel: resolved}
  })
}

/**
 * Sync-path helper: populate cache table for the newest runs that lack city/state/country.
 * Designed to run during Strava sync (low volume: a few new runs/week).
 */
export async function populateReverseGeocodeCacheForRuns(
  runs: StravaRunRow[],
  options?: {maxUniqueBuckets?: number},
): Promise<{uniqueBucketsFetched: number; skippedExisting: number}> {
  if (process.env.STRAVA_REVERSE_GEOCODE === '0') {
    return {uniqueBucketsFetched: 0, skippedExisting: 0}
  }

  const maxUnique =
    Math.min(
      MAX_UNIQUE_REVERSE_GEOCODE,
      Math.max(1, options?.maxUniqueBuckets ?? 10),
    )

  const byBucket = new Map<string, {lat: number; lng: number}>()
  const bucketOrder: string[] = []

  for (const run of runs) {
    if (!needsReverseGeocodeForRaw(run.raw)) continue
    const ll = parseStartLatLngFromRaw(run.raw)
    if (!ll) continue
    const key = coordBucketKey(ll.lat, ll.lng)
    if (byBucket.has(key)) continue
    byBucket.set(key, ll)
    bucketOrder.push(key)
    if (bucketOrder.length >= maxUnique) break
  }

  if (bucketOrder.length === 0) {
    return {uniqueBucketsFetched: 0, skippedExisting: 0}
  }

  const supabase = createServerSupabase()
  const {data: existing} = await supabase
    .from(CACHE_TABLE)
    .select('bucket_key')
    .in('bucket_key', bucketOrder)

  const existingSet = new Set(
    (existing as {bucket_key: string}[] | null)?.map((r) => r.bucket_key) ?? [],
  )

  const toFetch = bucketOrder.filter((k) => !existingSet.has(k))
  if (toFetch.length === 0) {
    return {uniqueBucketsFetched: 0, skippedExisting: bucketOrder.length}
  }

  const rowsToUpsert: ReverseGeocodeCacheRow[] = []
  for (let i = 0; i < toFetch.length; i++) {
    const key = toFetch[i]!
    const ll = byBucket.get(key)!
    if (i > 0) await sleep(NOMINATIM_REQUEST_GAP_MS)
    const label = await reverseGeocodePlaceLabel(ll.lat, ll.lng)
    if (!label) continue
    rowsToUpsert.push({
      bucket_key: key,
      label,
      lat: ll.lat,
      lng: ll.lng,
    })
  }

  if (rowsToUpsert.length > 0) {
    await supabase.from(CACHE_TABLE).upsert(rowsToUpsert, {onConflict: 'bucket_key'})
  }

  return {
    uniqueBucketsFetched: rowsToUpsert.length,
    skippedExisting: bucketOrder.length - toFetch.length,
  }
}

