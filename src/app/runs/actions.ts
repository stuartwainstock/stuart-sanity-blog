'use server'

import {redirect} from 'next/navigation'
import {hasValidAdminSession} from '@/lib/admin/session'
import {syncStravaRuns} from '@/lib/strava/sync'

export async function syncRunsAction() {
  if (!(await hasValidAdminSession())) {
    redirect('/admin/login?next=/admin/strava')
  }
  try {
    await syncStravaRuns()
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Sync failed'
    redirect(`/admin/strava?sync_error=${encodeURIComponent(message.slice(0, 240))}`)
  }
  redirect('/admin/strava?synced=1')
}
