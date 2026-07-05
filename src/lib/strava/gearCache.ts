import {createServerSupabase} from '@/lib/supabase/server'
import {buildGearNameMap} from '@/lib/strava/gear'

const CACHE_TABLE = 'strava_gear_cache'

/**
 * Render-path helper: read gear (shoe) names from cache only.
 * Never calls Strava; safe for page load performance.
 */
export async function getCachedGearNameMap(gearIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const uniqueIds = [...new Set(gearIds.filter(Boolean))]
  if (uniqueIds.length === 0) return map

  const supabase = createServerSupabase()
  const {data, error} = await supabase.from(CACHE_TABLE).select('gear_id,label').in('gear_id', uniqueIds)
  if (error || !data) return map

  for (const row of data as {gear_id: string; label: string}[]) {
    if (row.gear_id && row.label) map.set(row.gear_id, row.label)
  }
  return map
}

/**
 * Sync-path helper: resolve and cache any gear ids not already cached.
 * Designed to run during Strava sync (low volume: a few new gear ids ever).
 */
export async function populateGearCacheForRuns(accessToken: string, gearIds: string[]): Promise<void> {
  const uniqueIds = [...new Set(gearIds.filter(Boolean))]
  if (uniqueIds.length === 0) return

  const supabase = createServerSupabase()
  const {data: existing} = await supabase.from(CACHE_TABLE).select('gear_id').in('gear_id', uniqueIds)
  const existingSet = new Set((existing as {gear_id: string}[] | null)?.map((r) => r.gear_id) ?? [])

  const missing = uniqueIds.filter((id) => !existingSet.has(id))
  if (missing.length === 0) return

  const gearById = await buildGearNameMap(accessToken, missing)
  const rows = missing
    .filter((id) => gearById.has(id))
    .map((id) => ({gear_id: id, label: gearById.get(id)!}))

  if (rows.length > 0) {
    await supabase.from(CACHE_TABLE).upsert(rows, {onConflict: 'gear_id'})
  }
}
