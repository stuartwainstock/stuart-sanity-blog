import React, { useState, useEffect } from 'react'
import { StringInputProps, useFormValue } from 'sanity'

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
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&fields=key,title,author_name,first_publish_year,publisher,isbn,cover_i,subject`
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
    <div style={{ padding: '16px', border: '1px solid #e1e5e9', borderRadius: '6px', backgroundColor: '#fafbfc' }}>
      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for books on Open Library..."
          style={{
            width: '100%',
            padding: '8px 12px 8px 40px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '14px',
            outline: 'none',
            backgroundColor: 'white'
          }}
        />
        {isSearching && (
          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
            <div style={{ width: '16px', height: '16px', border: '2px solid #e5e7eb', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {showResults && searchResults.length > 0 && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', backgroundColor: 'white', maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
          {searchResults.map((book) => (
            <div
              key={book.key}
              onClick={() => selectBook(book)}
              style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '12px', alignItems: 'flex-start' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              {book.cover_i && (
                <img
                  src={getCoverUrl(book.cover_i)}
                  alt={book.title}
                  style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '4px' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#111827', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {book.title}
                </h4>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 2px 0' }}>
                  {book.author_name?.join(', ')}
                </p>
                {book.first_publish_year && (
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                    {book.first_publish_year}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Book Display */}
      {selectedBook && (
        <div style={{ padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#16a34a', marginTop: '2px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#166534', margin: '0 0 4px 0' }}>
                Selected: {selectedBook.title}
              </h4>
              <p style={{ fontSize: '12px', color: '#16a34a', margin: '0 0 8px 0' }}>
                by {selectedBook.author_name?.join(', ')}
              </p>
              <button
                onClick={clearSelection}
                style={{ fontSize: '11px', color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Clear selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Fallback */}
      <div style={{ fontSize: '12px', color: '#6b7280' }}>
        Can't find the book? You can still enter the details manually in the fields below.
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
