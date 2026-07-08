import type {Metadata} from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {fetchCaseStudyMeta, getImageUrl} from '@/lib/sanity'
import {
  hasCaseStudyAccess,
  isCaseStudyAccessConfigured,
  isValidCaseStudySlug,
} from '@/lib/caseStudy/access'
import PortableText from '@/components/molecules/PortableText'
import {pageShellBg} from '@/lib/pageTypography'
import {UnlockForm} from './UnlockForm'
import styles from './page.module.css'

type Props = {params: Promise<{slug: string}>}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params
  const caseStudy = isValidCaseStudySlug(slug) ? await fetchCaseStudyMeta(slug) : null

  if (!caseStudy) {
    return {title: 'Case study not found', robots: {index: false, follow: false}}
  }

  return {
    title: caseStudy.seo?.metaTitle || caseStudy.title,
    description: caseStudy.seo?.metaDescription || caseStudy.summary,
    // Gated content: never index a case study page.
    robots: {index: false, follow: false},
  }
}

export default async function CaseStudyPage({params}: Props) {
  const {slug} = await params

  if (!isValidCaseStudySlug(slug)) notFound()

  const caseStudy = await fetchCaseStudyMeta(slug)
  if (!caseStudy) notFound()

  const unlocked = await hasCaseStudyAccess(slug)
  const accessConfigured = isCaseStudyAccessConfigured()

  const metaParts = [caseStudy.client, caseStudy.role, caseStudy.year].filter(Boolean) as string[]

  return (
    <div className={pageShellBg}>
      <article className={styles.wrap}>
        <header className={styles.header}>
          <p className={styles.kicker}>
            <span aria-hidden="true">●</span> Case study
            {metaParts.length > 0 ? ` — ${metaParts.join(' · ')}` : ''}
          </p>
          <h1 className={styles.title}>{caseStudy.title}</h1>
          {caseStudy.summary ? <p className={styles.summary}>{caseStudy.summary}</p> : null}
          {caseStudy.liveUrl ? (
            <p className={styles.headerActions}>
              <a
                className={styles.liveLink}
                href={caseStudy.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit live project
                <svg
                  className={styles.liveLinkIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </p>
          ) : null}
        </header>

        {unlocked ? (
          <section className={styles.viewerSection} aria-label="Case study document">
            <div className={styles.viewerToolbar}>
              <span className={styles.unlockedBadge}>Unlocked</span>
              <div className={styles.viewerActions}>
                <a
                  className={styles.viewerAction}
                  href={`/api/case-studies/${encodeURIComponent(slug)}/file`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in new tab
                </a>
                <a
                  className={styles.viewerAction}
                  href={`/api/case-studies/${encodeURIComponent(slug)}/file?download=1`}
                >
                  Download PDF
                </a>
              </div>
            </div>
            <iframe
              className={styles.viewerFrame}
              src={`/api/case-studies/${encodeURIComponent(slug)}/file`}
              title={`${caseStudy.title} (PDF)`}
            />
          </section>
        ) : (
          <section className={styles.gateGrid}>
            <div className={styles.gateIntro}>
              {caseStudy.coverImage?.asset ? (
                <div className={styles.coverWrap}>
                  <Image
                    src={getImageUrl(caseStudy.coverImage, 1200, 800)}
                    alt={caseStudy.coverImage.alt || caseStudy.title}
                    fill
                    sizes="(max-width: 720px) 100vw, 640px"
                    className={styles.cover}
                  />
                </div>
              ) : null}
              {caseStudy.overview ? (
                <div className={styles.overview}>
                  <PortableText value={caseStudy.overview} baseHeadingLevel={2} />
                </div>
              ) : null}
            </div>

            <aside className={styles.gateCard} aria-label="Password protected">
              <div className={styles.lockIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className={styles.gateHeading}>This case study is password protected</h2>
              <p className={styles.gateText}>
                Enter the password you were given to view the full PDF in your browser.
              </p>
              {accessConfigured ? (
                <UnlockForm slug={slug} />
              ) : (
                <p className={styles.gateNotice}>
                  Access is not configured yet. Set <code>CASE_STUDY_SESSION_SECRET</code> in the
                  environment to enable unlocking.
                </p>
              )}
            </aside>
          </section>
        )}

        <div className={styles.backNav}>
          <Link href="/case-studies" className={styles.backLink}>
            All case studies
          </Link>
        </div>
      </article>
    </div>
  )
}
