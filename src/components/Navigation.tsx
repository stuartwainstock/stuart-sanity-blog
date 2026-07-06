'use client'

import Link from 'next/link'
import Image from 'next/image'
import {usePathname} from 'next/navigation'
import {useState, useRef, useEffect} from 'react'
import {SiteSettings, Page} from '@/lib/types'
import {getImageUrl} from '@/lib/sanity'
import {buildHubNavLinks, isHubLinkActive, normalizeHubLinkItems} from '@/lib/contentHub'
import styles from './Navigation.module.css'

interface NavigationProps {
  siteSettings?: SiteSettings
  navigationPages?: Page[]
}

export default function Navigation({siteSettings, navigationPages = []}: NavigationProps) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)
  const wasMenuOpenRef = useRef(false)

  const labChildPaths = normalizeHubLinkItems(siteSettings?.projectsMenu?.items)
    .filter((item) => !item.external)
    .map((item) => item.href)

  const hubNavLinks = buildHubNavLinks([
    {key: 'lab', hub: siteSettings?.projectsMenu},
    {key: 'case-studies', hub: siteSettings?.caseStudiesHub},
  ])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  useEffect(() => {
    if (isMenuOpen && firstLinkRef.current) {
      firstLinkRef.current.focus()
    } else if (wasMenuOpenRef.current && !isMenuOpen && buttonRef.current) {
      buttonRef.current.focus()
    }
    wasMenuOpenRef.current = isMenuOpen
  }, [isMenuOpen])

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

  function hubChildPathsFor(href: string): string[] {
    if (href === siteSettings?.projectsMenu?.href?.trim()) {
      return labChildPaths
    }
    if (href === siteSettings?.caseStudiesHub?.href?.trim()) {
      return ['/case-studies']
    }
    return []
  }

  return (
    <nav
      className={styles.nav}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className={styles.container}>
        <div className={styles.bar}>
          <div className={styles.brand}>
            <Link
              href="/"
              className={styles.brandLink}
              aria-label={`${siteSettings?.title || 'Blog'} - Go to homepage`}
            >
              {siteSettings?.logo?.asset && (
                <Image
                  src={getImageUrl(siteSettings.logo, 32, 32)}
                  alt={siteSettings.logo.alt || `${siteSettings?.title || 'Blog'} logo`}
                  width={32}
                  height={32}
                  className={styles.logo}
                />
              )}
              <span className={styles.brandTitle}>
                {siteSettings?.title || 'Blog'}
              </span>
            </Link>
          </div>

          <div className={styles.desktopNav}>
            <Link href="/journal" className={styles.link}>
              Journal
            </Link>
            {hubNavLinks.map((hub) => {
              const active = isHubLinkActive(pathname, hub.href, hubChildPathsFor(hub.href))
              return (
                <Link
                  key={hub.key}
                  href={hub.href}
                  className={`${styles.link} ${active ? styles.linkActive : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  {hub.label}
                </Link>
              )
            })}
            {navigationPages.map((page) => (
              <Link
                key={page._id}
                href={`/${page.slug.current}`}
                className={styles.link}
              >
                {page.title}
              </Link>
            ))}
          </div>

          <div className={styles.mobileButtonWrap}>
            <button
              ref={buttonRef}
              onClick={toggleMenu}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleMenu()
                }
              }}
              className={styles.iconButton}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              <svg className={styles.menuIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {isMenuOpen ? (
          <div
            ref={menuRef}
            id="mobile-menu"
            className={styles.mobileMenu}
            aria-label="Mobile navigation"
          >
            <ul className={styles.mobileList}>
              <li>
                <Link
                  ref={firstLinkRef}
                  href="/journal"
                  className={styles.mobileLink}
                  onClick={closeMenu}
                >
                  Journal
                </Link>
              </li>
              {hubNavLinks.map((hub) => {
                const active = isHubLinkActive(pathname, hub.href, hubChildPathsFor(hub.href))
                return (
                  <li key={hub.key}>
                    <Link
                      href={hub.href}
                      className={`${styles.mobileLink} ${active ? styles.linkActive : ''}`}
                      onClick={closeMenu}
                      aria-current={active ? 'page' : undefined}
                    >
                      {hub.label}
                    </Link>
                  </li>
                )
              })}
              {navigationPages.map((page) => (
                <li key={page._id}>
                  <Link
                    href={`/${page.slug.current}`}
                    className={styles.mobileLink}
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
