import Link from 'next/link'
import type {Metadata} from 'next'
import {createServerSupabase} from '@/lib/supabase/server'
import {syncRunsAction} from '@/app/runs/actions'
import StravaRunsMapDynamic from '@/components/strava/StravaRunsMapDynamic'
import StravaRunsTable from '@/components/strava/StravaRunsTable'
import {
  pageBanner,
  pageBodyTypography,
  pageContent,
  pageInner,
  pageKicker,
  pageSectionHeading,
  pageShellBg,
  pageTitleH1,
} from '@/lib/pageTypography'
import {RUNS_MAP_WINDOW_DAYS} from '@/lib/strava/constants'
import {
  countRunsInWindow,
  countRunsWithPolylineInWindow,
  fetchRunsInWindow,
} from '@/lib/strava/runsQuery'
import {buildGearNameMap, gearIdFromRaw} from '@/lib/strava/gear'
import {enrichRunsForTable, enrichRunsWithActivityDetailsForLocation} from '@/lib/strava/runDisplay'
import {getValidStravaAccessToken} from '@/lib/strava/tokens'
import type {StravaRunMapInput, StravaRunRow, StravaRunTableRow} from '@/lib/strava/types'

export const metadata: Metadata = {
  title: 'Runs',
  description: 'Personal Strava runs synced to this site.',
}

export const dynamic = 'force-dynamic'

export default async function RunsPage({
  searchParams,
}: {
  searchParams: Promise<{strava?: string; reason?: string; synced?: string; sync_error?: string}>
}) {
  const params = await searchParams
  const supabase = createServerSupabase()

  const {data: oauth} = await supabase
    .from('strava_oauth')
    .select('athlete_id')
    .eq('id', 'singleton')
    .maybeSingle()
  const connected = Boolean(oauth)

  const {data: syncState} = await supabase
    .from('strava_sync_state')
    .select('full_backfill_complete, last_incremental_sync_at')
    .eq('id', 'singleton')
    .maybeSingle()

  const {count: totalCount} = await supabase
    .from('strava_activities')
    .select('*', {count: 'exact', head: true})

  const runCount = totalCount ?? 0

  let windowRuns: StravaRunRow[] = []
  let runsInWindow = 0
  let routesInWindow = 0
  let tableRows: StravaRunTableRow[] = []
  let mapRuns: StravaRunMapInput[] = []

  if (connected) {
    const [wr, rw, rwP, accessToken] = await Promise.all([
      fetchRunsInWindow(),
      countRunsInWindow(),
      countRunsWithPolylineInWindow(),
      getValidStravaAccessToken(),
    ])
    windowRuns = wr
    runsInWindow = rw
    routesInWindow = rwP

    if (runCount > 0) {
      windowRuns = await enrichRunsWithActivityDetailsForLocation(windowRuns, accessToken)
      const gearIds = windowRuns.map((r) => gearIdFromRaw(r.raw)).filter((x): x is string => Boolean(x))
      const gearById = await buildGearNameMap(accessToken, gearIds)
      tableRows = enrichRunsForTable(windowRuns, gearById)
      mapRuns = windowRuns.map((r) => ({
        id: r.id,
        map_polyline: r.map_polyline,
        start_date: r.start_date,
      }))
    }
  }

  return (
    <div className={pageShellBg}>
      <a
        href="#runs-map"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-gray-900 text-white px-4 py-2 rounded-md text-sm"
      >
        Skip to map
      </a>
      <a
        href="#runs-recent"
        className="sr-only focus:not-sr-only focus:absolute focus:top-16 focus:left-4 focus:z-50 bg-gray-900 text-white px-4 py-2 rounded-md text-sm"
      >
        Skip to recent runs
      </a>

      <header className={pageBanner} role="banner" aria-labelledby="runs-title">
        <div className={pageInner}>
          <p className={pageKicker}>
            Data from{' '}
            <a
              href="https://www.strava.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Strava
            </a>
          </p>
          <h1 id="runs-title" className={pageTitleH1}>
            Runs
          </h1>
          <div className={pageBodyTypography}>
            <p className="mb-6 text-inherit">
              Personal Strava runs stored in Supabase. Connect once, then sync to pull activity history (runs
              only). The map and table highlight the last {RUNS_MAP_WINDOW_DAYS} days.
            </p>
          </div>
        </div>
      </header>

      <div className={pageContent} aria-labelledby="runs-title">
        {params.strava === 'connected' ? (
          <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 text-base">
            Strava connected. Use <strong className="font-semibold">Sync from Strava</strong> below to import
            runs.
          </p>
        ) : null}
        {params.strava === 'error' ? (
          <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-900 text-base">
            Connection issue{params.reason ? `: ${params.reason}` : ''}.
          </p>
        ) : null}
        {params.synced === '1' ? (
          <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 text-base">
            Sync finished. Counts below should update.
          </p>
        ) : null}
        {params.sync_error ? (
          <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-900 text-base">
            Sync failed: {params.sync_error}
          </p>
        ) : null}

        <section
          className="rounded-lg border border-gray-200 bg-white/80 p-6 shadow-sm space-y-4 mb-14"
          aria-label="Connection and sync status"
        >
          <div className="text-base text-gray-700 space-y-2">
            <p>
              <span className="font-medium text-gray-900">Status:</span>{' '}
              {connected ? 'Connected to Strava' : 'Not connected'}
            </p>
            <p>
              <span className="font-medium text-gray-900">Runs in database (all time):</span> {runCount}
            </p>
            {connected ? (
              <>
                <p>
                  <span className="font-medium text-gray-900">Runs in last {RUNS_MAP_WINDOW_DAYS} days:</span>{' '}
                  {runsInWindow}
                </p>
                <p>
                  <span className="font-medium text-gray-900">Runs with GPS in window:</span> {routesInWindow}
                </p>
              </>
            ) : null}
            {syncState?.last_incremental_sync_at ? (
              <p>
                <span className="font-medium text-gray-900">Last sync:</span>{' '}
                {new Date(syncState.last_incremental_sync_at).toLocaleString()}
              </p>
            ) : null}
            <p>
              <span className="font-medium text-gray-900">Full history imported:</span>{' '}
              {syncState?.full_backfill_complete === true ? 'Yes' : 'Not yet'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {!connected ? (
              <a
                href="/api/strava/connect"
                className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                Connect Strava
              </a>
            ) : (
              <form action={syncRunsAction}>
                <button
                  type="submit"
                  className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                >
                  Sync from Strava
                </button>
              </form>
            )}
            <Link
              href="/"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Home
            </Link>
          </div>
        </section>

        {connected && runCount > 0 ? (
          <>
            <section className="mb-14" aria-labelledby="map-section-title">
              <h2 id="map-section-title" className={pageSectionHeading}>
                Map
              </h2>
              <div id="runs-map">
                <StravaRunsMapDynamic runs={mapRuns} />
              </div>
            </section>

            <StravaRunsTable runs={tableRows} />
          </>
        ) : null}

        <p className="mt-10 text-sm text-gray-500">
          Activity data provided by{' '}
          <a
            href="https://www.strava.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 underline underline-offset-2 hover:text-gray-900"
          >
            Strava
          </a>
          .
        </p>
      </div>
    </div>
  )
}
