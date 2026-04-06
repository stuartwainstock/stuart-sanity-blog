import PortableText from '@/components/PortableText'
import StravaRunsMapDynamic from '@/components/strava/StravaRunsMapDynamic'
import StravaRunsTable from '@/components/strava/StravaRunsTable'
import {pageBodyTypography, pageSectionHeading} from '@/lib/pageTypography'
import {fetchRunsInWindow} from '@/lib/strava/runsQuery'
import {buildGearNameMap, gearIdFromRaw} from '@/lib/strava/gear'
import {
  enrichRunsForTable,
  enrichRunsWithActivityDetailsForLocation,
  enrichTableRowsWithReverseGeocodePlaceLabels,
} from '@/lib/strava/runDisplay'
import {getValidStravaAccessToken} from '@/lib/strava/tokens'
import type {StravaRunMapInput, StravaRunTableRow} from '@/lib/strava/types'

type Props = {
  mapSectionTitle: string
  tableSectionTitle: string
  mapSectionIntroduction?: unknown[] | null
  tableSectionIntroduction?: unknown[] | null
}

/**
 * Heavy path: full run rows, Strava detail merge, gear names, Nominatim geocoding.
 * Loaded inside Suspense so the hero + sync panel can stream first.
 */
export default async function RunsMapAndTable({
  mapSectionTitle,
  tableSectionTitle,
  mapSectionIntroduction,
  tableSectionIntroduction,
}: Props) {
  const accessToken = await getValidStravaAccessToken()
  let windowRuns = await fetchRunsInWindow()

  windowRuns = await enrichRunsWithActivityDetailsForLocation(windowRuns, accessToken)
  const gearIds = windowRuns.map((r) => gearIdFromRaw(r.raw)).filter((x): x is string => Boolean(x))
  const gearById = await buildGearNameMap(accessToken, gearIds)
  const runsById = new Map(windowRuns.map((r) => [r.id, r]))
  let tableRows: StravaRunTableRow[] = enrichRunsForTable(windowRuns, gearById)
  tableRows = await enrichTableRowsWithReverseGeocodePlaceLabels(tableRows, runsById)
  const mapRuns: StravaRunMapInput[] = windowRuns.map((r) => ({
    id: r.id,
    map_polyline: r.map_polyline,
    start_date: r.start_date,
  }))

  const tableIntro =
    tableSectionIntroduction && tableSectionIntroduction.length > 0 ? (
      <div className={`${pageBodyTypography} mb-6`}>
        <PortableText value={tableSectionIntroduction} pageBodyTypography />
      </div>
    ) : undefined

  return (
    <>
      <section className="mb-14" aria-labelledby="map-section-title">
        <h2 id="map-section-title" className={pageSectionHeading}>
          {mapSectionTitle}
        </h2>
        <StravaRunsMapDynamic
          runs={mapRuns}
          mapIntroduction={mapSectionIntroduction ?? undefined}
        />
      </section>

      <StravaRunsTable runs={tableRows} sectionTitle={tableSectionTitle} intro={tableIntro} />
    </>
  )
}
