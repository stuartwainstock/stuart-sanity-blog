import {revalidatePath} from 'next/cache'
import {createServerSupabase} from '@/lib/supabase/server'
import {listActivityPage} from '@/lib/strava/activities'
import {getValidStravaAccessToken} from '@/lib/strava/tokens'
import type {StravaActivitySummary} from '@/lib/strava/types'
import {refreshActivityDetailsAndGearCache} from '@/lib/strava/activityEnrichment'
import {populateReverseGeocodeCacheForRuns} from '@/lib/strava/reverseGeocodeCache'
import {fetchRunsInWindow} from '@/lib/strava/runsQuery'

function toRow(a: StravaActivitySummary) {
  return {
    id: a.id,
    start_date: a.start_date,
    name: a.name,
    distance_m: a.distance,
    moving_time_s: a.moving_time,
    elapsed_time_s: a.elapsed_time,
    sport_type: a.sport_type,
    map_polyline: a.map?.summary_polyline ?? null,
    raw: a as unknown as Record<string, unknown>,
    synced_at: new Date().toISOString(),
  }
}

/** Full history: paginate from newest to oldest until empty. */
async function syncFullHistory(accessToken: string) {
  const supabase = createServerSupabase()
  let page = 1
  let total = 0

  for (;;) {
    const batch = await listActivityPage(accessToken, page)
    if (batch.length === 0) break

    const runs = batch.filter((a) => a.sport_type === 'Run')
    if (runs.length > 0) {
      const rows = runs.map(toRow)
      const {error} = await supabase.from('strava_activities').upsert(rows, {onConflict: 'id'})
      if (error) throw new Error(`Upsert activities failed: ${error.message}`)
      total += runs.length
    }

    if (batch.length < 200) break
    page += 1
  }

  const {data: newest} = await supabase
    .from('strava_activities')
    .select('start_date')
    .order('start_date', {ascending: false})
    .limit(1)
    .maybeSingle()

  await supabase.from('strava_sync_state').upsert(
    {
      id: 'singleton',
      full_backfill_complete: true,
      last_full_backfill_at: new Date().toISOString(),
      last_incremental_sync_at: new Date().toISOString(),
      newest_activity_start_date: newest?.start_date ?? null,
      updated_at: new Date().toISOString(),
    },
    {onConflict: 'id'},
  )

  return {mode: 'full' as const, activitiesSynced: total}
}

/** Incremental: activities after (newest_stored - 7d buffer), paginate. */
async function syncIncremental(accessToken: string, afterEpoch: number) {
  const supabase = createServerSupabase()
  let page = 1
  let total = 0

  for (;;) {
    const batch = await listActivityPage(accessToken, page, {after: afterEpoch})
    if (batch.length === 0) break

    const runs = batch.filter((a) => a.sport_type === 'Run')
    if (runs.length > 0) {
      const rows = runs.map(toRow)
      const {error} = await supabase.from('strava_activities').upsert(rows, {onConflict: 'id'})
      if (error) throw new Error(`Upsert activities failed: ${error.message}`)
      total += runs.length
    }

    if (batch.length < 200) break
    page += 1
  }

  const {data: newest} = await supabase
    .from('strava_activities')
    .select('start_date')
    .order('start_date', {ascending: false})
    .limit(1)
    .maybeSingle()

  await supabase.from('strava_sync_state').upsert(
    {
      id: 'singleton',
      last_incremental_sync_at: new Date().toISOString(),
      newest_activity_start_date: newest?.start_date ?? null,
      updated_at: new Date().toISOString(),
    },
    {onConflict: 'id'},
  )

  return {mode: 'incremental' as const, activitiesSynced: total}
}

async function syncActivities(accessToken: string) {
  const supabase = createServerSupabase()

  const {data: state} = await supabase.from('strava_sync_state').select('*').eq('id', 'singleton').maybeSingle()

  const fullDone = state?.full_backfill_complete === true

  if (!fullDone) {
    return syncFullHistory(accessToken)
  }

  const {data: newest} = await supabase
    .from('strava_activities')
    .select('start_date')
    .order('start_date', {ascending: false})
    .limit(1)
    .maybeSingle()

  if (!newest?.start_date) {
    return syncFullHistory(accessToken)
  }

  const newestMs = new Date(newest.start_date).getTime()
  const bufferMs = 7 * 24 * 60 * 60 * 1000
  const afterEpoch = Math.floor((newestMs - bufferMs) / 1000)

  return syncIncremental(accessToken, afterEpoch)
}

export async function syncStravaRuns() {
  const accessToken = await getValidStravaAccessToken()
  const result = await syncActivities(accessToken)

  // Best-effort: keep location details + gear-name cache off the render path.
  // Never fail the sync because Strava's detail/gear endpoints hiccup or rate-limit.
  try {
    await refreshActivityDetailsAndGearCache(accessToken)
  } catch (err) {
    console.warn(
      'Strava sync: activity detail / gear cache refresh failed:',
      err instanceof Error ? err.message : err,
    )
  }

  // Reverse-geocode after detail enrichment so `raw` includes `start_latlng` from
  // GET /activities/:id when the list payload omitted it.
  try {
    const windowRuns = await fetchRunsInWindow()
    await populateReverseGeocodeCacheForRuns(windowRuns, {maxUniqueBuckets: 10})
  } catch (err) {
    console.warn(
      'Strava sync: reverse-geocode cache populate failed:',
      err instanceof Error ? err.message : err,
    )
  }

  // /runs uses ISR (see src/app/runs/page.tsx) — bust it so a manual or cron sync
  // shows up immediately instead of waiting for the next revalidate window.
  try {
    revalidatePath('/runs')
  } catch (err) {
    console.warn(
      'Strava sync: revalidatePath(/runs) failed:',
      err instanceof Error ? err.message : err,
    )
  }

  return result
}
