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
import styles from './page.module.css'

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
        <h1 className={styles.title}>Strava — connect &amp; sync</h1>
        <p className={styles.lead}>
          Password-protected admin page. Import runs into Supabase, then the public{' '}
          <Link href="/runs" className={styles.inlineLink}>
            /runs
          </Link>{' '}
          map and table load from the database (no sync controls there).
        </p>

        {params.strava === 'connected' ? (
          <p className={styles.calloutSuccess}>
            Strava connected. Use <strong>Sync from Strava</strong> below to import runs.
          </p>
        ) : null}
        {params.strava === 'error' ? (
          <p className={styles.calloutError}>
            {params.reason === 'admin_session_required' ? (
              <>
                Strava could not finish connecting: sign in with your site admin password first, then use{' '}
                <strong>Connect Strava</strong> again.{' '}
                <Link href="/admin/login?next=/api/strava/connect" className={styles.inlineLinkStrong}>
                  Open admin sign-in
                </Link>
                .
              </>
            ) : params.reason === 'admin_not_configured' ? (
              <>
                Strava OAuth is not configured for this deployment (set{' '}
                <code className={styles.code}>ADMIN_PASSWORD</code> in the environment).
              </>
            ) : (
              <>Connection issue{params.reason ? `: ${params.reason}` : ''}.</>
            )}
          </p>
        ) : null}
        {params.synced === '1' ? (
          <p className={styles.calloutSuccess}>Sync finished. Counts below should update.</p>
        ) : null}
        {params.sync_error ? (
          <p className={styles.calloutError}>Sync failed: {params.sync_error}</p>
        ) : null}

        <section className={styles.statusCard} aria-label="Connection and sync status">
          <div className={styles.statusInner}>
            <div className={styles.statusText}>
              <p>
                <span className={styles.label}>Status:</span>{' '}
                {connected ? 'Connected to Strava' : 'Not connected'}
              </p>
              <p>
                <span className={styles.label}>Runs in database (all time):</span> {runCount}
              </p>
              {connected ? (
                <>
                  <p>
                    <span className={styles.label}>Runs in last {RUNS_MAP_WINDOW_DAYS} days:</span>{' '}
                    {runsInWindow}
                  </p>
                  <p>
                    <span className={styles.label}>Runs with GPS in window:</span> {routesInWindow}
                  </p>
                </>
              ) : null}
              {syncState?.last_incremental_sync_at ? (
                <p>
                  <span className={styles.label}>Last sync:</span>{' '}
                  {new Date(syncState.last_incremental_sync_at).toLocaleString()}
                </p>
              ) : null}
              <p>
                <span className={styles.label}>Full history imported:</span>{' '}
                {syncState?.full_backfill_complete === true ? 'Yes' : 'Not yet'}
              </p>
            </div>

            <div className={styles.actions}>
              {stravaOAuthDisabledMissingEnv ? (
                <p className={styles.warnBanner}>
                  Strava connect is disabled until <code className={styles.codeAmber}>ADMIN_PASSWORD</code> is set
                  in production (and optionally <code className={styles.codeAmber}>ADMIN_SESSION_SECRET</code>).
                </p>
              ) : null}
              {!connected ? (
                <div className={styles.connectRow}>
                  <Link href="/api/strava/connect" className={styles.btnPrimaryOrange}>
                    Connect Strava
                  </Link>
                  <p className={styles.connectHint}>
                    You must be signed in here first (this page requires admin).
                  </p>
                </div>
              ) : (
                <form action={syncRunsAction}>
                  <button type="submit" className={styles.btnPrimaryDark}>
                    Sync from Strava
                  </button>
                </form>
              )}
              <Link href="/runs" className={styles.btnOutline}>
                View public runs page
              </Link>
              <Link href="/" className={styles.btnOutline}>
                Home
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
