import type {Metadata} from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {HubPageHeader} from '@/components/molecules/HubPageHeader'
import {fetchCaseStudies, fetchCaseStudiesHub, getImageUrl} from '@/lib/sanity'
import {resolveHubTitle} from '@/lib/contentHub'
import {pageShellBg} from '@/lib/pageTypography'
import styles from './page.module.css'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const hub = await fetchCaseStudiesHub()
  const seo = hub?.seo
  const title = seo?.metaTitle || resolveHubTitle(hub, 'Case studies')
  const description =
    seo?.metaDescription ||
    'Password-protected case studies and portfolio work.'
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

export default async function CaseStudiesPage() {
  const [hub, caseStudies] = await Promise.all([fetchCaseStudiesHub(), fetchCaseStudies()])
  const title = resolveHubTitle(hub, 'Case studies')

  return (
    <div className={pageShellBg}>
      <div className={styles.wrap}>
        <HubPageHeader
          title={title}
          introduction={hub?.hubIntroduction}
          fallbackIntro="Selected portfolio work. These case studies are password protected — reach out if you need access."
        />

        {caseStudies.length === 0 ? (
          <p className={styles.empty}>No case studies published yet.</p>
        ) : (
          <ul className={styles.grid}>
            {caseStudies.map((study) => {
              const metaParts = [study.client, study.year].filter(Boolean) as string[]
              return (
                <li key={study._id} className={styles.cardItem}>
                  <Link href={`/case-studies/${study.slug.current}`} className={styles.card}>
                    <div className={styles.cardMedia}>
                      {study.coverImage?.asset ? (
                        <Image
                          src={getImageUrl(study.coverImage, 800, 533)}
                          alt={study.coverImage.alt || study.title}
                          fill
                          sizes="(max-width: 720px) 100vw, 380px"
                          className={styles.cardImage}
                        />
                      ) : (
                        <div className={styles.cardMediaEmpty} aria-hidden="true" />
                      )}
                      <span className={styles.lockBadge}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <rect x="5" y="11" width="14" height="9" rx="2" />
                          <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
                        </svg>
                        Protected
                      </span>
                    </div>
                    <div className={styles.cardBody}>
                      {metaParts.length > 0 ? (
                        <p className={styles.cardMeta}>{metaParts.join(' · ')}</p>
                      ) : null}
                      <h2 className={styles.cardTitle}>{study.title}</h2>
                      {study.summary ? <p className={styles.cardSummary}>{study.summary}</p> : null}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
