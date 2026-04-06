'use server'

import {redirect} from 'next/navigation'
import {syncStravaRuns} from '@/lib/strava/sync'

export async function syncRunsAction() {
  try {
    await syncStravaRuns()
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Sync failed'
    redirect(`/runs?sync_error=${encodeURIComponent(message.slice(0, 240))}`)
  }
  redirect('/runs?synced=1')
}
