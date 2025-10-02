import Link from 'next/link'
import { sanityClient } from '@/lib/sanity'
import { featuredPostsQuery, postsQuery } from '@/lib/queries'
import { Post } from '@/lib/types'
import PostCard from '@/components/PostCard'

async function getHomeData() {
  try {
    const [featuredPosts, recentPosts] = await Promise.all([
      sanityClient.fetch<Post[]>(featuredPostsQuery),
      sanityClient.fetch<Post[]>(`${postsQuery}[0...6]`),
    ])
    return { featuredPosts, recentPosts }
  } catch (error) {
    console.error('Error fetching home data:', error)
    return { featuredPosts: [], recentPosts: [] }
  }
}

export default async function Home() {
  const { featuredPosts, recentPosts } = await getHomeData()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to Our Blog
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Discover insights, tutorials, and stories from our community of writers and creators.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/blog"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Explore All Posts
              </Link>
              <Link
                href="/about"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Featured Posts
              </h2>
              <p className="text-xl text-gray-600">
                Our most popular and recommended content
              </p>
            </div>
            <div className="grid gap-8">
              {featuredPosts.slice(0, 2).map((post) => (
                <PostCard key={post._id} post={post} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Recent Posts
                </h2>
                <p className="text-xl text-gray-600">
                  Stay up to date with our latest content
                </p>
              </div>
              <Link
                href="/blog"
                className="hidden md:inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                View all posts
                <svg className="ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentPosts.slice(0, 6).map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
            <div className="text-center mt-12 md:hidden">
              <Link
                href="/blog"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                View all posts
                <svg className="ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Reading?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of readers who stay informed with our regular updates and insights.
          </p>
          <Link
            href="/blog"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
          >
            Browse All Posts
          </Link>
        </div>
      </section>
    </div>
  )
}
