import Link from 'next/link'
import { Book } from '@/lib/types'

interface ReadingListProps {
  books: Book[]
}

export default function ReadingList({ books }: ReadingListProps) {
  if (!books || books.length === 0) {
    return null
  }

  const getCategoryLabel = (category: string) => {
    const categoryLabels: Record<string, string> = {
      'leadership': 'Leadership',
      'visual-design': 'Visual Design',
      'design-systems': 'Design Systems',
      'user-experience': 'User Experience',
      'product-management': 'Product Management',
      'business': 'Business',
      'technology': 'Technology',
      'psychology': 'Psychology',
      'philosophy': 'Philosophy',
      'fiction': 'Fiction',
      'biography': 'Biography',
      'other': 'Other',
    }
    return categoryLabels[category] || category
  }

  // Group books by category
  const groupedBooks = books.reduce((acc, book) => {
    const category = book.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(book)
    return acc
  }, {} as Record<string, Book[]>)

  // Sort categories alphabetically
  const sortedCategories = Object.keys(groupedBooks).sort()

  return (
    <section 
      className="mt-16"
      aria-labelledby="reading-list-content"
    >
      <div 
        id="reading-list-content"
        className="space-y-12"
      >
        {sortedCategories.map((category) => (
          <div key={category} className="space-y-4">
            <h3 
              className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2"
              id={`category-${category}`}
            >
              {getCategoryLabel(category)}
            </h3>
            
            <div 
              className="space-y-4"
              role="list"
              aria-labelledby={`category-${category}`}
              aria-label={`Books in ${getCategoryLabel(category)} category`}
            >
              {groupedBooks[category].map((book, index) => {
                const bookContent = (
                  <div 
                    className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/30 transition-colors rounded-md px-2 -mx-2"
                    role="listitem"
                  >
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900 mb-1 leading-tight">
                        {book.title}
                      </h4>
                      <p className="text-base text-gray-600 mb-2">
                        by {book.author}
                      </p>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
                        {book.publishedYear && (
                          <span className="bg-gray-100 px-2 py-1 rounded-md">{book.publishedYear}</span>
                        )}
                        {book.publisher && (
                          <span className="bg-gray-100 px-2 py-1 rounded-md">{book.publisher}</span>
                        )}
                        {book.isbn && (
                          <span className="bg-gray-100 px-2 py-1 rounded-md">ISBN: {book.isbn}</span>
                        )}
                      </div>
                      {book.description && (
                        <p className="text-base text-gray-600 leading-relaxed">
                          {book.description}
                        </p>
                      )}
                    </div>
                  </div>
                )

                return book.url ? (
                  <Link
                    key={book._key || index}
                    href={book.url}
                    className="block focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 rounded-lg transition-all duration-200"
                    aria-label={`${book.title} by ${book.author} - ${getCategoryLabel(book.category)}`}
                  >
                    {bookContent}
                  </Link>
                ) : (
                  <div key={book._key || index}>
                    {bookContent}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
