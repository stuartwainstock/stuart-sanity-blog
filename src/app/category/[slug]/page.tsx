import { notFound } from 'next/navigation'
import Link from 'next/link'
import { sanityClient } from '@/lib/sanity'
import { postsByCategoryQuery, categoriesQuery } from '@/lib/queries'
import { Post, Category } from '@/lib/types'
import PostCard from '@/components/PostCard'

interface CategoryPageProps {
  params: { slug: string }
}

async function getCategoryData(slug: string) {
  try {
    const [posts, categories] = await Promise.all([
      sanityClient.fetch<Post[]>(postsByCategoryQuery, { slug }),
      sanityClient.fetch<Category[]>(categoriesQuery),
    ])
    
    const currentCategory = categories.find(cat => cat.slug.current === slug)
    
    return { posts, categories, currentCategory }
  } catch (error) {
    console.error('Error fetching category data:', error)
    return { posts: [], categories: [], currentCategory: null }
  }
}

export async function generateStaticParams() {
  try {
    const categories = await sanityClient.fetch<Category[]>(categoriesQuery)
    return categories.map((category) => ({
      slug: category.slug.current,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { currentCategory } = await getCategoryData(params.slug)
  
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
  const { posts, categories, currentCategory } = await getCategoryData(params.slug)

  if (!currentCategory) {
    notFound()
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-4">
            <span className={`inline-block px-4 py-2 rounded-full text-lg font-medium
              ${currentCategory.color === 'blue' ? 'bg-blue-100 text-blue-800' : ''}
              ${currentCategory.color === 'green' ? 'bg-green-100 text-green-800' : ''}
              ${currentCategory.color === 'red' ? 'bg-red-100 text-red-800' : ''}
              ${currentCategory.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${currentCategory.color === 'purple' ? 'bg-purple-100 text-purple-800' : ''}
              ${currentCategory.color === 'pink' ? 'bg-pink-100 text-pink-800' : ''}
              ${currentCategory.color === 'gray' ? 'bg-gray-100 text-gray-800' : ''}
            `}>
              {currentCategory.title}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {currentCategory.title} Posts
          </h1>
          {currentCategory.description && (
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {currentCategory.description}
            </p>
          )}
          <p className="text-gray-500 mt-4">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'} found
          </p>
        </div>

        {/* Category Navigation */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Other Categories</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/blog"
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 transition-colors"
            >
              All Posts
            </Link>
            {categories
              .filter(cat => cat.slug.current !== params.slug)
              .map((category) => (
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts in this category yet</h3>
            <p className="text-gray-600 mb-6">
              Check back soon for new content in the {currentCategory.title} category.
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
