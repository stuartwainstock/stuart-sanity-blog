import Link from 'next/link'
import Image from 'next/image'
import { Post } from '@/lib/types'
import { getImageUrl } from '@/lib/sanity'

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

  return (
    <article className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${featured ? 'md:flex' : ''}`}>
      {post.mainImage && (
        <div className={`relative ${featured ? 'md:w-1/2' : 'w-full h-48'}`}>
          <Link href={`/journal/${post.slug.current}`}>
            <Image
              src={getImageUrl(post.mainImage, featured ? 600 : 400, featured ? 400 : 250)}
              alt={post.mainImage.alt || post.title}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
          </Link>
          {post.mainImage.credit && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              Photo by {post.mainImage.credit}
            </div>
          )}
        </div>
      )}
      
      <div className={`p-6 ${featured ? 'md:w-1/2' : ''}`}>
        {post.categories && post.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.categories.map((category) => (
              <Link
                key={category._id}
                href={`/category/${category.slug.current}`}
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium transition-colors
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
        
        <h2 className={`font-bold text-gray-900 mb-3 ${featured ? 'text-2xl' : 'text-xl'}`}>
          <Link href={`/journal/${post.slug.current}`} className="!text-[rgb(79,79,79)] hover:!text-[rgb(79,79,79)] transition-colors">
            {post.title}
          </Link>
        </h2>
        
        {post.excerpt && (
          <p className="text-gray-600 mb-4 line-clamp-3">
            {post.excerpt}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-3">
            {post.author && (
              <>
                {post.author.image && (
                  <Image
                    src={getImageUrl(post.author.image, 32, 32)}
                    alt={post.author.image.alt || post.author.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <Link
                  href={`/author/${post.author.slug.current}`}
                  className="!text-[rgb(79,79,79)] hover:!text-[rgb(79,79,79)] transition-colors"
                >
                  {post.author.name}
                </Link>
              </>
            )}
          </div>
          <time dateTime={post.publishedAt}>{formattedDate}</time>
        </div>
        
        {featured && (
          <div className="mt-4">
            <Link
              href={`/journal/${post.slug.current}`}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              Read more
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </article>
  )
}
