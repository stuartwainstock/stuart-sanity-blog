/**
 * Run Strava sync from the CLI (same path as POST /api/strava/sync).
 * Usage: npx tsx --env-file=.env.local scripts/run-strava-sync.ts
 */
import {syncStravaRuns} from '../src/lib/strava/sync'

syncStravaRuns()
  .then((result) => {
    console.log('Strava sync complete:', result)
  })
  .catch((err) => {
    console.error('Strava sync failed:', err instanceof Error ? err.message : err)
    process.exit(1)
  })
