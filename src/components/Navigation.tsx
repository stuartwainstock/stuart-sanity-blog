'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { SiteSettings, Page } from '@/lib/types'
import { getImageUrl } from '@/lib/sanity'

interface NavigationProps {
  siteSettings?: SiteSettings
  navigationPages?: Page[]
}

export default function Navigation({ siteSettings, navigationPages = [] }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  // Focus management for mobile menu
  useEffect(() => {
    if (isMenuOpen && firstLinkRef.current) {
      // Focus first link when menu opens
      firstLinkRef.current.focus()
    } else if (!isMenuOpen && buttonRef.current) {
      // Return focus to button when menu closes
      buttonRef.current.focus()
    }
  }, [isMenuOpen])

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        closeMenu()
      }
    }

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isMenuOpen])

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
              className="flex items-center focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 rounded-md"
              aria-label={`${siteSettings?.title || 'Blog'} - Go to homepage`}
            >
              {siteSettings?.logo && (
                <Image
                  src={getImageUrl(siteSettings.logo, 32, 32)}
                  alt={siteSettings.logo.alt || `${siteSettings?.title || 'Blog'} logo`}
                  width={32}
                  height={32}
                  className="rounded mr-3"
                />
              )}
              <span className="font-medium text-lg text-gray-900">
                {siteSettings?.title || 'Blog'}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 focus:text-gray-900 px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 rounded-md"
            >
              Home
            </Link>
            <Link
              href="/journal"
              className="text-gray-600 hover:text-gray-900 focus:text-gray-900 px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 rounded-md"
            >
              Journal
            </Link>
            {navigationPages.map((page) => (
              <Link
                key={page._id}
                href={`/${page.slug.current}`}
                className="text-gray-600 hover:text-gray-900 focus:text-gray-900 px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 rounded-md"
              >
                {page.title}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              ref={buttonRef}
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
            ref={menuRef}
            id="mobile-menu"
            className="md:hidden"
            aria-label="Mobile navigation menu"
            role="menu"
          >
            <div className="px-6 pt-4 pb-6 space-y-2 bg-[#e8e8e8] border-t border-gray-200">
              <Link
                ref={firstLinkRef}
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
                Journal
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
