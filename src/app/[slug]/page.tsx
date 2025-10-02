import { notFound } from 'next/navigation'
import Image from 'next/image'
import { sanityClient } from '@/lib/sanity'
import { pageQuery, pagesQuery } from '@/lib/queries'
import { Page } from '@/lib/types'
import { getImageUrl } from '@/lib/sanity'
import PortableText from '@/components/PortableText'

interface PageProps {
  params: { slug: string }
}

async function getPage(slug: string): Promise<Page | null> {
  try {
    const page = await sanityClient.fetch<Page>(pageQuery, { slug })
    return page
  } catch (error) {
    console.error('Error fetching page:', error)
    return null
  }
}

export async function generateStaticParams() {
  try {
    const pages = await sanityClient.fetch<Page[]>(pagesQuery)
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
              page.mainImage ? [getImageUrl(page.mainImage, 1200, 630)] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.seo?.metaTitle || page.title,
      description: page.seo?.metaDescription || page.excerpt,
      images: page.seo?.openGraphImage ? [getImageUrl(page.seo.openGraphImage, 1200, 630)] : 
              page.mainImage ? [getImageUrl(page.mainImage, 1200, 630)] : [],
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
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {page.title}
          </h1>
          {page.excerpt && (
            <p className="text-xl text-gray-600">
              {page.excerpt}
            </p>
          )}
        </div>
      </header>

      {/* Featured Image */}
      {page.mainImage && (
        <div className="relative h-96 md:h-[400px] bg-gray-100">
          <Image
            src={getImageUrl(page.mainImage, 1200, 600)}
            alt={page.mainImage.alt || page.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {page.body && (
          <PortableText value={page.body} />
        )}
      </div>
    </div>
  )
}
