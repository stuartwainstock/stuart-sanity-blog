'use client'

import Link from 'next/link'
import Image from 'next/image'
import {usePathname} from 'next/navigation'
import {useState, useRef, useEffect} from 'react'
import {SiteSettings, Page} from '@/lib/types'
import {getImageUrl} from '@/lib/sanity'

interface NavigationProps {
  siteSettings?: SiteSettings
  navigationPages?: Page[]
}

const navLinkClass =
  'text-gray-600 hover:text-gray-900 focus:text-gray-900 px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 rounded-md'

const navLinkClassMobile =
  'block text-gray-600 hover:text-gray-900 focus:text-gray-900 px-3 py-2 text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 rounded-md'

function useProjectsMenu(siteSettings?: SiteSettings) {
  const raw = siteSettings?.projectsMenu?.items ?? []
  const items = raw.filter(
    (i) => i.title?.trim() && i.href?.trim()?.startsWith('/'),
  )
  const label = siteSettings?.projectsMenu?.label?.trim() || 'Projects'
  return {items, label}
}

export default function Navigation({siteSettings, navigationPages = []}: NavigationProps) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [projectsOpen, setProjectsOpen] = useState(false)
  const [mobileProjectsOpen, setMobileProjectsOpen] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)
  const wasMenuOpenRef = useRef(false)
  const projectsDropdownRef = useRef<HTMLDivElement>(null)

  const {items: projectItems, label: projectsLabel} = useProjectsMenu(siteSettings)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  useEffect(() => {
    setProjectsOpen(false)
    setMobileProjectsOpen(false)
  }, [pathname])

  useEffect(() => {
    if (isMenuOpen && firstLinkRef.current) {
      firstLinkRef.current.focus()
    } else if (wasMenuOpenRef.current && !isMenuOpen && buttonRef.current) {
      buttonRef.current.focus()
    }
    wasMenuOpenRef.current = isMenuOpen
  }, [isMenuOpen])

  useEffect(() => {
    if (!projectsOpen) return
    const onPointerDown = (e: MouseEvent) => {
      const el = projectsDropdownRef.current
      if (el && !el.contains(e.target as Node)) {
        setProjectsOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [projectsOpen])

  useEffect(() => {
    if (!projectsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProjectsOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [projectsOpen])

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
            <Link href="/" className={navLinkClass}>
              Home
            </Link>
            <Link href="/journal" className={navLinkClass}>
              Journal
            </Link>
            {projectItems.length > 0 ? (
              <div className="relative" ref={projectsDropdownRef}>
                <button
                  type="button"
                  className={`${navLinkClass} inline-flex items-center gap-1`}
                  aria-expanded={projectsOpen}
                  aria-haspopup="true"
                  aria-controls="nav-projects-panel"
                  id="nav-projects-button"
                  onClick={() => setProjectsOpen((o) => !o)}
                >
                  {projectsLabel}
                  <svg
                    className={`h-4 w-4 shrink-0 transition-transform ${projectsOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {projectsOpen ? (
                  <div
                    id="nav-projects-panel"
                    className="absolute right-0 top-full z-100 mt-1 min-w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg"
                    role="region"
                    aria-label={`${projectsLabel} links`}
                  >
                    <ul className="m-0 list-none p-0" role="list">
                      {projectItems.map((item) => (
                        <li key={item._key}>
                          <Link
                            href={item.href}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus:bg-gray-50 focus:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-300"
                            onClick={() => setProjectsOpen(false)}
                          >
                            {item.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
            {navigationPages.map((page) => (
              <Link
                key={page._id}
                href={`/${page.slug.current}`}
                className={navLinkClass}
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
        {isMenuOpen ? (
          <div
            ref={menuRef}
            id="mobile-menu"
            className="md:hidden border-t border-gray-200 bg-[#e8e8e8]"
            aria-label="Mobile navigation"
          >
            <ul className="list-none px-6 pt-4 pb-6 space-y-2 m-0">
              <li>
                <Link
                  ref={firstLinkRef}
                  href="/"
                  className={navLinkClassMobile}
                  onClick={closeMenu}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link href="/journal" className={navLinkClassMobile} onClick={closeMenu}>
                  Journal
                </Link>
              </li>
              {projectItems.length > 0 ? (
                <li>
                  <button
                    type="button"
                    className={`${navLinkClassMobile} w-full text-left`}
                    aria-expanded={mobileProjectsOpen}
                    aria-controls="mobile-projects-sublist"
                    id="mobile-projects-trigger"
                    onClick={() => setMobileProjectsOpen((o) => !o)}
                  >
                    <span className="inline-flex w-full items-center justify-between gap-2">
                      {projectsLabel}
                      <svg
                        className={`h-4 w-4 shrink-0 transition-transform ${mobileProjectsOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </span>
                  </button>
                  {mobileProjectsOpen ? (
                    <ul
                      id="mobile-projects-sublist"
                      role="list"
                      className="m-0 mt-2 list-none space-y-1 border-l border-gray-300 pl-4"
                      aria-labelledby="mobile-projects-trigger"
                    >
                      {projectItems.map((item) => (
                        <li key={item._key}>
                          <Link
                            href={item.href}
                            className={navLinkClassMobile}
                            onClick={closeMenu}
                          >
                            {item.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ) : null}
              {navigationPages.map((page) => (
                <li key={page._id}>
                  <Link
                    href={`/${page.slug.current}`}
                    className={navLinkClassMobile}
                    onClick={closeMenu}
                  >
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </nav>
  )
}
