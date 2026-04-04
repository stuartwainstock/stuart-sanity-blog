import Link from 'next/link'
import type {Metadata} from 'next'
import {sanityClient} from '@/lib/sanity'
import {getImageUrl} from '@/lib/sanity'
import {INATURALIST_BACKYARD_QUERY} from '@/lib/queries'
import type {InaturalistBackyard} from '@/lib/types'
import PortableText from '@/components/PortableText'
import LifeListTable from '@/components/backyard/LifeListTable'
import {fetchLifeListSpecies} from '@/lib/inaturalist/client'
import {resolveInaturalistBackyard} from '@/lib/inaturalist/resolveConfig'

export const revalidate = 300

async function getConfig(): Promise<InaturalistBackyard | null> {
  try {
    return await sanityClient.fetch<InaturalistBackyard | null>(
      INATURALIST_BACKYARD_QUERY
    )
  } catch (e) {
    console.error('Backyard birds config fetch failed:', e)
    return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const raw = await getConfig()
  const config = resolveInaturalistBackyard(raw)
  if (!config) {
    return {title: 'Life list'}
  }
  const seo = config.seoLifeList
  const title = seo?.metaTitle || config.lifeListPageTitle
  const description = seo?.metaDescription
  return {
    title,
    description,
    keywords: seo?.keywords,
    openGraph: {
      title,
      description,
      images: seo?.openGraphImage?.asset
        ? [getImageUrl(seo.openGraphImage, 1200, 630)]
        : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: seo?.openGraphImage?.asset
        ? [getImageUrl(seo.openGraphImage, 1200, 630)]
        : [],
    },
    robots: seo?.noIndex ? 'noindex, nofollow' : 'index, follow',
  }
}

export default async function BackyardLifeListPage() {
  const raw = await getConfig()
  const config = resolveInaturalistBackyard(raw)

  if (!config?.inatUserLogin) {
    return (
      <div className="bg-[#e8e8e8] min-h-[50vh] px-6 py-16">
        <div className="max-w-2xl mx-auto prose prose-gray">
          <h1 className="text-2xl font-semibold text-gray-900">Life list</h1>
          <p className="text-gray-700">
            Configure <strong>Backyard birds (iNaturalist)</strong> in Sanity Studio
            first, including your iNaturalist username.
          </p>
          <p>
            <Link href="/backyard-birds" className="text-emerald-900 underline">
              Back to map
            </Link>
          </p>
        </div>
      </div>
    )
  }

  const result = await fetchLifeListSpecies(config, revalidate)

  return (
    <div className="bg-[#e8e8e8]">
      <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
        <header className="mb-10">
          <p className="text-sm text-gray-600 mb-2">
            <Link
              href="/backyard-birds"
              className="text-emerald-900 underline underline-offset-2 hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 rounded-sm"
            >
              Map
            </Link>
            <span aria-hidden="true"> · </span>
            Data from{' '}
            <a
              href="https://www.inaturalist.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-900 underline underline-offset-2 hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 rounded-sm"
            >
              iNaturalist
            </a>
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-6">
            {config.lifeListPageTitle}
          </h1>
          {config.lifeListIntroduction?.length ? (
            <div className="prose prose-gray max-w-3xl text-gray-700 mb-8">
              <PortableText value={config.lifeListIntroduction} />
            </div>
          ) : null}
        </header>

        {!result.ok ? (
          <p className="text-red-800 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {result.message}
          </p>
        ) : (
          <LifeListTable species={result.species} />
        )}
      </div>
    </div>
  )
}
