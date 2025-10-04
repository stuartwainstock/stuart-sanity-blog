import Link from 'next/link'
import { sanityClient } from '@/lib/sanity'
import { homepageQuery } from '@/lib/queries'
import { Homepage } from '@/lib/types'

async function getHomeData() {
  try {
    const homepage = await sanityClient.fetch<Homepage>(homepageQuery)
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
    primaryButton: { text: 'Explore All Posts', url: '/blog' },
    secondaryButton: { text: 'Learn More', url: '/about' }
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
      <section 
        className="py-24 px-6" 
        role="banner"
        aria-labelledby="hero-title"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-left">
            <h1 
              id="hero-title"
              className="text-4xl font-semibold mb-8 text-gray-900 leading-tight"
            >
              {hero.title}
            </h1>
            {hero.subtitle && (
              <p className="text-[30px] font-light tracking-[2px] leading-[1.6] mb-12 text-gray-600 max-w-3xl">
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
                  aria-describedby="primary-button-description"
                >
                  {hero.primaryButton.text}
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              )}
              {hero.secondaryButton && (
                <Link
                  href={hero.secondaryButton.url}
                  className="inline-flex items-center text-gray-600 hover:text-gray-900 focus:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors text-lg font-medium"
                  aria-describedby="secondary-button-description"
                >
                  {hero.secondaryButton.text}
                </Link>
              )}
            </div>
            {/* Screen reader descriptions for buttons */}
            <div id="primary-button-description" className="sr-only">
              Primary call-to-action button
            </div>
            <div id="secondary-button-description" className="sr-only">
              Secondary call-to-action button
            </div>
          </div>
        </div>
      </section>
      
      {/* Main content landmark */}
      <main id="main-content" className="sr-only">
        <h2>Main Content</h2>
        <p>This is the main content area of the homepage.</p>
      </main>
    </div>
  )
}
