'use client'

import {useMemo, useState} from 'react'
import type {ReactNode} from 'react'
import {Pagination} from '@/components/atoms/Pagination'
import type {BirdObservation} from '@/lib/ebird/types'
import {pageBodyGap, pageBodyParagraph, pageSectionHeading} from '@/lib/pageTypography'
import dt from '@/components/ui/DataTable.module.css'

const COL_COUNT = 6

type Props = {
  observations: BirdObservation[]
  /** Max rows per page (most recent first). */
  limit?: number
  /** e.g. "Pileated Woodpecker" — used in helper copy */
  focusSpeciesLabel?: string
  heading?: string
  headingId?: string
  sectionId?: string
  intro?: ReactNode
  emptyMessage?: ReactNode
}

function defaultIntro(focusSpeciesLabel: string, limit: number) {
  return `Recent eBird rows for ${focusSpeciesLabel} in your configured area (${limit} rows per page). Open the checklist link for observer details and full sighting info.`
}

export default function BackyardObservationsTable({
  observations,
  limit = 25,
  focusSpeciesLabel = 'this species',
  heading = 'Sightings table',
  headingId = 'obs-table-heading',
  sectionId = 'pileated-watch-sightings',
  intro,
  emptyMessage = `No recent ${focusSpeciesLabel} sightings with coordinates in this window. Widen the geographic area or increase days back in Studio (max 30), or confirm your eBird species code.`,
}: Props) {
  const pageSize = Math.max(1, limit)
  const totalRows = observations.length
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const [page, setPage] = useState(0)

  const safePage = Math.min(Math.max(0, page), totalPages - 1)

  const rows = useMemo(() => {
    const start = safePage * pageSize
    return observations.slice(start, start + pageSize)
  }, [observations, pageSize, safePage])

  const range = useMemo(() => {
    if (totalRows === 0) return {from: 0, to: 0}
    const from = safePage * pageSize + 1
    const to = Math.min(totalRows, (safePage + 1) * pageSize)
    return {from, to}
  }, [pageSize, safePage, totalRows])

  const canPrev = safePage > 0
  const canNext = safePage < totalPages - 1

  const resolvedIntro =
    intro !== undefined
      ? intro
      : defaultIntro(focusSpeciesLabel, limit)

  const pagination =
    totalRows > 0 && totalPages > 1 ? (
      <Pagination
        ariaLabel="Sightings table pagination"
        prev={{
          kind: 'button',
          label: 'Previous',
          disabled: !canPrev,
          onClick: () => setPage((p) => Math.max(0, p - 1)),
        }}
        next={{
          kind: 'button',
          label: 'Next',
          disabled: !canNext,
          onClick: () => setPage((p) => Math.min(totalPages - 1, p + 1)),
        }}
        meta={
          <>
            <span>
              Page {safePage + 1} of {totalPages}
            </span>
            <span>
              Showing {range.from}–{range.to} of {totalRows}
            </span>
          </>
        }
      />
    ) : null

  return (
    <section id={sectionId} className="u-mb-14 scroll-mt-24" aria-labelledby={headingId}>
      <h2 id={headingId} className={pageSectionHeading}>
        {heading}
      </h2>
      {typeof resolvedIntro === 'string' ? (
        <p className={`${pageBodyParagraph} ${pageBodyGap}`}>{resolvedIntro}</p>
      ) : (
        <div className={`${pageBodyParagraph} ${pageBodyGap}`}>{resolvedIntro}</div>
      )}
      {pagination}
      <div className={dt.wrap}>
        <table className={dt.table}>
          <caption className="sr-only">
            Recent eBird sightings: date, species, location, coordinates, checklist link
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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT} className={dt.tdCenter}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((o) => (
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
                  <td
                    className={`${dt.td} ${dt.tdMuted} ${dt.maxW28}`}
                    title={o.locationLabel || undefined}
                  >
                    {o.locationLabel || '—'}
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
      {pagination}
    </section>
  )
}
