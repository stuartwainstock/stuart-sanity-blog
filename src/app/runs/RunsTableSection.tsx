import PortableText from '@/components/molecules/PortableText'
import StravaRunsTable from '@/components/strava/StravaRunsTable'
import {pageBodyTypography} from '@/lib/pageTypography'
import {fetchRunsInWindow} from '@/lib/strava/runsQuery'
import {gearIdFromRaw} from '@/lib/strava/gear'
import {enrichRunsForTable} from '@/lib/strava/runDisplay'
import {applyCachedReverseGeocodeLabels} from '@/lib/strava/reverseGeocodeCache'
import {getCachedGearNameMap} from '@/lib/strava/gearCache'
import type {StravaRunTableRow} from '@/lib/strava/types'
import type {TypedObject} from '@portabletext/types'

type Props = {
  tableSectionTitle: string
  tableSectionIntroduction?: TypedObject[] | null
}

/**
 * Cache-only path: Supabase rows + cached gear names + cached reverse-geocode labels.
 * No live Strava or Nominatim calls here — those run during sync
 * (see src/lib/strava/activityEnrichment.ts) so `/runs` can use ISR. Own Suspense boundary.
 */
export default async function RunsTableSection({
  tableSectionTitle,
  tableSectionIntroduction,
}: Props) {
  const windowRuns = await fetchRunsInWindow()

  const gearIds = windowRuns.map((r) => gearIdFromRaw(r.raw)).filter((x): x is string => Boolean(x))
  const gearById = await getCachedGearNameMap(gearIds)
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
