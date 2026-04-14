import { notFound } from 'next/navigation'
import Link from 'next/link'
import { sanityClient } from '@/lib/sanity'
import { POSTS_BY_CATEGORY_QUERY, CATEGORIES_QUERY } from '@/lib/queries'
import { Post, Category } from '@/lib/types'
import PostCard from '@/components/molecules/PostCard'
import styles from './page.module.css'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

async function getCategoryData(slug: string) {
  try {
    const [posts, categories] = await Promise.all([
      sanityClient.fetch<Post[]>(POSTS_BY_CATEGORY_QUERY, { slug }),
      sanityClient.fetch<Category[]>(CATEGORIES_QUERY),
    ])
    
    const currentCategory = categories.find(cat => cat.slug.current === slug)
    
    return { posts, categories, currentCategory }
  } catch (error) {
    console.error('Error fetching category data:', error)
    return { posts: [], categories: [], currentCategory: null }
  }
}

// Revalidate every hour
export const revalidate = 3600

export async function generateStaticParams() {
  try {
    const categories = await sanityClient.fetch<Category[]>(CATEGORIES_QUERY)
    return categories.map((category) => ({
      slug: category.slug.current,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params
  const { currentCategory } = await getCategoryData(slug)
  
  if (!currentCategory) {
    return {
      title: 'Category Not Found',
    }
  }

  return {
    title: `${currentCategory.title} - Category`,
    description: currentCategory.description || `Browse all posts in the ${currentCategory.title} category`,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const { posts, categories, currentCategory } = await getCategoryData(slug)

  if (!currentCategory) {
    notFound()
  }

  const categoryBadgeClass = (color?: string) => {
    const base = styles.badge
    switch (color) {
      case 'blue':
        return `${base} ${styles.badgeBlue}`
      case 'green':
        return `${base} ${styles.badgeGreen}`
      case 'red':
        return `${base} ${styles.badgeRed}`
      case 'yellow':
        return `${base} ${styles.badgeYellow}`
      case 'purple':
        return `${base} ${styles.badgePurple}`
      case 'pink':
        return `${base} ${styles.badgePink}`
      case 'gray':
      default:
        return `${base} ${styles.badgeGray}`
    }
  }

  const categoryChipClass = (color?: string) => {
    const base = styles.chip
    switch (color) {
      case 'blue':
        return `${base} ${styles.chipBlue}`
      case 'green':
        return `${base} ${styles.chipGreen}`
      case 'red':
        return `${base} ${styles.chipRed}`
      case 'yellow':
        return `${base} ${styles.chipYellow}`
      case 'purple':
        return `${base} ${styles.chipPurple}`
      case 'pink':
        return `${base} ${styles.chipPink}`
      case 'gray':
      default:
        return `${base} ${styles.chipGray}`
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.badgeWrap}>
            <span className={categoryBadgeClass(currentCategory.color)}>
              {currentCategory.title}
            </span>
          </div>
          <h1 className={styles.title}>
            {currentCategory.title} Posts
          </h1>
          {currentCategory.description && (
            <p className={styles.subtitle}>
              {currentCategory.description}
            </p>
          )}
          <p className={styles.count}>
            {posts.length} {posts.length === 1 ? 'post' : 'posts'} found
          </p>
        </div>

        {/* Category Navigation */}
        <div className={styles.navSection}>
          <h2 className={styles.navHeading}>Other Categories</h2>
          <div className={styles.chipRow}>
            <Link
              href="/journal"
              className={`${styles.chip} ${styles.chipAll}`}
            >
              All Posts
            </Link>
            {categories
              .filter(cat => cat.slug.current !== slug)
              .map((category) => (
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
              <svg className={styles.emptySvg} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className={styles.emptyTitle}>No posts in this category yet</h3>
            <p className={styles.emptyText}>
              Check back soon for new content in the {currentCategory.title} category.
            </p>
            <Link
              href="/journal"
              className={styles.backLink}
            >
              <svg className={styles.backIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Browse All Posts
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
