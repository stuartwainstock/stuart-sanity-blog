'use client'

import type {Config} from 'sanity'
import { NextStudio } from 'next-sanity/studio'
import config from '../../../../sanity/sanity.config'

export const dynamic = 'force-static'

export default function StudioPage() {
  // Root vs sanity/ nested @sanity/types versions differ; runtime config is valid.
  return <NextStudio config={config as unknown as Config} />
}
