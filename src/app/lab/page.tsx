import type {Metadata} from 'next'
import Link from 'next/link'
import PortableText from '@/components/molecules/PortableText'
import {fetchLabHub, getImageUrl} from '@/lib/sanity'
import {normalizeProjectsMenuItems} from '@/lib/projectsMenuLink'
import {pageShellBg} from '@/lib/pageTypography'
import styles from './page.module.css'

export const revalidate = 60

function ExternalLinkIcon({className}: {className?: string}) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h6v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14 21 3" />
    </svg>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const hub = await fetchLabHub()
  const seo = hub?.seo
  const title = seo?.metaTitle || hub?.hubTitle?.trim() || hub?.label?.trim() || 'Lab'
  const description =
    seo?.metaDescription ||
    'Experiments, maps, and side projects from the lab.'
  return {
    title,
    description,
    keywords: seo?.keywords,
    openGraph: {
      title,
      description,
      images: seo?.openGraphImage?.asset ? [getImageUrl(seo.openGraphImage, 1200, 630)] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: seo?.openGraphImage?.asset ? [getImageUrl(seo.openGraphImage, 1200, 630)] : [],
    },
    robots: seo?.noIndex ? 'noindex, nofollow' : 'index, follow',
  }
}

export default async function LabPage() {
  const hub = await fetchLabHub()
  const items = normalizeProjectsMenuItems(hub?.items)
  const title = hub?.hubTitle?.trim() || hub?.label?.trim() || 'Lab'

  return (
    <div className={pageShellBg}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          {hub?.hubIntroduction?.length ? (
            <div className={styles.intro}>
              <PortableText value={hub.hubIntroduction} />
            </div>
          ) : (
            <p className={styles.intro}>
              Experiments, maps, and side projects — tools built to explore data and ideas.
            </p>
          )}
        </header>

        {items.length === 0 ? (
          <p className={styles.empty}>No lab projects published yet.</p>
        ) : (
          <ul className={styles.grid}>
            {items.map((item) => (
              <li key={item._key} className={styles.cardItem}>
                {item.external ? (
                  <a
                    href={item.href}
                    className={styles.card}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${item.title} (opens in new tab)`}
                  >
                    <div className={styles.cardMedia} aria-hidden="true" />
                    <div className={styles.cardBody}>
                      <h2 className={styles.cardTitle}>{item.title}</h2>
                      <ExternalLinkIcon className={styles.externalIcon} />
                    </div>
                  </a>
                ) : (
                  <Link href={item.href} className={styles.card}>
                    <div className={styles.cardMedia} aria-hidden="true" />
                    <div className={styles.cardBody}>
                      <h2 className={styles.cardTitle}>{item.title}</h2>
                    </div>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
