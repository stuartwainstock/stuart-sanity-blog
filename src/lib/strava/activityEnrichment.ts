import {createServerSupabase} from '@/lib/supabase/server'
import {fetchRunsInWindow} from '@/lib/strava/runsQuery'
import {enrichRunsWithActivityDetailsForLocation} from '@/lib/strava/runDisplay'
import {gearIdFromRaw} from '@/lib/strava/gear'
import {populateGearCacheForRuns} from '@/lib/strava/gearCache'

/**
 * Sync-path only. Fetches Strava `GET /activities/:id` detail for the newest window
 * runs still missing a location label, persists the merged `raw` back to Supabase,
 * and populates the gear-name cache for every gear id referenced in the window.
 *
 * This keeps `/runs` free of live Strava calls on render — the render path
 * (`RunsTableSection`) only ever reads `strava_activities` + the caches populated here.
 * Best-effort: never let a Strava hiccup fail the sync job that calls this.
 */
export async function refreshActivityDetailsAndGearCache(accessToken: string): Promise<void> {
  const windowRuns = await fetchRunsInWindow()
  if (windowRuns.length === 0) return

  const supabase = createServerSupabase()

  // 1) Location details for newest runs missing a label (same cap/batch as before,
  //    just run once during sync instead of once per page view).
  const enriched = await enrichRunsWithActivityDetailsForLocation(windowRuns, accessToken)
  const changed = enriched.filter((r, i) => r.raw !== windowRuns[i]?.raw)

  await Promise.all(
    changed.map(async ({id, raw}) => {
      const {error} = await supabase.from('strava_activities').update({raw}).eq('id', id)
      if (error) throw new Error(`Failed to persist activity detail for ${id}: ${error.message}`)
    }),
  )

  // 2) Gear (shoe) name cache for every gear id referenced in the window.
  const gearIds = windowRuns.map((r) => gearIdFromRaw(r.raw)).filter((x): x is string => Boolean(x))
  await populateGearCacheForRuns(accessToken, gearIds)
}
