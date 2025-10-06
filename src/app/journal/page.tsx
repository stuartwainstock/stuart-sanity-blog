import { sanityClient } from '@/lib/sanity'
import { POSTS_QUERY, CATEGORIES_QUERY, SITE_SETTINGS_QUERY } from '@/lib/queries'
import { Post, Category, SiteSettings } from '@/lib/types'
import PostCard from '@/components/PostCard'
import Link from 'next/link'

async function getJournalData() {
  try {
    const [posts, categories, siteSettings] = await Promise.all([
      sanityClient.fetch<Post[]>(POSTS_QUERY),
      sanityClient.fetch<Category[]>(CATEGORIES_QUERY),
      sanityClient.fetch<SiteSettings>(SITE_SETTINGS_QUERY),
    ])
    return { posts, categories, siteSettings }
  } catch (error) {
    console.error('Error fetching journal data:', error)
    return { posts: [], categories: [], siteSettings: null }
  }
}

export const metadata = {
  title: 'Journal',
  description: 'Read our latest blog posts and articles',
}

export default async function JournalPage() {
  const { posts, categories, siteSettings } = await getJournalData()

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Journal
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {siteSettings?.journalDescription || 'Explore our collection of articles, tutorials, and insights from our team and community.'}
          </p>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/journal"
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 transition-colors"
              >
                All Posts
              </Link>
              {categories.map((category) => (
                <Link
                  key={category._id}
                  href={`/category/${category.slug.current}`}
                  className={`px-4 py-2 rounded-full transition-colors
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
          </div>
        )}

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600">
              Check back soon for new content, or visit our Sanity Studio to create your first post.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
