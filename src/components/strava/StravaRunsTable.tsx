import type {ReactNode} from 'react'
import Link from 'next/link'
import {pageBodyParagraph, pageSectionHeading} from '@/lib/pageTypography'
import type {StravaRunTableRow} from '@/lib/strava/types'
import {RUNS_MAP_WINDOW_DAYS} from '@/lib/strava/constants'

type Props = {
  runs: StravaRunTableRow[]
  /** Max rows to show (most recent first). */
  limit?: number
  /** H2 heading; default “Recent runs”. */
  sectionTitle?: string
  /** Intro above the table; default copy when omitted. */
  intro?: ReactNode
}

function formatKm(distanceM: number | null): string {
  if (distanceM == null || Number.isNaN(distanceM)) return '—'
  const km = distanceM / 1000
  return km < 10 ? `${km.toFixed(2)} km` : `${km.toFixed(1)} km`
}

function formatEffort(n: number | null): string {
  if (n == null || Number.isNaN(n)) return '—'
  return String(n)
}

function defaultTableIntro(limit: number) {
  return (
    <p className={`${pageBodyParagraph} mb-6`}>
      Most recent {RUNS_MAP_WINDOW_DAYS}-day window (up to {limit} rows). Location, shoe, and relative effort
      come from Strava when available. When Strava only has GPS start points, place names are resolved from
      coordinates (city-level, via OpenStreetMap). Open Strava for full activity details.
    </p>
  )
}

export default function StravaRunsTable({
  runs,
  limit = 25,
  sectionTitle = 'Recent runs',
  intro,
}: Props) {
  const rows = runs.slice(0, limit)

  return (
    <section className="mb-14 scroll-mt-24" aria-labelledby="runs-table-title" id="runs-recent">
      <h2 id="runs-table-title" className={pageSectionHeading}>
        {sectionTitle}
      </h2>
      {intro !== undefined ? intro : defaultTableIntro(limit)}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
        <table className="min-w-full text-left text-sm border-collapse">
          <caption className="sr-only">
            Recent runs: date, location, distance, relative effort, shoe, link to Strava
          </caption>
          <thead className="bg-gray-100 text-gray-800">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Date
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Location
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-medium"
                title="Strava Relative Effort (suffer_score); requires heart rate when Strava computes it"
              >
                Rel. effort
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Distance
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Shoe
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Strava
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-600">
                  No runs in this window yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-800">
                    {new Date(r.start_date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-800 max-w-[min(28rem,50vw)]" title={r.locationLabel ?? ''}>
                    {r.locationLabel ?? '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700 tabular-nums" title="Relative effort">
                    {formatEffort(r.relativeEffort)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700 tabular-nums">
                    {formatKm(r.distance_m)}
                  </td>
                  <td className="px-4 py-3 text-gray-800 max-w-[min(20rem,40vw)] truncate" title={r.shoeLabel ?? ''}>
                    {r.shoeLabel ?? '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link
                      href={`https://www.strava.com/activities/${r.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      View
                      <span className="sr-only"> on Strava (opens in new tab)</span>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
