import {Suspense} from 'react'
import FlightPathMapDynamic from '@/components/travel/FlightPathMapDynamic'
import PortableText from '@/components/molecules/PortableText'
import {fetchTripItFlights} from '@/lib/tripit/flights'
import {pageBodyTypography, pageSectionHeading} from '@/lib/pageTypography'
import styles from './FlightsMapSection.module.css'

type Props = {
  mapSectionTitle: string
  mapSectionIntroduction?: unknown[] | null
}

function FlightsMapSectionInner({mapSectionTitle, mapSectionIntroduction}: Props) {
  return (
    <section className={styles.section} aria-label="Flights map">
      <h2 className={pageSectionHeading}>{mapSectionTitle}</h2>
      {Array.isArray(mapSectionIntroduction) && mapSectionIntroduction.length > 0 ? (
        <div className={pageBodyTypography}>
          <PortableText value={mapSectionIntroduction as never[]} pageBodyTypography />
        </div>
      ) : null}
      <Suspense
        fallback={
          <div className={`${styles.fallback} u-animate-pulse`}>Loading flights…</div>
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
      <div className={styles.empty}>
        No flights returned from TripIt (or TripIt access isn’t configured for this deployment).
      </div>
    )
  }
  return <FlightPathMapDynamic flights={legs} airports={airports} />
}

export default function FlightsMapSection(props: Props) {
  return <FlightsMapSectionInner {...props} />
}
