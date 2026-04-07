import StravaRunsMapDynamic from '@/components/strava/StravaRunsMapDynamic'
import {pageSectionHeading} from '@/lib/pageTypography'
import {fetchRunsInWindow} from '@/lib/strava/runsQuery'
import type {StravaRunMapInput} from '@/lib/strava/types'
import type {TypedObject} from '@portabletext/types'

type Props = {
  mapSectionTitle: string
  mapSectionIntroduction?: TypedObject[] | null
}

/**
 * Map-only path: Supabase rows only (polyline + dates). No Strava detail calls, no Nominatim.
 * Streams inside its own Suspense boundary so the route line appears while the table enriches.
 */
export default async function RunsMapSection({mapSectionTitle, mapSectionIntroduction}: Props) {
  const windowRuns = await fetchRunsInWindow()
  const mapRuns: StravaRunMapInput[] = windowRuns.map((r) => ({
    id: r.id,
    map_polyline: r.map_polyline,
    start_date: r.start_date,
  }))

  return (
    <section className="mb-14" aria-labelledby="map-section-title">
      <h2 id="map-section-title" className={pageSectionHeading}>
        {mapSectionTitle}
      </h2>
      <StravaRunsMapDynamic
        runs={mapRuns}
        mapIntroduction={mapSectionIntroduction ?? undefined}
      />
    </section>
  )
}
