import {createServerSupabase} from '@/lib/supabase/server'
import {RUNS_MAP_WINDOW_DAYS} from '@/lib/strava/constants'
import type {StravaRunRow} from '@/lib/strava/types'

export {RUNS_MAP_WINDOW_DAYS} from '@/lib/strava/constants'
export type {StravaRunRow} from '@/lib/strava/types'

export function getRunsWindowStartIso(): string {
  const since = new Date()
  since.setTime(since.getTime() - RUNS_MAP_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  return since.toISOString()
}

/** Runs in the window with fields needed for map + table. */
export async function fetchRunsInWindow(): Promise<StravaRunRow[]> {
  const supabase = createServerSupabase()
  const sinceIso = getRunsWindowStartIso()

  const {data, error} = await supabase
    .from('strava_activities')
    .select('id, name, start_date, distance_m, map_polyline')
    .gte('start_date', sinceIso)
    .order('start_date', {ascending: false})

  if (error) throw new Error(`Failed to load runs: ${error.message}`)
  return (data ?? []) as StravaRunRow[]
}

export async function countRunsInWindow(): Promise<number> {
  const supabase = createServerSupabase()
  const sinceIso = getRunsWindowStartIso()

  const {count, error} = await supabase
    .from('strava_activities')
    .select('*', {count: 'exact', head: true})
    .gte('start_date', sinceIso)

  if (error) throw new Error(`Failed to count runs: ${error.message}`)
  return count ?? 0
}

export async function countRunsWithPolylineInWindow(): Promise<number> {
  const supabase = createServerSupabase()
  const sinceIso = getRunsWindowStartIso()

  const {count, error} = await supabase
    .from('strava_activities')
    .select('*', {count: 'exact', head: true})
    .gte('start_date', sinceIso)
    .not('map_polyline', 'is', null)

  if (error) throw new Error(`Failed to count runs with routes: ${error.message}`)
  return count ?? 0
}
