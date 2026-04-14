'use client'

import Link from 'next/link'
import Image from 'next/image'
import {usePathname} from 'next/navigation'
import {useState, useRef, useEffect} from 'react'
import {SiteSettings, Page} from '@/lib/types'
import {getImageUrl} from '@/lib/sanity'
import styles from './Navigation.module.css'

interface NavigationProps {
  siteSettings?: SiteSettings
  navigationPages?: Page[]
}

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
    queueMicrotask(() => {
      setProjectsOpen(false)
      setMobileProjectsOpen(false)
    })
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
              {siteSettings?.logo && (
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

          {/* Desktop Navigation */}
          <div className={styles.desktopNav}>
            <Link href="/" className={styles.link}>
              Home
            </Link>
            <Link href="/journal" className={styles.link}>
              Journal
            </Link>
            {projectItems.length > 0 ? (
              <div className={styles.projectsWrap} ref={projectsDropdownRef}>
                <button
                  type="button"
                  className={`${styles.link} ${styles.projectsButton}`}
                  aria-expanded={projectsOpen}
                  aria-haspopup="true"
                  aria-controls="nav-projects-panel"
                  id="nav-projects-button"
                  onClick={() => setProjectsOpen((o) => !o)}
                >
                  {projectsLabel}
                  <svg
                    className={`${styles.projectsChevron} ${projectsOpen ? styles.projectsChevronOpen : ''}`}
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
                    className={styles.projectsPanel}
                    role="region"
                    aria-label={`${projectsLabel} links`}
                  >
                    <ul className={styles.projectsList} role="list">
                      {projectItems.map((item) => (
                        <li key={item._key}>
                          <Link
                            href={item.href}
                            className={styles.projectsItemLink}
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
                className={styles.link}
              >
                {page.title}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
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
            className={styles.mobileMenu}
            aria-label="Mobile navigation"
          >
            <ul className={styles.mobileList}>
              <li>
                <Link
                  ref={firstLinkRef}
                  href="/"
                  className={styles.mobileLink}
                  onClick={closeMenu}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link href="/journal" className={styles.mobileLink} onClick={closeMenu}>
                  Journal
                </Link>
              </li>
              {projectItems.length > 0 ? (
                <li>
                  <button
                    type="button"
                    className={`${styles.mobileLink} ${styles.mobileProjectsButton}`}
                    aria-expanded={mobileProjectsOpen}
                    aria-controls="mobile-projects-sublist"
                    id="mobile-projects-trigger"
                    onClick={() => setMobileProjectsOpen((o) => !o)}
                  >
                    <span className="inline-flex w-full items-center justify-between gap-2">
                      {projectsLabel}
                      <svg
                        className={`${styles.projectsChevron} ${mobileProjectsOpen ? styles.projectsChevronOpen : ''}`}
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
                      className={styles.mobileProjectsSublist}
                      aria-labelledby="mobile-projects-trigger"
                    >
                      {projectItems.map((item) => (
                        <li key={item._key}>
                          <Link
                            href={item.href}
                            className={styles.mobileLink}
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
