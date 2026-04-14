import Link from 'next/link'
import Image from 'next/image'
import { Post } from '@/lib/types'
import { getImageUrl } from '@/lib/sanity'
import styles from './PostCard.module.css'

interface PostCardProps {
  post: Post
  featured?: boolean
}

export default function PostCard({ post, featured = false }: PostCardProps) {
  const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

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
    <article className={`${styles.card} ${featured ? styles.featured : ''}`}>
      {post.mainImage && (
        <div
          className={`${styles.media} ${featured ? styles.mediaFeatured : styles.mediaStandard}`}
        >
          <Link href={`/journal/${post.slug.current}`}>
            <Image
              src={getImageUrl(post.mainImage, featured ? 600 : 400, featured ? 400 : 250)}
              alt={post.mainImage.alt || post.title}
              fill
              className={styles.image}
            />
          </Link>
          {post.mainImage.credit && (
            <div className={styles.credit}>
              Photo by {post.mainImage.credit}
            </div>
          )}
        </div>
      )}
      
      <div className={`${styles.body} ${featured ? styles.bodyFeatured : ''}`}>
        {post.categories && post.categories.length > 0 && (
          <div className={styles.categories}>
            {post.categories.map((category) => (
              <Link
                key={category._id}
                href={`/category/${category.slug.current}`}
                className={categoryChipClass(category.color)}
              >
                {category.title}
              </Link>
            ))}
          </div>
        )}
        
        <h2
          className={`${styles.title} ${featured ? styles.titleFeatured : styles.titleStandard}`}
        >
          <Link href={`/journal/${post.slug.current}`} className={styles.titleLink}>
            {post.title}
          </Link>
        </h2>
        
        {post.excerpt && (
          <p className={`${styles.excerpt} line-clamp-3`}>
            {post.excerpt}
          </p>
        )}
        
        <div className={styles.meta}>
          <div className={styles.authorRow}>
            {post.author && (
              <>
                {post.author.image && (
                  <Image
                    src={getImageUrl(post.author.image, 32, 32)}
                    alt={post.author.image.alt || post.author.name}
                    width={32}
                    height={32}
                    className={styles.authorAvatar}
                  />
                )}
                <Link
                  href={`/author/${post.author.slug.current}`}
                  className={styles.authorLink}
                >
                  {post.author.name}
                </Link>
              </>
            )}
          </div>
          <time dateTime={post.publishedAt}>{formattedDate}</time>
        </div>
        
        {featured && (
          <div className={styles.readMoreWrap}>
            <Link
              href={`/journal/${post.slug.current}`}
              className={styles.readMore}
            >
              Read more
              <svg className={styles.readMoreIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </article>
  )
}

