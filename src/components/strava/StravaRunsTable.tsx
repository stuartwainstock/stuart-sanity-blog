 'use client'

import {useMemo, useState} from 'react'
import type {ReactNode} from 'react'
import Link from 'next/link'
import {Pagination} from '@/components/atoms/Pagination'
import {pageBodyGap, pageBodyParagraph, pageSectionHeading} from '@/lib/pageTypography'
import type {StravaRunTableRow} from '@/lib/strava/types'
import {RUNS_MAP_WINDOW_DAYS} from '@/lib/strava/constants'
import dt from '@/components/ui/DataTable.module.css'

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
    <p className={`${pageBodyParagraph} ${pageBodyGap}`}>
      Most recent {RUNS_MAP_WINDOW_DAYS}-day window ({limit} rows per page). Location, shoe, and relative effort
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
  const pageSize = Math.max(1, limit)
  const totalRows = runs.length
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const [page, setPage] = useState(0)

  const safePage = Math.min(Math.max(0, page), totalPages - 1)

  const rows = useMemo(() => {
    const start = safePage * pageSize
    return runs.slice(start, start + pageSize)
  }, [pageSize, runs, safePage])

  const range = useMemo(() => {
    if (totalRows === 0) return {from: 0, to: 0}
    const from = safePage * pageSize + 1
    const to = Math.min(totalRows, (safePage + 1) * pageSize)
    return {from, to}
  }, [pageSize, safePage, totalRows])

  const canPrev = safePage > 0
  const canNext = safePage < totalPages - 1

  return (
    <section className="u-mb-14 scroll-mt-24" aria-labelledby="runs-table-title" id="runs-recent">
      <h2 id="runs-table-title" className={pageSectionHeading}>
        {sectionTitle}
      </h2>
      {intro !== undefined ? intro : defaultTableIntro(limit)}
      {totalRows > 0 && totalPages > 1 ? (
        <Pagination
          ariaLabel="Runs table pagination"
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
              <span>Page {safePage + 1} of {totalPages}</span>
              <span>Showing {range.from}–{range.to} of {totalRows}</span>
            </>
          }
        />
      ) : null}
      <div className={`${dt.wrap} ${dt.wrapOnWhite}`}>
        <table className={dt.table}>
          <caption className="sr-only">
            Recent runs: date, location, distance, relative effort, shoe, link to Strava
          </caption>
          <thead className={dt.thead}>
            <tr>
              <th scope="col" className={dt.th}>
                Date
              </th>
              <th scope="col" className={dt.th}>
                Location
              </th>
              <th
                scope="col"
                className={dt.th}
                title="Strava Relative Effort (suffer_score); requires heart rate when Strava computes it"
              >
                Rel. effort
              </th>
              <th scope="col" className={dt.th}>
                Distance
              </th>
              <th scope="col" className={dt.th}>
                Shoe
              </th>
              <th scope="col" className={dt.th}>
                Strava
              </th>
            </tr>
          </thead>
          <tbody className={dt.tbody}>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className={dt.tdCenter}>
                  No runs in this window yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className={dt.rowHover}>
                  <td className={`${dt.td} ${dt.nowrap} ${dt.tdMuted}`}>
                    {new Date(r.start_date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className={`${dt.td} ${dt.tdMuted} ${dt.maxW28}`} title={r.locationLabel ?? ''}>
                    {r.locationLabel ?? '—'}
                  </td>
                  <td className={`${dt.td} ${dt.nowrap} ${dt.tdMuted} ${dt.tabular}`} title="Relative effort">
                    {formatEffort(r.relativeEffort)}
                  </td>
                  <td className={`${dt.td} ${dt.nowrap} ${dt.tdMuted} ${dt.tabular}`}>
                    {formatKm(r.distance_m)}
                  </td>
                  <td className={`${dt.td} ${dt.tdMuted} ${dt.maxW20} ${dt.truncate}`} title={r.shoeLabel ?? ''}>
                    {r.shoeLabel ?? '—'}
                  </td>
                  <td className={`${dt.td} ${dt.nowrap}`}>
                    <Link
                      href={`https://www.strava.com/activities/${r.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={dt.linkBlue}
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
      {totalRows > 0 && totalPages > 1 ? (
        <Pagination
          ariaLabel="Runs table pagination"
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
              <span>Page {safePage + 1} of {totalPages}</span>
              <span>Showing {range.from}–{range.to} of {totalRows}</span>
            </>
          }
        />
      ) : null}
    </section>
  )
}
