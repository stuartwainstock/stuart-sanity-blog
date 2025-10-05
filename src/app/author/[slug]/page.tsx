import { sanityClient } from '@/lib/sanity'
import { authorQuery, postsByAuthorQuery } from '@/lib/queries'
import { Author, Post } from '@/lib/types'
import PostCard from '@/components/PostCard'
import Image from 'next/image'
import { getImageUrl } from '@/lib/sanity'
import Link from 'next/link'

interface AuthorPageProps {
  params: {
    slug: string
  }
}

async function getAuthorData(slug: string) {
  try {
    const [author, posts] = await Promise.all([
      sanityClient.fetch<Author>(authorQuery, { slug }),
      sanityClient.fetch<Post[]>(postsByAuthorQuery, { slug }),
    ])
    return { author, posts }
  } catch (error) {
    console.error('Error fetching author data:', error)
    return { author: null, posts: [] }
  }
}

export async function generateMetadata({ params }: AuthorPageProps) {
  const { author } = await getAuthorData(params.slug)
  
  if (!author) {
    return {
      title: 'Author Not Found',
    }
  }

  return {
    title: `${author.name} - Author`,
    description: author.bio ? author.bio[0]?.children?.[0]?.text || 'Author profile' : 'Author profile',
  }
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { author, posts } = await getAuthorData(params.slug)

  if (!author) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Author Not Found</h1>
          <p className="text-gray-600 mb-8">The author you're looking for doesn't exist.</p>
          <Link
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Author Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {author.image && (
              <div className="relative w-32 h-32 md:w-40 md:h-40">
                <Image
                  src={getImageUrl(author.image, 160, 160)}
                  alt={author.image.alt || author.name}
                  fill
                  className="rounded-full object-cover border-4 border-white shadow-lg"
                  unoptimized
                />
              </div>
            )}
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{author.name}</h1>
              {author.bio && (
                <div className="text-xl text-blue-100 max-w-3xl">
                  {/* You might want to render this as PortableText if it's rich text */}
                  <p>{author.bio[0]?.children?.[0]?.text || 'Author bio'}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-4 mt-6 justify-center md:justify-start">
                {author.email && (
                  <a
                    href={`mailto:${author.email}`}
                    className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Email
                  </a>
                )}
                {author.website && (
                  <a
                    href={author.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Website
                  </a>
                )}
                {author.social?.twitter && (
                  <a
                    href={`https://twitter.com/${author.social.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Twitter
                  </a>
                )}
                {author.social?.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${author.social.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    LinkedIn
                  </a>
                )}
                {author.social?.github && (
                  <a
                    href={`https://github.com/${author.social.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    GitHub
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Author Posts */}
      {posts.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Posts by {author.name}
              </h2>
              <p className="text-xl text-gray-600">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'} published
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* No Posts Message */}
      {posts.length === 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              No Posts Yet
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              {author.name} hasn't published any posts yet.
            </p>
            <Link
              href="/journal"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse All Posts
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
