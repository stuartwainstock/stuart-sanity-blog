import Link from 'next/link'
import type {Metadata} from 'next'
import {redirect} from 'next/navigation'
import {createServerSupabase} from '@/lib/supabase/server'
import {syncRunsAction} from '@/app/runs/actions'
import {
  allowInsecureStravaConnect,
  hasValidAdminSession,
  isStravaAdminAuthConfigured,
} from '@/lib/admin/session'
import {RUNS_MAP_WINDOW_DAYS} from '@/lib/strava/constants'
import {countRunsInWindow, countRunsWithPolylineInWindow} from '@/lib/strava/runsQuery'
import {pageContent, pageShellBg} from '@/lib/pageTypography'

export const metadata: Metadata = {
  title: 'Strava sync',
  robots: {index: false, follow: false},
}

export const dynamic = 'force-dynamic'

export default async function AdminStravaPage({
  searchParams,
}: {
  searchParams: Promise<{
    strava?: string
    reason?: string
    synced?: string
    sync_error?: string
  }>
}) {
  const params = await searchParams
  const allowed = await hasValidAdminSession()
  if (!allowed) {
    const qs = new URLSearchParams()
    if (params.strava) qs.set('strava', params.strava)
    if (params.reason) qs.set('reason', params.reason)
    if (params.synced) qs.set('synced', params.synced)
    if (params.sync_error) qs.set('sync_error', params.sync_error)
    const tail = qs.toString() ? `?${qs.toString()}` : ''
    redirect(`/admin/login?next=${encodeURIComponent(`/admin/strava${tail}`)}`)
  }

  const supabase = createServerSupabase()
  const [oauthRes, syncRes, countRes] = await Promise.all([
    supabase.from('strava_oauth').select('athlete_id').eq('id', 'singleton').maybeSingle(),
    supabase
      .from('strava_sync_state')
      .select('full_backfill_complete, last_incremental_sync_at')
      .eq('id', 'singleton')
      .maybeSingle(),
    supabase.from('strava_activities').select('*', {count: 'exact', head: true}),
  ])

  const connected = Boolean(oauthRes.data)
  const syncState = syncRes.data
  const runCount = countRes.count ?? 0

  let runsInWindow = 0
  let routesInWindow = 0
  if (connected) {
    ;[runsInWindow, routesInWindow] = await Promise.all([
      countRunsInWindow(),
      countRunsWithPolylineInWindow(),
    ])
  }

  const stravaOAuthDisabledMissingEnv =
    !isStravaAdminAuthConfigured() && !allowInsecureStravaConnect()

  return (
    <div className={pageShellBg}>
      <div className={pageContent}>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Strava — connect &amp; sync</h1>
        <p className="text-gray-600 mb-8 max-w-2xl">
          Password-protected admin page. Import runs into Supabase, then the public{' '}
          <Link href="/runs" className="font-medium text-orange-700 hover:text-orange-800 underline underline-offset-2">
            /runs
          </Link>{' '}
          map and table load from the database (no sync controls there).
        </p>

        {params.strava === 'connected' ? (
          <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 text-base">
            Strava connected. Use <strong className="font-semibold">Sync from Strava</strong> below to import
            runs.
          </p>
        ) : null}
        {params.strava === 'error' ? (
          <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-900 text-base">
            {params.reason === 'admin_session_required' ? (
              <>
                Strava could not finish connecting: sign in with your site admin password first, then use{' '}
                <strong className="font-semibold">Connect Strava</strong> again.{' '}
                <Link
                  href="/admin/login?next=/api/strava/connect"
                  className="font-medium text-orange-800 underline underline-offset-2 hover:text-orange-900"
                >
                  Open admin sign-in
                </Link>
                .
              </>
            ) : params.reason === 'admin_not_configured' ? (
              <>
                Strava OAuth is not configured for this deployment (set{' '}
                <code className="text-sm bg-red-100 px-1 rounded">ADMIN_PASSWORD</code> in the environment).
              </>
            ) : (
              <>Connection issue{params.reason ? `: ${params.reason}` : ''}.</>
            )}
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
          className="rounded-lg border border-gray-200 bg-white/80 p-6 shadow-sm space-y-4 mb-10"
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
            {stravaOAuthDisabledMissingEnv ? (
              <p className="w-full text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                Strava connect is disabled until{' '}
                <code className="text-xs bg-amber-100 px-1 rounded">ADMIN_PASSWORD</code> is set in production
                (and optionally <code className="text-xs bg-amber-100 px-1 rounded">ADMIN_SESSION_SECRET</code>
                ).
              </p>
            ) : null}
            {!connected ? (
              <div className="w-full flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
                <Link
                  href="/api/strava/connect"
                  className="inline-flex items-center rounded-md bg-orange-700 px-4 py-2 text-sm font-medium text-white hover:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  Connect Strava
                </Link>
                <p className="text-sm text-gray-600 sm:ml-1">
                  You must be signed in here first (this page requires admin).
                </p>
              </div>
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
              href="/runs"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View public runs page
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Home
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
