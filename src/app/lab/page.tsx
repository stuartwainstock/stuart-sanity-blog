import type {Metadata} from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {HubPageHeader} from '@/components/molecules/HubPageHeader'
import {fetchLabHub, getImageUrl} from '@/lib/sanity'
import {normalizeHubLinkItems, resolveHubTitle} from '@/lib/contentHub'
import {pageShellBg} from '@/lib/pageTypography'
import type {SanityImage} from '@/lib/types'
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

function LabHubCardMedia({
  title,
  coverImage,
}: {
  title: string
  coverImage?: SanityImage
}) {
  if (coverImage?.asset) {
    return (
      <div className={styles.cardMedia}>
        <Image
          src={getImageUrl(coverImage, 800, 533)}
          alt={coverImage.alt || title}
          fill
          sizes="(max-width: 720px) 100vw, 380px"
          className={styles.cardImage}
        />
      </div>
    )
  }

  return <div className={styles.cardMediaEmpty} aria-hidden="true" />
}

export async function generateMetadata(): Promise<Metadata> {
  const hub = await fetchLabHub()
  const seo = hub?.seo
  const title = seo?.metaTitle || resolveHubTitle(hub, 'Lab')
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
  const items = normalizeHubLinkItems(hub?.items)
  const title = resolveHubTitle(hub, 'Lab')

  return (
    <div className={pageShellBg}>
      <div className={styles.wrap}>
        <HubPageHeader
          title={title}
          introduction={hub?.hubIntroduction}
          fallbackIntro="Experiments, maps, and side projects — tools built to explore data and ideas."
        />

        {items.length === 0 ? (
          <p className={styles.empty}>No lab projects published yet.</p>
        ) : (
          <ul className={styles.grid}>
            {items.map((item) => {
              const cardBody = (
                <>
                  <LabHubCardMedia title={item.title} coverImage={item.coverImage} />
                  <div className={styles.cardBody}>
                    <div className={styles.cardText}>
                      <h2 className={styles.cardTitle}>{item.title}</h2>
                      {item.summary ? <p className={styles.cardSummary}>{item.summary}</p> : null}
                    </div>
                    {item.external ? <ExternalLinkIcon className={styles.externalIcon} /> : null}
                  </div>
                </>
              )

              return (
                <li key={item._key} className={styles.cardItem}>
                  {item.external ? (
                    <a
                      href={item.href}
                      className={styles.card}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${item.title} (opens in new tab)`}
                    >
                      {cardBody}
                    </a>
                  ) : (
                    <Link href={item.href} className={styles.card}>
                      {cardBody}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
