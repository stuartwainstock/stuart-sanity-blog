'use client'

import dynamic from 'next/dynamic'
import type {AirportCoords, FlightLeg} from '@/lib/travel/types'

const Map = dynamic(() => import('@/components/travel/FlightPathMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[min(70vh,560px)] rounded-lg border border-gray-200 bg-gray-100 animate-pulse flex items-center justify-center text-gray-600 text-sm">
      Loading map…
    </div>
  ),
})

type Props = {
  flights: FlightLeg[]
  airports: AirportCoords
  className?: string
}

/** MapLibre loads client-only in Next.js App Router. */
export default function FlightPathMapDynamic(props: Props) {
  return <Map {...props} />
}
