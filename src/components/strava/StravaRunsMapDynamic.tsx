'use client'

import dynamic from 'next/dynamic'
import type {StravaRunRow} from '@/lib/strava/types'
import StravaRunsMapLoading from '@/components/strava/StravaRunsMapLoading'

const Map = dynamic(() => import('@/components/strava/StravaRunsMap'), {
  ssr: false,
  loading: StravaRunsMapLoading,
})

type Props = {
  runs: StravaRunRow[]
}

export default function StravaRunsMapDynamic(props: Props) {
  return <Map {...props} />
}
