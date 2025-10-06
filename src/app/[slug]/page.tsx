import { notFound } from 'next/navigation'
import Image from 'next/image'
import { sanityClient } from '@/lib/sanity'
import { PAGE_QUERY, PAGES_QUERY } from '@/lib/queries'
import { Page } from '@/lib/types'
import { getImageUrl } from '@/lib/sanity'
import PortableText from '@/components/PortableText'
import SpeakingEngagements from '@/components/SpeakingEngagements'
import ReadingList from '@/components/ReadingList'

interface PageProps {
  params: { slug: string }
}

async function getPage(slug: string): Promise<Page | null> {
  try {
    const page = await sanityClient.fetch<Page>(PAGE_QUERY, { slug })
    return page
  } catch (error) {
    console.error('Error fetching page:', error)
    return null
  }
}

export async function generateStaticParams() {
  try {
    const pages = await sanityClient.fetch<Page[]>(PAGES_QUERY)
    return pages.map((page) => ({
      slug: page.slug.current,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export async function generateMetadata({ params }: PageProps) {
  const page = await getPage(params.slug)
  
  if (!page) {
    return {
      title: 'Page Not Found',
    }
  }

  return {
    title: page.seo?.metaTitle || page.title,
    description: page.seo?.metaDescription || page.excerpt,
    keywords: page.seo?.keywords,
    openGraph: {
      title: page.seo?.metaTitle || page.title,
      description: page.seo?.metaDescription || page.excerpt,
      images: page.seo?.openGraphImage ? [getImageUrl(page.seo.openGraphImage, 1200, 630)] : 
              (page.mainImage && page.mainImage.asset) ? [getImageUrl(page.mainImage, 1200, 630)] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.seo?.metaTitle || page.title,
      description: page.seo?.metaDescription || page.excerpt,
      images: page.seo?.openGraphImage ? [getImageUrl(page.seo.openGraphImage, 1200, 630)] : 
              (page.mainImage && page.mainImage.asset) ? [getImageUrl(page.mainImage, 1200, 630)] : [],
    },
    robots: page.seo?.noIndex ? 'noindex, nofollow' : 'index, follow',
  }
}

export default async function PageComponent({ params }: PageProps) {
  const page = await getPage(params.slug)

  if (!page) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#e8e8e8]">
      {/* Skip to main content link for keyboard users */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-gray-900 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>
      
      {/* Hero Section */}
      <header 
        className="pt-24 pb-4 px-8" 
        role="banner"
        aria-labelledby="page-title"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-left">
            <h1 
              id="page-title"
              className="text-4xl font-semibold mb-12 text-gray-900 leading-tight"
            >
              {page.title}
            </h1>
            {page.excerpt && (
              <p className="text-[30px] font-light tracking-[2px] leading-[1.6] mb-2 text-gray-600 max-w-4xl">
                {page.excerpt}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {page.mainImage && page.mainImage.asset && (
        <div className="relative h-96 md:h-[400px] bg-gray-100">
          <Image
            src={getImageUrl(page.mainImage, 1200, 600)}
            alt={page.mainImage.alt || page.title}
            fill
            className="object-cover"
            priority
            unoptimized
          />
          {page.mainImage.credit && (
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded">
              Photo by {page.mainImage.credit}
            </div>
          )}
        </div>
      )}
      
      {/* Image Caption */}
      {page.mainImage && page.mainImage.asset && page.mainImage.caption && (
        <div className="max-w-5xl mx-auto px-8 py-4">
          <p className="text-sm text-gray-600 text-center italic">
            {page.mainImage.caption}
          </p>
        </div>
      )}

      {/* Content */}
      <main 
        id="main-content"
        className="max-w-5xl mx-auto px-8 pt-2 pb-16"
      >
        {page.body && (
          <div className="text-[30px] font-light tracking-[2px] leading-[1.6] text-gray-600">
            <PortableText value={page.body} />
          </div>
        )}
        
        {/* Speaking Engagements */}
        {page.speakingEngagements && page.speakingEngagements.length > 0 && (
          <SpeakingEngagements engagements={page.speakingEngagements} />
        )}
        
        {/* Reading List */}
        {page.readingList && page.readingList.length > 0 && (
          <ReadingList books={page.readingList} />
        )}
      </main>
    </div>
  )
}
