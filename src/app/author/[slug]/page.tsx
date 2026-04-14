import { sanityClient } from '@/lib/sanity'
import { AUTHOR_QUERY, POSTS_BY_AUTHOR_QUERY } from '@/lib/queries'
import { Author, Post } from '@/lib/types'
import PostCard from '@/components/molecules/PostCard'
import Image from 'next/image'
import { getImageUrl } from '@/lib/sanity'
import Link from 'next/link'
import styles from './page.module.css'

interface AuthorPageProps {
  params: Promise<{
    slug: string
  }>
}

// Revalidate every hour
export const revalidate = 3600

function firstPortableTextSpanText(value: unknown): string | null {
  if (!Array.isArray(value) || value.length === 0) return null
  const firstBlock = value[0]
  if (typeof firstBlock !== 'object' || firstBlock === null) return null
  const children = (firstBlock as Record<string, unknown>).children
  if (!Array.isArray(children) || children.length === 0) return null
  const firstChild = children[0]
  if (typeof firstChild !== 'object' || firstChild === null) return null
  const text = (firstChild as Record<string, unknown>).text
  return typeof text === 'string' && text.trim() ? text.trim() : null
}

async function getAuthorData(slug: string) {
  try {
    const [author, posts] = await Promise.all([
      sanityClient.fetch<Author>(AUTHOR_QUERY, { slug }),
      sanityClient.fetch<Post[]>(POSTS_BY_AUTHOR_QUERY, { slug }),
    ])
    return { author, posts }
  } catch (error) {
    console.error('Error fetching author data:', error)
    return { author: null, posts: [] }
  }
}

export async function generateMetadata({ params }: AuthorPageProps) {
  const { slug } = await params
  const { author } = await getAuthorData(slug)

  if (!author) {
    return {
      title: 'Author Not Found',
    }
  }

  return {
    title: `${author.name} - Author`,
    description: firstPortableTextSpanText(author.bio) || 'Author profile',
  }
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { slug } = await params
  const { author, posts } = await getAuthorData(slug)

  if (!author) {
    return (
      <div className={styles.notFoundWrap}>
        <div className={styles.notFoundInner}>
          <h1 className={styles.notFoundTitle}>Author Not Found</h1>
          <p className={styles.notFoundText}>The author you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/" className={styles.btnPrimary}>
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroRow}>
            {author.image && (
              <div className={styles.avatarWrap}>
                <Image
                  src={getImageUrl(author.image, 160, 160)}
                  alt={author.image.alt || author.name}
                  fill
                  className={styles.avatar}
                />
              </div>
            )}
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>{author.name}</h1>
              {author.bio && (
                <div className={styles.heroBio}>
                  <p>{firstPortableTextSpanText(author.bio) || 'Author bio'}</p>
                </div>
              )}
              <div className={styles.linkRow}>
                {author.email && (
                  <a href={`mailto:${author.email}`} className={styles.heroLink}>
                    Email
                  </a>
                )}
                {author.website && (
                  <a
                    href={author.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.heroLink}
                    aria-label="Author website (opens in new tab)"
                  >
                    Website
                  </a>
                )}
                {author.social?.twitter && (
                  <a
                    href={`https://twitter.com/${author.social.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.heroLink}
                    aria-label={`Twitter @${author.social.twitter} (opens in new tab)`}
                  >
                    Twitter
                  </a>
                )}
                {author.social?.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${author.social.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.heroLink}
                    aria-label={`LinkedIn ${author.social.linkedin} (opens in new tab)`}
                  >
                    LinkedIn
                  </a>
                )}
                {author.social?.github && (
                  <a
                    href={`https://github.com/${author.social.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.heroLink}
                    aria-label={`GitHub ${author.social.github} (opens in new tab)`}
                  >
                    GitHub
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {posts.length > 0 && (
        <section className={styles.postsSection}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Posts by {author.name}</h2>
              <p className={styles.sectionSubtitle}>
                {posts.length} {posts.length === 1 ? 'post' : 'posts'} published
              </p>
            </div>
            <div className={styles.grid}>
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {posts.length === 0 && (
        <section className={styles.emptySection}>
          <div className={styles.emptyInner}>
            <h2 className={styles.sectionTitle}>No Posts Yet</h2>
            <p className={styles.emptyLead}>{author.name} hasn&apos;t published any posts yet.</p>
            <Link href="/journal" className={styles.btnPrimary}>
              Browse All Posts
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
