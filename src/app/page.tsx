import Link from 'next/link'
import { sanityClient } from '@/lib/sanity'
import { HOMEPAGE_QUERY } from '@/lib/queries'
import { Homepage } from '@/lib/types'

// Revalidate every hour
export const revalidate = 3600

async function getHomeData() {
  try {
    const homepage = await sanityClient.fetch<Homepage>(HOMEPAGE_QUERY)
    return { homepage }
  } catch (error) {
    console.error('Error fetching home data:', error)
    return { homepage: null }
  }
}

export default async function Home() {
  const { homepage } = await getHomeData()

  // Fallback content if no homepage content is found
  const hero = homepage?.hero || {
    title: 'Welcome to Our Blog',
    subtitle: 'Discover insights, tutorials, and stories from our community of writers and creators.',
    primaryButton: { text: 'Explore All Posts', url: '/journal' },
    secondaryButton: { text: 'Learn More', url: '/about' }
  }

  return (
    <div className="min-h-screen bg-[#e8e8e8]">
      {/* Hero Section */}
      <main 
        id="main-content"
        className="py-32 px-8" 
        role="banner"
        aria-labelledby="hero-title"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-left">
            <h1 
              id="hero-title"
              className="text-4xl font-semibold mb-12 text-gray-900 leading-tight"
            >
              {hero.title}
            </h1>
            {hero.subtitle && (
              <p className="text-[30px] font-light tracking-[2px] leading-[1.6] mb-16 text-gray-600 max-w-4xl">
                {hero.subtitle}
              </p>
            )}
            <div 
              className="flex flex-col sm:flex-row gap-6"
              role="group"
              aria-label="Hero action buttons"
            >
              {hero.primaryButton && (
                <Link
                  href={hero.primaryButton.url}
                  className="inline-flex items-center text-gray-900 hover:text-gray-600 focus:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors text-lg font-medium border-b border-gray-300 hover:border-gray-600 pb-1"
                >
                  {hero.primaryButton.text}
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              )}
              {hero.secondaryButton && (
                <Link
                  href={hero.secondaryButton.url}
                  className="inline-flex items-center text-gray-600 hover:text-gray-900 focus:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors text-lg font-medium"
                >
                  {hero.secondaryButton.text}
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
