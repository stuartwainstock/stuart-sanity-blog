import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { sanityClient } from '@/lib/sanity'
import { POST_QUERY, POSTS_QUERY } from '@/lib/queries'
import { Post } from '@/lib/types'
import { getImageUrl } from '@/lib/sanity'
import PortableText from '@/components/molecules/PortableText'
import ArticleScrollProgress from '@/components/ArticleScrollProgress'
import styles from './page.module.css'

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    const post = await sanityClient.fetch<Post>(POST_QUERY, { slug })
    return post
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

// Revalidate every hour
export const revalidate = 3600

export async function generateStaticParams() {
  try {
    const posts = await sanityClient.fetch<Post[]>(POSTS_QUERY)
    return posts.map((post) => ({
      slug: post.slug.current,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = await getPost(slug)
  
  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return {
    title: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.excerpt,
    keywords: post.seo?.keywords,
    openGraph: {
      title: post.seo?.metaTitle || post.title,
      description: post.seo?.metaDescription || post.excerpt,
      images: post.seo?.openGraphImage ? [getImageUrl(post.seo.openGraphImage, 1200, 630)] : 
              (post.mainImage && post.mainImage.asset) ? [getImageUrl(post.mainImage, 1200, 630)] : [],
      type: 'article',
      publishedTime: post.publishedAt,
      authors: post.author ? [post.author.name] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo?.metaTitle || post.title,
      description: post.seo?.metaDescription || post.excerpt,
      images: post.seo?.openGraphImage ? [getImageUrl(post.seo.openGraphImage, 1200, 630)] : 
              (post.mainImage && post.mainImage.asset) ? [getImageUrl(post.mainImage, 1200, 630)] : [],
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

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
    <article id="journal-post" className={styles.article}>
      {/* Hero Section */}
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <div className={styles.categoriesRow}>
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

          {/* Title */}
          <h1 className={styles.title}>
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className={styles.excerpt}>
              {post.excerpt}
            </p>
          )}

          {/* Author and Date */}
          <div className={styles.metaRow}>
            {post.author && (
              <>
                {post.author.image && (
                  <Image
                    src={getImageUrl(post.author.image, 48, 48)}
                    alt={post.author.image.alt || post.author.name}
                    width={48}
                    height={48}
                    className={styles.authorAvatar}
                  />
                )}
                <div>
                  <Link
                    href={`/author/${post.author.slug.current}`}
                    className={styles.authorLink}
                  >
                    {post.author.name}
                  </Link>
                  <p className={styles.published}>
                    Published on {formattedDate}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {post.mainImage && post.mainImage.asset && (
        <div className={styles.featuredImageWrap}>
          <Image
            src={getImageUrl(post.mainImage, 1200, 600)}
            alt={post.mainImage.alt || post.title}
            fill
            className={styles.featuredImage}
            priority
          />
        </div>
      )}

      {/* Body + sticky scroll progress (desktop) */}
      <div className={styles.bodyOuter}>
        <div className={styles.bodyGrid}>
          <aside className={styles.progressAside}>
            <div className={styles.progressSticky}>
              <ArticleScrollProgress articleId="journal-post" />
            </div>
          </aside>
          <div className={styles.body}>
            {post.body && (
              <PortableText value={post.body} />
            )}
          </div>
        </div>
      </div>

      {/* Author Bio */}
      {post.author && post.author.bio && (
        <section className={styles.authorBioSection}>
          <div className={styles.heroInner}>
            <div className={styles.authorBioCard}>
              <div className={styles.authorBioRow}>
                {post.author.image && (
                  <Image
                    src={getImageUrl(post.author.image, 80, 80)}
                    alt={post.author.image.alt || post.author.name}
                    width={80}
                    height={80}
                    className={styles.authorBioAvatar}
                  />
                )}
                <div className="flex-1">
                  <h3 className={styles.authorBioTitle}>
                    About {post.author.name}
                  </h3>
                  <PortableText value={post.author.bio} />
                  {post.author.social && (
                    <div className={styles.authorSocialRow}>
                      {post.author.social.twitter && (
                        <a
                          href={`https://twitter.com/${post.author.social.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.authorSocialLink}
                          aria-label={`Twitter @${post.author.social.twitter} (opens in new tab)`}
                        >
                          Twitter
                        </a>
                      )}
                      {post.author.social.linkedin && (
                        <a
                          href={`https://linkedin.com/in/${post.author.social.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.authorSocialLink}
                          aria-label={`LinkedIn ${post.author.social.linkedin} (opens in new tab)`}
                        >
                          LinkedIn
                        </a>
                      )}
                      {post.author.social.github && (
                        <a
                          href={`https://github.com/${post.author.social.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.authorSocialLink}
                          aria-label={`GitHub ${post.author.social.github} (opens in new tab)`}
                        >
                          GitHub
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Back to Journal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Link
          href="/journal"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Journal
        </Link>
      </div>
    </article>
  )
}
