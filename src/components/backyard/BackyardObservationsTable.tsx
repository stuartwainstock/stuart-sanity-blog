import type {BackyardObservation} from '@/lib/inaturalist/types'

type Props = {
  observations: BackyardObservation[]
}

export default function BackyardObservationsTable({observations}: Props) {
  return (
    <section
      id="backyard-observations-table"
      className="scroll-mt-24"
      aria-labelledby="obs-table-heading"
    >
      <h2 id="obs-table-heading" className="text-xl font-semibold text-gray-900 mb-4">
        Observation list
      </h2>
      <p className="text-sm text-gray-600 mb-4 max-w-3xl">
        Each row matches a point on the map. Open the observation on iNaturalist for
        full details, photos, and research-grade status.
      </p>
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full text-left text-sm border-collapse">
          <caption className="sr-only">
            Bird observations with date, species, coordinates, and link to iNaturalist
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
                Latitude
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Longitude
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                iNaturalist
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {observations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-600">
                  No georeferenced observations match your filters yet. Log a bird in
                  iNaturalist with coordinates and check back after the page refreshes.
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
                  <td className="px-4 py-3 font-mono text-gray-700 tabular-nums">
                    {o.latitude.toFixed(5)}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-700 tabular-nums">
                    {o.longitude.toFixed(5)}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={o.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-800 underline underline-offset-2 hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 rounded-sm"
                    >
                      View<span className="sr-only"> {o.speciesName} observation</span>
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
