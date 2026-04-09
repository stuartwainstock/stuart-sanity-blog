import {Suspense} from 'react'
import FlightPathMapDynamic from '@/components/travel/FlightPathMapDynamic'
import PortableText from '@/components/molecules/PortableText'
import {fetchTripItFlights} from '@/lib/tripit/flights'
import {pageBodyTypography, pageSectionHeading} from '@/lib/pageTypography'

type Props = {
  mapSectionTitle: string
  mapSectionIntroduction?: unknown[] | null
}

function FlightsMapSectionInner({mapSectionTitle, mapSectionIntroduction}: Props) {
  return (
    <section className="space-y-6" aria-label="Flights map">
      <h2 className={pageSectionHeading}>{mapSectionTitle}</h2>
      {Array.isArray(mapSectionIntroduction) && mapSectionIntroduction.length > 0 ? (
        <div className={pageBodyTypography}>
          <PortableText value={mapSectionIntroduction as never[]} pageBodyTypography />
        </div>
      ) : null}
      <Suspense
        fallback={
          <div className="w-full h-[min(70vh,560px)] rounded-lg border border-gray-200 bg-gray-100 animate-pulse flex items-center justify-center text-gray-600 text-sm">
            Loading flights…
          </div>
        }
      >
        <FlightsMap />
      </Suspense>
    </section>
  )
}

async function FlightsMap() {
  const {legs, airports} = await fetchTripItFlights()
  if (legs.length === 0) {
    return (
      <div className="w-full min-h-[320px] rounded-lg border border-gray-200 bg-white/80 p-6 text-gray-700">
        No flights returned from TripIt (or TripIt access isn’t configured for this deployment).
      </div>
    )
  }
  return <FlightPathMapDynamic flights={legs} airports={airports} />
}

export default function FlightsMapSection(props: Props) {
  return <FlightsMapSectionInner {...props} />
}

