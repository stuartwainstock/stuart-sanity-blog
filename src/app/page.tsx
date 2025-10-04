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
      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {hero.title}
            </h1>
            {hero.subtitle && (
              <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
                {hero.subtitle}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {hero.primaryButton && (
                <Link
                  href={hero.primaryButton.url}
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  {hero.primaryButton.text}
                </Link>
              )}
              {hero.secondaryButton && (
                <Link
                  href={hero.secondaryButton.url}
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  {hero.secondaryButton.text}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
