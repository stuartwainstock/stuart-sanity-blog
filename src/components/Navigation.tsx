'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { SiteSettings, Page } from '@/lib/types'
import { getImageUrl } from '@/lib/sanity'

interface NavigationProps {
  siteSettings?: SiteSettings
  navigationPages?: Page[]
}

export default function Navigation({ siteSettings, navigationPages = [] }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <nav 
      className="bg-white shadow-sm border-b" 
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
              aria-label={`${siteSettings?.title || 'Blog'} - Go to homepage`}
            >
              {siteSettings?.logo ? (
                <Image
                  src={getImageUrl(siteSettings.logo, 40, 40)}
                  alt=""
                  width={40}
                  height={40}
                  className="rounded"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center" aria-hidden="true">
                  <span className="text-white font-bold text-lg">
                    {siteSettings?.title?.charAt(0) || 'B'}
                  </span>
                </div>
              )}
              <span className="font-bold text-xl text-gray-900">
                {siteSettings?.title || 'Blog'}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8" role="menubar">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-600 focus:text-blue-600 px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
              role="menuitem"
            >
              Home
            </Link>
            <Link
              href="/blog"
              className="text-gray-700 hover:text-blue-600 focus:text-blue-600 px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
              role="menuitem"
            >
              Blog
            </Link>
            {navigationPages.map((page) => (
              <Link
                key={page._id}
                href={`/${page.slug.current}`}
                className="text-gray-700 hover:text-blue-600 focus:text-blue-600 px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
                role="menuitem"
              >
                {page.title}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleMenu()
                }
              }}
              className="text-gray-700 hover:text-blue-600 focus:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 p-2 rounded-md"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div 
            id="mobile-menu"
            className="md:hidden"
            role="menu"
            aria-label="Mobile navigation menu"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t">
              <Link
                href="/"
                className="block text-gray-700 hover:text-blue-600 focus:text-blue-600 px-3 py-2 text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
                onClick={closeMenu}
                role="menuitem"
              >
                Home
              </Link>
              <Link
                href="/blog"
                className="block text-gray-700 hover:text-blue-600 focus:text-blue-600 px-3 py-2 text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
                onClick={closeMenu}
                role="menuitem"
              >
                Blog
              </Link>
              {navigationPages.map((page) => (
                <Link
                  key={page._id}
                  href={`/${page.slug.current}`}
                  className="block text-gray-700 hover:text-blue-600 focus:text-blue-600 px-3 py-2 text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
                  onClick={closeMenu}
                  role="menuitem"
                >
                  {page.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
