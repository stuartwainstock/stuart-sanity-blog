import Link from 'next/link'
import type {Metadata} from 'next'
import {createServerSupabase} from '@/lib/supabase/server'
import {syncRunsAction} from '@/app/runs/actions'

export const metadata: Metadata = {
  title: 'Runs',
  description: 'Personal Strava runs synced to this site.',
}

export const dynamic = 'force-dynamic'

async function getStats() {
  const supabase = createServerSupabase()
  const {data: oauth} = await supabase.from('strava_oauth').select('athlete_id').eq('id', 'singleton').maybeSingle()
  const connected = Boolean(oauth)

  const {count} = await supabase
    .from('strava_activities')
    .select('*', {count: 'exact', head: true})

  const {data: syncState} = await supabase
    .from('strava_sync_state')
    .select('full_backfill_complete, last_incremental_sync_at')
    .eq('id', 'singleton')
    .maybeSingle()

  return {
    connected,
    runCount: count ?? 0,
    fullBackfillComplete: syncState?.full_backfill_complete === true,
    lastSync: syncState?.last_incremental_sync_at ?? null,
  }
}

export default async function RunsPage({
  searchParams,
}: {
  searchParams: Promise<{strava?: string; reason?: string; synced?: string; sync_error?: string}>
}) {
  const params = await searchParams
  const stats = await getStats()

  return (
    <div className="min-h-screen bg-[#e8e8e8]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-semibold text-gray-900 mb-6">Runs</h1>
        <p className="text-gray-600 mb-8">
          Personal Strava runs stored in Supabase. Connect once, then sync to pull activity history (runs
          only).
        </p>

        {params.strava === 'connected' ? (
          <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 text-sm">
            Strava connected. Use <strong>Sync from Strava</strong> below to import runs.
          </p>
        ) : null}
        {params.strava === 'error' ? (
          <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-900 text-sm">
            Connection issue{params.reason ? `: ${params.reason}` : ''}.
          </p>
        ) : null}
        {params.synced === '1' ? (
          <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 text-sm">
            Sync finished. Run count below should update.
          </p>
        ) : null}
        {params.sync_error ? (
          <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-900 text-sm">
            Sync failed: {params.sync_error}
          </p>
        ) : null}

        <section className="rounded-lg border border-gray-200 bg-white/80 p-6 shadow-sm space-y-4">
          <div className="text-sm text-gray-700">
            <p>
              <span className="font-medium text-gray-900">Status:</span>{' '}
              {stats.connected ? 'Connected to Strava' : 'Not connected'}
            </p>
            <p>
              <span className="font-medium text-gray-900">Runs in database:</span> {stats.runCount}
            </p>
            {stats.lastSync ? (
              <p>
                <span className="font-medium text-gray-900">Last sync:</span>{' '}
                {new Date(stats.lastSync).toLocaleString()}
              </p>
            ) : null}
            <p>
              <span className="font-medium text-gray-900">Full history imported:</span>{' '}
              {stats.fullBackfillComplete ? 'Yes' : 'Not yet'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {!stats.connected ? (
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

        <p className="mt-10 text-xs text-gray-500">
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
