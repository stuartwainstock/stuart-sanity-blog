import type {LifeListSpecies} from '@/lib/ebird/types'

type Props = {
  species: LifeListSpecies[]
  source?: 'location' | 'personal'
  historicDaysBack?: number
}

export default function LifeListTable({
  species,
  source = 'location',
  historicDaysBack,
}: Props) {
  return (
    <section aria-labelledby="life-list-heading">
      <h2 id="life-list-heading" className="sr-only">
        Species life list
      </h2>
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full text-left text-sm border-collapse">
          <caption className="px-4 py-3 text-left text-base font-semibold text-gray-900 caption-top">
            Species ({species.length})
            {source === 'personal' && historicDaysBack ? (
              <span className="block text-sm font-normal text-gray-600 mt-1">
                Your checklists only · last {historicDaysBack} days (see note above)
              </span>
            ) : null}
          </caption>
          <thead className="bg-gray-100 text-gray-800">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Common name
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Scientific name
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Species code
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                eBird
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {species.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-600">
                  {source === 'personal'
                    ? 'No species matched your display name in this window. Check the life list place ID, your eBird name (Studio), and try a larger “days of history” value.'
                    : 'No species returned for this location. Confirm your life list region or hotspot ID matches eBird.'}
                </td>
              </tr>
            ) : (
              species.map((s) => {
                const label = s.commonName || s.name
                const speciesUrl = `https://ebird.org/species/${encodeURIComponent(s.speciesCode)}`
                return (
                  <tr key={s.speciesCode} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">{label}</td>
                    <td className="px-4 py-3 text-gray-600 italic">{s.name}</td>
                    <td className="px-4 py-3 font-mono text-gray-700 text-xs">
                      {s.speciesCode}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={speciesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-800 underline underline-offset-2 hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 rounded-sm"
                      >
                        Species page
                        <span className="sr-only"> for {label}</span>
                      </a>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
