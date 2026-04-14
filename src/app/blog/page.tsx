import { sanityClient } from '@/lib/sanity'
import { POSTS_QUERY, CATEGORIES_QUERY } from '@/lib/queries'
import { Post, Category } from '@/lib/types'
import PostCard from '@/components/molecules/PostCard'
import Link from 'next/link'
import styles from './page.module.css'

// Revalidate every hour
export const revalidate = 3600

async function getBlogData() {
  try {
    const [posts, categories] = await Promise.all([
      sanityClient.fetch<Post[]>(POSTS_QUERY),
      sanityClient.fetch<Category[]>(CATEGORIES_QUERY),
    ])
    return { posts, categories }
  } catch (error) {
    console.error('Error fetching blog data:', error)
    return { posts: [], categories: [] }
  }
}

export const metadata = {
  title: 'Journal',
  description: 'Read our latest blog posts and articles',
}

export default async function BlogPage() {
  const { posts, categories } = await getBlogData()

  const categoryChipClass = (color?: string) => {
    switch (color) {
      case 'blue':
        return `${styles.chip} ${styles.chipBlue}`
      case 'green':
        return `${styles.chip} ${styles.chipGreen}`
      case 'red':
        return `${styles.chip} ${styles.chipRed}`
      case 'yellow':
        return `${styles.chip} ${styles.chipYellow}`
      case 'purple':
        return `${styles.chip} ${styles.chipPurple}`
      case 'pink':
        return `${styles.chip} ${styles.chipPink}`
      case 'gray':
      default:
        return `${styles.chip} ${styles.chipGray}`
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            Journal
          </h1>
          <p className={styles.subtitle}>
            Explore our collection of articles, tutorials, and insights from our team and community.
          </p>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className={styles.categories}>
            <h2 className={styles.categoriesHeading}>Browse by Category</h2>
            <div className={styles.chipRow}>
              <Link
                href="/blog"
                className={`${styles.chip} ${styles.chipAll}`}
              >
                All Posts
              </Link>
              {categories.map((category) => (
                <Link
                  key={category._id}
                  href={`/category/${category.slug.current}`}
                  className={categoryChipClass(category.color)}
                >
                  {category.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <div className={styles.grid}>
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className={styles.emptyTitle}>No posts yet</h3>
            <p className={styles.emptyText}>
              Check back soon for new content, or visit our Sanity Studio to create your first post.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
