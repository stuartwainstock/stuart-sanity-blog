import PortableText from '@/components/molecules/PortableText'
import StravaRunsTable from '@/components/strava/StravaRunsTable'
import {pageBodyTypography} from '@/lib/pageTypography'
import {fetchRunsInWindow} from '@/lib/strava/runsQuery'
import {buildGearNameMap, gearIdFromRaw} from '@/lib/strava/gear'
import {
  enrichRunsForTable,
  enrichRunsWithActivityDetailsForLocation,
} from '@/lib/strava/runDisplay'
import {applyCachedReverseGeocodeLabels} from '@/lib/strava/reverseGeocodeCache'
import {getValidStravaAccessToken} from '@/lib/strava/tokens'
import type {StravaRunTableRow} from '@/lib/strava/types'
import type {TypedObject} from '@portabletext/types'

type Props = {
  tableSectionTitle: string
  tableSectionIntroduction?: TypedObject[] | null
}

/**
 * Heavy path: Strava activity details, gear names, Nominatim (sequential). Own Suspense boundary.
 */
export default async function RunsTableSection({
  tableSectionTitle,
  tableSectionIntroduction,
}: Props) {
  const accessToken = await getValidStravaAccessToken()
  let windowRuns = await fetchRunsInWindow()

  windowRuns = await enrichRunsWithActivityDetailsForLocation(windowRuns, accessToken)
  const gearIds = windowRuns.map((r) => gearIdFromRaw(r.raw)).filter((x): x is string => Boolean(x))
  const gearById = await buildGearNameMap(accessToken, gearIds)
  const runsById = new Map(windowRuns.map((r) => [r.id, r]))
  let tableRows: StravaRunTableRow[] = enrichRunsForTable(windowRuns, gearById)
  tableRows = await applyCachedReverseGeocodeLabels(tableRows, runsById)

  const tableIntro =
    tableSectionIntroduction && tableSectionIntroduction.length > 0 ? (
      <div className={`${pageBodyTypography} mb-6`}>
        <PortableText value={tableSectionIntroduction} pageBodyTypography />
      </div>
    ) : undefined

  return <StravaRunsTable runs={tableRows} sectionTitle={tableSectionTitle} intro={tableIntro} />
}
