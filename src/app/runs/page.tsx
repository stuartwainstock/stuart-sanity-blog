import Link from 'next/link'
import type {Metadata} from 'next'
import {Suspense} from 'react'
import PortableText from '@/components/PortableText'
import {createServerSupabase} from '@/lib/supabase/server'
import {syncRunsAction} from '@/app/runs/actions'
import PageHeroWithDataSource from '@/components/PageHeroWithDataSource'
import {RunsMapSectionSkeleton, RunsTableSectionSkeleton} from '@/components/strava/RunsMapTableSkeleton'
import {fetchToolProjectPageRuns, getImageUrl} from '@/lib/sanity'
import {
  pageBodyTypography,
  pageContent,
  pageDataSourceLink,
  pageShellBg,
} from '@/lib/pageTypography'
import {RUNS_MAP_WINDOW_DAYS} from '@/lib/strava/constants'
import {allowInsecureStravaConnect, isStravaAdminAuthConfigured} from '@/lib/admin/session'
import {countRunsInWindow, countRunsWithPolylineInWindow} from '@/lib/strava/runsQuery'
import RunsMapSection from './RunsMapSection'
import RunsTableSection from './RunsTableSection'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const pageCopy = await fetchToolProjectPageRuns()
  const seo = pageCopy?.seo
  const title = seo?.metaTitle || pageCopy?.pageTitle?.trim() || 'Runs'
  const description = seo?.metaDescription || 'Personal Strava runs synced to this site.'
  return {
    title,
    description,
    keywords: seo?.keywords,
    openGraph: {
      title,
      description,
      images: seo?.openGraphImage?.asset ? [getImageUrl(seo.openGraphImage, 1200, 630)] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: seo?.openGraphImage?.asset ? [getImageUrl(seo.openGraphImage, 1200, 630)] : [],
    },
    robots: seo?.noIndex ? 'noindex, nofollow' : 'index, follow',
  }
}

export default async function RunsPage({
  searchParams,
}: {
  searchParams: Promise<{strava?: string; reason?: string; synced?: string; sync_error?: string}>
}) {
  const supabase = createServerSupabase()

  const [params, pageCopy, oauthRes, syncRes, countRes] = await Promise.all([
    searchParams,
    fetchToolProjectPageRuns(),
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

  const pageTitle = pageCopy?.pageTitle?.trim() || 'Runs'
  const mapSectionTitle = pageCopy?.mapSectionTitle?.trim() || 'Map'
  const tableSectionTitle = pageCopy?.tableSectionTitle?.trim() || 'Recent runs'

  const stravaOAuthRequiresAdminLogin = isStravaAdminAuthConfigured() && !allowInsecureStravaConnect()
  const stravaOAuthDisabledMissingEnv =
    !isStravaAdminAuthConfigured() && !allowInsecureStravaConnect()

  const heroIntroduction =
    pageCopy?.heroIntroduction && pageCopy.heroIntroduction.length > 0 ? (
      <div className={pageBodyTypography}>
        <PortableText value={pageCopy.heroIntroduction} pageBodyTypography />
      </div>
    ) : (
      <div className={pageBodyTypography}>
        <p className="mb-6 text-inherit">
          Personal Strava runs stored in Supabase. Connect once, then sync to pull activity history (runs
          only). The map and table highlight the last {RUNS_MAP_WINDOW_DAYS} days.
        </p>
      </div>
    )

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

      <PageHeroWithDataSource
        titleId="runs-title"
        title={pageTitle}
        dataSource={
          <>
            <p>
              Activity data provided by{' '}
              <a
                href="https://www.strava.com"
                target="_blank"
                rel="noopener noreferrer"
                className={pageDataSourceLink}
              >
                Strava
              </a>
              .
            </p>
            <p>
              Place names inferred from coordinates use{' '}
              <a
                href="https://nominatim.openstreetmap.org/"
                target="_blank"
                rel="noopener noreferrer"
                className={pageDataSourceLink}
              >
                OpenStreetMap Nominatim
              </a>{' '}
              (© OpenStreetMap contributors,{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className={pageDataSourceLink}
              >
                ODbL
              </a>
              ).
            </p>
          </>
        }
      >
        {heroIntroduction}
      </PageHeroWithDataSource>

      <div className={pageContent} aria-labelledby="runs-title">
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
                  className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  Connect Strava
                </Link>
                {stravaOAuthRequiresAdminLogin ? (
                  <p className="text-sm text-gray-600 sm:ml-1">
                    You may be redirected to{' '}
                    <Link
                      href="/admin/login?next=/api/strava/connect"
                      className="font-medium text-orange-700 hover:text-orange-800 underline underline-offset-2"
                    >
                      admin sign-in
                    </Link>{' '}
                    first.
                  </p>
                ) : null}
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
              href="/"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Home
            </Link>
          </div>
        </section>

        {connected && runCount > 0 ? (
          <>
            <Suspense fallback={<RunsMapSectionSkeleton />}>
              <RunsMapSection
                mapSectionTitle={mapSectionTitle}
                mapSectionIntroduction={pageCopy?.mapSectionIntroduction}
              />
            </Suspense>
            <Suspense fallback={<RunsTableSectionSkeleton />}>
              <RunsTableSection
                tableSectionTitle={tableSectionTitle}
                tableSectionIntroduction={pageCopy?.tableSectionIntroduction}
              />
            </Suspense>
          </>
        ) : null}
      </div>
    </div>
  )
}
