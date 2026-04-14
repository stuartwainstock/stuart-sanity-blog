import { notFound } from 'next/navigation'
import Image from 'next/image'
import { sanityClient } from '@/lib/sanity'
import { PAGE_QUERY, PAGES_QUERY, PUBLISHED_RESOURCES_QUERY } from '@/lib/queries'
import { Page, Resource } from '@/lib/types'
import { getImageUrl } from '@/lib/sanity'
import PortableText from '@/components/molecules/PortableText'
import {
  pageBanner,
  pageBodyTypography,
  pageContent,
  pageExcerpt,
  pageInner,
  pageShellBg,
  pageTitleH1,
} from '@/lib/pageTypography'
import SpeakingEngagements from '@/components/organisms/SpeakingEngagements'
import ReadingList from '@/components/organisms/ReadingList'
import styles from './page.module.css'

interface PageProps {
  params: Promise<{ slug: string }>
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

// Revalidate every hour
export const revalidate = 3600

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
  const { slug } = await params
  const page = await getPage(slug)
  
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
  const { slug } = await params
  const page = await getPage(slug)

  if (!page) {
    notFound()
  }

  let readingListResources: Resource[] = []
  if (slug === 'reading-list') {
    const resources = await sanityClient.fetch<Resource[]>(PUBLISHED_RESOURCES_QUERY)
    readingListResources = resources || []
  }

  return (
    <div className={pageShellBg}>
      {/* Hero Section */}
      <header 
        className={pageBanner} 
        role="banner"
        aria-labelledby="page-title"
      >
        <div className={pageInner}>
          <div className={styles.bannerInner}>
            <h1 
              id="page-title"
              className={pageTitleH1}
            >
              {page.title}
            </h1>
            {page.excerpt && (
              <p className={pageExcerpt}>
                {page.excerpt}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {page.mainImage && page.mainImage.asset && (
        <div className={styles.featuredWrap}>
          <Image
            src={getImageUrl(page.mainImage, 1200, 600)}
            alt={page.mainImage.alt || page.title}
            fill
            className={styles.featuredImage}
            priority
          />
          {page.mainImage.credit && (
            <div className={styles.credit}>Photo by {page.mainImage.credit}</div>
          )}
        </div>
      )}

      {/* Image Caption */}
      {page.mainImage && page.mainImage.asset && page.mainImage.caption && (
        <div className={`${pageInner} ${styles.captionBlock}`}>
          <p className={styles.caption}>{page.mainImage.caption}</p>
        </div>
      )}

      {/* Content */}
      <div className={pageContent} aria-labelledby="page-title">
        {page.body && (
          <div className={pageBodyTypography}>
            <PortableText value={page.body} pageBodyTypography />
          </div>
        )}
        
        {/* Speaking Engagements */}
        {page.speakingEngagements && page.speakingEngagements.length > 0 && (
          <SpeakingEngagements engagements={page.speakingEngagements} />
        )}
        
        {/* Reading List */}
        {readingListResources.length > 0 && (
          <ReadingList resources={readingListResources} />
        )}
      </div>
    </div>
  )
}
