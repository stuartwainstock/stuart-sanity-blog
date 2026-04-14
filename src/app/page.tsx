import Link from 'next/link'
import { sanityClient } from '@/lib/sanity'
import { HOMEPAGE_QUERY } from '@/lib/queries'
import { Homepage } from '@/lib/types'
import styles from './page.module.css'

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
    <div className={styles.page}>
      {/* Hero Section — avoid min-h-screen + main grow so footer sits closer to copy */}
      <header className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.inner}>
          <div>
            <h1 
              id="hero-title"
              className={styles.title}
            >
              {hero.title}
            </h1>
            {hero.subtitle && (
              <p className={styles.subtitle}>
                {hero.subtitle}
              </p>
            )}
            <div 
              className={styles.actions}
              role="group"
              aria-label="Hero action buttons"
            >
              {hero.primaryButton && (
                <Link
                  href={hero.primaryButton.url}
                  className={styles.primaryLink}
                >
                  {hero.primaryButton.text}
                  <svg className={styles.arrow} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              )}
              {hero.secondaryButton && (
                <Link
                  href={hero.secondaryButton.url}
                  className={styles.secondaryLink}
                >
                  {hero.secondaryButton.text}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
    </div>
  )
}
