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
      className="bg-[#e8e8e8] border-b border-gray-200" 
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 rounded-md"
              aria-label={`${siteSettings?.title || 'Blog'} - Go to homepage`}
            >
              {siteSettings?.logo ? (
                <Image
                  src={getImageUrl(siteSettings.logo, 32, 32)}
                  alt=""
                  width={32}
                  height={32}
                  className="rounded"
                  unoptimized
                />
              ) : (
                <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center" aria-hidden="true">
                  <span className="text-white font-medium text-sm">
                    {siteSettings?.title?.charAt(0) || 'B'}
                  </span>
                </div>
              )}
              <span className="font-medium text-lg text-gray-900">
                {siteSettings?.title || 'Blog'}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8" role="menubar">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 focus:text-gray-900 px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 rounded-md"
              role="menuitem"
            >
              Home
            </Link>
            <Link
              href="/journal"
              className="text-gray-600 hover:text-gray-900 focus:text-gray-900 px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 rounded-md"
              role="menuitem"
            >
              Blog
            </Link>
            {navigationPages.map((page) => (
              <Link
                key={page._id}
                href={`/${page.slug.current}`}
                className="text-gray-600 hover:text-gray-900 focus:text-gray-900 px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 rounded-md"
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
              className="text-gray-600 hover:text-gray-900 focus:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 p-2 rounded-md"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
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
            <div className="px-6 pt-4 pb-6 space-y-2 bg-[#e8e8e8] border-t border-gray-200">
              <Link
                href="/"
                className="block text-gray-600 hover:text-gray-900 focus:text-gray-900 px-3 py-2 text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 rounded-md"
                onClick={closeMenu}
                role="menuitem"
              >
                Home
              </Link>
              <Link
                href="/journal"
                className="block text-gray-600 hover:text-gray-900 focus:text-gray-900 px-3 py-2 text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 rounded-md"
                onClick={closeMenu}
                role="menuitem"
              >
                Blog
              </Link>
              {navigationPages.map((page) => (
                <Link
                  key={page._id}
                  href={`/${page.slug.current}`}
                  className="block text-gray-600 hover:text-gray-900 focus:text-gray-900 px-3 py-2 text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 rounded-md"
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
