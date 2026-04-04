import type {LifeListSpecies} from '@/lib/inaturalist/types'

type Props = {
  species: LifeListSpecies[]
}

export default function LifeListTable({species}: Props) {
  return (
    <section aria-labelledby="life-list-heading">
      <h2 id="life-list-heading" className="sr-only">
        Species life list
      </h2>
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full text-left text-sm border-collapse">
          <caption className="px-4 py-3 text-left text-base font-semibold text-gray-900 caption-top">
            Species ({species.length})
          </caption>
          <thead className="bg-gray-100 text-gray-800">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium w-16">
                Photo
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Name
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Scientific name
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Observations
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                More
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {species.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-600">
                  No species yet for this filter. Add observations on iNaturalist to
                  grow your life list.
                </td>
              </tr>
            ) : (
              species.map((s) => {
                const taxonUrl = `https://www.inaturalist.org/taxa/${s.taxonId}`
                const label = s.commonName || s.name
                return (
                  <tr key={s.taxonId} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      {s.defaultPhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- iNat photo URLs vary by host; native img avoids brittle remotePatterns.
                        <img
                          src={s.defaultPhotoUrl}
                          alt=""
                          width={48}
                          height={48}
                          className="rounded object-cover w-12 h-12 bg-gray-100"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="inline-flex w-12 h-12 items-center justify-center rounded bg-gray-100 text-gray-400 text-xs">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{label}</td>
                    <td className="px-4 py-3 text-gray-600 italic">{s.name}</td>
                    <td className="px-4 py-3 tabular-nums text-gray-800">
                      {s.observationCount}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={taxonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-800 underline underline-offset-2 hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 rounded-sm"
                      >
                        iNaturalist
                        <span className="sr-only"> taxon page for {label}</span>
                      </a>
                      {s.wikiUrl ? (
                        <>
                          {' · '}
                          <a
                            href={s.wikiUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-800 underline underline-offset-2 hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 rounded-sm"
                          >
                            Wikipedia
                            <span className="sr-only"> article for {label}</span>
                          </a>
                        </>
                      ) : null}
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
