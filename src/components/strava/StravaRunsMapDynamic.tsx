'use client'

import dynamic from 'next/dynamic'
import type {StravaRunMapInput} from '@/lib/strava/types'
import StravaRunsMapLoading from '@/components/strava/StravaRunsMapLoading'
import LazyMount from '@/components/utils/LazyMount'

const Map = dynamic(() => import('@/components/strava/StravaRunsMap'), {
  ssr: false,
  loading: StravaRunsMapLoading,
})

type Props = {
  runs: StravaRunMapInput[]
  mapIntroduction?: unknown[]
}

export default function StravaRunsMapDynamic(props: Props) {
  return (
    <LazyMount fallback={<StravaRunsMapLoading />}>
      <Map {...props} />
    </LazyMount>
  )
}
