'use client'

import dynamic from 'next/dynamic'
import type {AirportCoords, FlightLeg} from '@/lib/travel/types'
import {MapLoadingShell} from '@/components/maps/MapLoadingShell'
import LazyMount from '@/components/utils/LazyMount'

const Map = dynamic(() => import('@/components/travel/FlightPathMap'), {
  ssr: false,
  loading: () => (
    <MapLoadingShell centered height="tall" label="Loading map…" />
  ),
})

type Props = {
  flights: FlightLeg[]
  airports: AirportCoords
  className?: string
  /** Hex strings cycled per route; omit to use `color.link` (`--color-link`). */
  lineColors?: string[]
}

/** MapLibre loads client-only in Next.js App Router. */
export default function FlightPathMapDynamic(props: Props) {
  return (
    <LazyMount fallback={<MapLoadingShell centered height="tall" label="Loading map…" />}>
      <Map {...props} />
    </LazyMount>
  )
}
