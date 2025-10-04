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
    <div>
      {/* Skip to main content link for keyboard users */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>
      
      {/* Hero Section */}
      <section 
        className="py-20" 
        role="banner"
        aria-labelledby="hero-title"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 
              id="hero-title"
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              {hero.title}
            </h1>
            {hero.subtitle && (
              <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
                {hero.subtitle}
              </p>
            )}
            <div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              role="group"
              aria-label="Hero action buttons"
            >
              {hero.primaryButton && (
                <Link
                  href={hero.primaryButton.url}
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  aria-describedby="primary-button-description"
                >
                  {hero.primaryButton.text}
                </Link>
              )}
              {hero.secondaryButton && (
                <Link
                  href={hero.secondaryButton.url}
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 focus:bg-white focus:text-blue-600 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-colors"
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
