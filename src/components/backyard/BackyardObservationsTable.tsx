import type {BirdObservation} from '@/lib/ebird/types'
import {pageBodyParagraph, pageSectionHeading} from '@/lib/pageTypography'

type Props = {
  observations: BirdObservation[]
  /** e.g. "Pileated Woodpecker" — used in helper copy */
  focusSpeciesLabel?: string
  heading?: string
  headingId?: string
  sectionId?: string
  intro?: React.ReactNode
  emptyMessage?: React.ReactNode
}

export default function BackyardObservationsTable({
  observations,
  focusSpeciesLabel = 'this species',
  heading = 'Sightings table',
  headingId = 'obs-table-heading',
  sectionId = 'pileated-watch-sightings',
  intro = `Recent eBird rows for ${focusSpeciesLabel} in your configured area. Observers are credited on each checklist. Open the checklist link for full details.`,
  emptyMessage = `No recent ${focusSpeciesLabel} sightings with coordinates in this window. Widen the geographic area or increase days back in Studio (max 30), or confirm your eBird species code.`,
}: Props) {
  const colCount = 7

  return (
    <section
      id={sectionId}
      className="scroll-mt-24"
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className={pageSectionHeading}>
        {heading}
      </h2>
      {typeof intro === 'string' ? (
        <p className={`${pageBodyParagraph} mb-6`}>{intro}</p>
      ) : (
        <div className={`${pageBodyParagraph} mb-6`}>{intro}</div>
      )}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full text-left text-sm border-collapse">
          <caption className="sr-only">
            Recent eBird sightings: date, species, location, observer, coordinates,
            checklist link
          </caption>
          <thead className="bg-gray-100 text-gray-800">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Date
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Species
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Location
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Observer
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Latitude
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Longitude
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                eBird
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {observations.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-8 text-center text-gray-600">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              observations.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-800">
                    {o.observedOn
                      ? new Date(o.observedOn).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-900">{o.speciesName}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-[12rem] truncate">
                    {o.locationLabel || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-[10rem] truncate">
                    {o.observerDisplayName || '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-700 tabular-nums">
                    {o.latitude.toFixed(5)}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-700 tabular-nums">
                    {o.longitude.toFixed(5)}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={o.checklistUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-800 underline underline-offset-2 hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 rounded-sm"
                    >
                      Checklist
                      <span className="sr-only"> for {o.speciesName}</span>
                    </a>
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
