import React, { useState, useEffect } from 'react'
import { StringInputProps, useFormValue } from 'sanity'

// Simple SVG icons
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const BookIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

interface OpenLibraryBook {
  key: string
  title: string
  author_name?: string[]
  first_publish_year?: number
  publisher?: string[]
  isbn?: string[]
  cover_i?: number
  subject?: string[]
}

interface OpenLibraryResponse {
  docs: OpenLibraryBook[]
  numFound: number
}

export default function BookSearchInput(props: StringInputProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<OpenLibraryBook[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedBook, setSelectedBook] = useState<OpenLibraryBook | null>(null)
  const [showResults, setShowResults] = useState(false)

  const formValue = useFormValue(['readingList']) as any[]
  const currentIndex = props.path?.[0] as number

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchBooks(searchQuery)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }, [searchQuery])

  const searchBooks = async (query: string) => {
    setIsSearching(true)
    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10&fields=key,title,author_name,first_publish_year,publisher,isbn,cover_i,subject`
      )
      const data: OpenLibraryResponse = await response.json()
      setSearchResults(data.docs || [])
      setShowResults(true)
    } catch (error) {
      console.error('Error searching books:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const selectBook = (book: OpenLibraryBook) => {
    setSelectedBook(book)
    setShowResults(false)
    setSearchQuery('')
    
    // Update the form values
    const updatedBooks = [...(formValue || [])]
    if (currentIndex !== undefined && updatedBooks[currentIndex]) {
      updatedBooks[currentIndex] = {
        ...updatedBooks[currentIndex],
        title: book.title,
        author: book.author_name?.join(', ') || 'Unknown Author',
        description: book.subject?.slice(0, 3).join(', ') || '',
        url: `https://openlibrary.org${book.key}`,
        isbn: book.isbn?.[0] || '',
        publishedYear: book.first_publish_year?.toString() || '',
        publisher: book.publisher?.[0] || '',
        coverId: book.cover_i?.toString() || ''
      }
      
      // Trigger form update
      props.onChange?.(updatedBooks)
    }
  }

  const clearSelection = () => {
    setSelectedBook(null)
    setSearchQuery('')
  }

  const getCoverUrl = (coverId: number) => {
    return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for books on Open Library..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        {isSearching && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {showResults && searchResults.length > 0 && (
        <div className="border border-gray-200 rounded-md bg-white shadow-lg max-h-96 overflow-y-auto">
          {searchResults.map((book) => (
            <div
              key={book.key}
              onClick={() => selectBook(book)}
              className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="flex space-x-3">
                {book.cover_i && (
                  <img
                    src={getCoverUrl(book.cover_i)}
                    alt={book.title}
                    className="w-12 h-16 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {book.title}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {book.author_name?.join(', ')}
                  </p>
                  {book.first_publish_year && (
                    <p className="text-xs text-gray-400">
                      {book.first_publish_year}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Book Display */}
      {selectedBook && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start space-x-3">
            <BookIcon className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-green-900">
                Selected: {selectedBook.title}
              </h4>
              <p className="text-sm text-green-700">
                by {selectedBook.author_name?.join(', ')}
              </p>
              <button
                onClick={clearSelection}
                className="mt-2 text-xs text-green-600 hover:text-green-800 underline"
              >
                Clear selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Fallback */}
      <div className="text-xs text-gray-500">
        Can't find the book? You can still enter the details manually in the fields below.
      </div>
    </div>
  )
}
