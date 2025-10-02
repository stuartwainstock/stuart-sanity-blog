import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { sanityClient } from '@/lib/sanity'
import { postQuery, postsQuery } from '@/lib/queries'
import { Post } from '@/lib/types'
import { getImageUrl } from '@/lib/sanity'
import PortableText from '@/components/PortableText'

interface BlogPostPageProps {
  params: { slug: string }
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    const post = await sanityClient.fetch<Post>(postQuery, { slug })
    return post
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

export async function generateStaticParams() {
  try {
    const posts = await sanityClient.fetch<Post[]>(postsQuery)
    return posts.map((post) => ({
      slug: post.slug.current,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const post = await getPost(params.slug)
  
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
              post.mainImage ? [getImageUrl(post.mainImage, 1200, 630)] : [],
      type: 'article',
      publishedTime: post.publishedAt,
      authors: post.author ? [post.author.name] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo?.metaTitle || post.title,
      description: post.seo?.metaDescription || post.excerpt,
      images: post.seo?.openGraphImage ? [getImageUrl(post.seo.openGraphImage, 1200, 630)] : 
              post.mainImage ? [getImageUrl(post.mainImage, 1200, 630)] : [],
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getPost(params.slug)

  if (!post) {
    notFound()
  }

  const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <article className="min-h-screen">
      {/* Hero Section */}
      <header className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.categories.map((category) => (
                <Link
                  key={category._id}
                  href={`/category/${category.slug.current}`}
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium transition-colors
                    ${category.color === 'blue' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : ''}
                    ${category.color === 'green' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
                    ${category.color === 'red' ? 'bg-red-100 text-red-800 hover:bg-red-200' : ''}
                    ${category.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : ''}
                    ${category.color === 'purple' ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' : ''}
                    ${category.color === 'pink' ? 'bg-pink-100 text-pink-800 hover:bg-pink-200' : ''}
                    ${category.color === 'gray' ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : ''}
                  `}
                >
                  {category.title}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-gray-600 mb-8">
              {post.excerpt}
            </p>
          )}

          {/* Author and Date */}
          <div className="flex items-center space-x-4 text-gray-600">
            {post.author && (
              <>
                {post.author.image && (
                  <Image
                    src={getImageUrl(post.author.image, 48, 48)}
                    alt={post.author.image.alt || post.author.name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                )}
                <div>
                  <Link
                    href={`/author/${post.author.slug.current}`}
                    className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {post.author.name}
                  </Link>
                  <p className="text-sm text-gray-500">
                    Published on {formattedDate}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {post.mainImage && (
        <div className="relative h-96 md:h-[500px] bg-gray-100">
          <Image
            src={getImageUrl(post.mainImage, 1200, 600)}
            alt={post.mainImage.alt || post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {post.body && (
          <PortableText value={post.body} />
        )}
      </div>

      {/* Author Bio */}
      {post.author && post.author.bio && (
        <section className="bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <div className="flex items-start space-x-4">
                {post.author.image && (
                  <Image
                    src={getImageUrl(post.author.image, 80, 80)}
                    alt={post.author.image.alt || post.author.name}
                    width={80}
                    height={80}
                    className="rounded-full"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    About {post.author.name}
                  </h3>
                  <PortableText value={post.author.bio} />
                  {post.author.social && (
                    <div className="flex space-x-4 mt-4">
                      {post.author.social.twitter && (
                        <a
                          href={`https://twitter.com/${post.author.social.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600"
                        >
                          Twitter
                        </a>
                      )}
                      {post.author.social.linkedin && (
                        <a
                          href={`https://linkedin.com/in/${post.author.social.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          LinkedIn
                        </a>
                      )}
                      {post.author.social.github && (
                        <a
                          href={`https://github.com/${post.author.social.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-700 hover:text-gray-900"
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

      {/* Back to Blog */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Link
          href="/blog"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Blog
        </Link>
      </div>
    </article>
  )
}
