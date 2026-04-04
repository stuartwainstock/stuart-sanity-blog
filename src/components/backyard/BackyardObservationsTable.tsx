import type {BirdObservation} from '@/lib/ebird/types'

type Props = {
  observations: BirdObservation[]
}

export default function BackyardObservationsTable({observations}: Props) {
  const colCount = 7

  return (
    <section
      id="backyard-observations-table"
      className="scroll-mt-24"
      aria-labelledby="obs-table-heading"
    >
      <h2 id="obs-table-heading" className="text-xl font-semibold text-gray-900 mb-4">
        Recent checklist rows
      </h2>
      <p className="text-sm text-gray-600 mb-4 max-w-3xl">
        Each row is a species entry from a recent eBird checklist in your configured
        window. Open the checklist for full protocol, counts, and media.
      </p>
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full text-left text-sm border-collapse">
          <caption className="sr-only">
            Recent eBird rows with date, species, coordinates, and checklist link
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
                  No recent rows with coordinates in this window. Submit checklists
                  from eBird Mobile or the website, or widen days back in Studio (max
                  30). If you use an observer name filter, confirm it matches your eBird
                  display name exactly (Studio → Birding → only this observer).
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
