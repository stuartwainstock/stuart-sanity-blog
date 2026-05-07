import type {BirdObservation} from '@/lib/ebird/types'
import {pageBodyGap, pageBodyParagraph, pageSectionHeading} from '@/lib/pageTypography'
import dt from '@/components/ui/DataTable.module.css'

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
  const colCount = 5

  return (
    <section id={sectionId} className="scroll-mt-24" aria-labelledby={headingId}>
      <h2 id={headingId} className={pageSectionHeading}>
        {heading}
      </h2>
      {typeof intro === 'string' ? (
        <p className={`${pageBodyParagraph} ${pageBodyGap}`}>{intro}</p>
      ) : (
        <div className={`${pageBodyParagraph} ${pageBodyGap}`}>{intro}</div>
      )}
      <div className={dt.wrap}>
        <table className={dt.table}>
          <caption className="sr-only">
            Recent eBird sightings: date, species, location, observer, coordinates,
            checklist link
          </caption>
          <thead className={dt.thead}>
            <tr>
              <th scope="col" className={dt.th}>
                Date
              </th>
              <th scope="col" className={dt.th}>
                Species
              </th>
              <th scope="col" className={dt.th}>
                Location
              </th>
              <th scope="col" className={dt.th}>
                Observer
              </th>
              <th scope="col" className={`${dt.th} ${dt.hideSm}`}>
                Latitude
              </th>
              <th scope="col" className={`${dt.th} ${dt.hideSm}`}>
                Longitude
              </th>
              <th scope="col" className={dt.th}>
                eBird
              </th>
            </tr>
          </thead>
          <tbody className={dt.tbody}>
            {observations.length === 0 ? (
              <tr>
                <td colSpan={colCount} className={dt.tdCenter}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              observations.map((o) => (
                <tr key={o.id} className={dt.rowHover}>
                  <td className={`${dt.td} ${dt.nowrap} ${dt.tdMuted}`}>
                    {o.observedOn
                      ? new Date(o.observedOn).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className={`${dt.td} ${dt.tdStrong}`}>{o.speciesName}</td>
                  <td className={`${dt.td} ${dt.tdMuted} ${dt.maxW12} ${dt.truncate}`}>
                    {o.locationLabel || '—'}
                  </td>
                  <td className={`${dt.td} ${dt.tdMuted} ${dt.maxW10} ${dt.truncate}`}>
                    {o.observerDisplayName || '—'}
                  </td>
                  <td className={`${dt.td} ${dt.hideSm} ${dt.mono} ${dt.tdMuted} ${dt.tabular}`}>
                    {o.latitude.toFixed(5)}
                  </td>
                  <td className={`${dt.td} ${dt.hideSm} ${dt.mono} ${dt.tdMuted} ${dt.tabular}`}>
                    {o.longitude.toFixed(5)}
                  </td>
                  <td className={dt.td}>
                    <a
                      href={o.checklistUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={dt.linkEmerald}
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
