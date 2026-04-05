'use client'

import dynamic from 'next/dynamic'
import type {BirdObservation} from '@/lib/ebird/types'
import BackyardBirdMapLoading from '@/components/backyard/BackyardBirdMapLoading'

const Map = dynamic(() => import('@/components/backyard/BackyardBirdMap'), {
  ssr: false,
  loading: BackyardBirdMapLoading,
})

type Props = {
  observations: BirdObservation[]
  defaultLatitude: number
  defaultLongitude: number
  defaultZoom: number
  focusSpeciesLabel: string
}

export default function BackyardBirdMapDynamic(props: Props) {
  return <Map {...props} />
}
