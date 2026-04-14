import styles from '@/styles/pageTypography.module.css'

/** Shared layout + type scale for CMS pages (e.g. About) and matching static pages. */
export const pageShellBg = styles.pageShellBg

export const pageBanner = styles.pageBanner

export const pageInner = styles.pageInner

export const pageTitleH1 = styles.pageTitleH1

/**
 * H1 on data-driven tool pages (map + external API) when attribution sits directly under the title.
 * Pair with {@link pageDataSourceCredit}.
 */
export const pageTitleH1DataPage =
  styles.pageTitleH1DataPage

/**
 * Primary data-source attribution block (eBird, Strava, OSM, etc.) placed **below** the H1.
 */
export const pageDataSourceCredit =
  styles.pageDataSourceCredit

/** Links inside {@link pageDataSourceCredit} (uses design tokens for link color). */
export const pageDataSourceLink =
  styles.pageDataSourceLink

export const pageExcerpt =
  styles.pageExcerpt

export const pageContent = styles.pageContent

/** Wrapper around Portable Text body (inherits into blocks when using pageBodyTypography). */
export const pageBodyTypography =
  styles.pageBodyTypography

/** Long-form helper copy (map blurb, table intro) at body scale with readable measure. */
export const pageBodyParagraph = styles.pageBodyParagraph

/** Section headings below the hero (Map, table, etc.). */
export const pageSectionHeading =
  styles.pageSectionHeading

/** Small line above the title (attribution, meta). */
export const pageKicker = styles.pageKicker

export const pageBodyGap = styles.pageBodyGap

export const pageBodyPlain = styles.pageBodyPlain

export const pageStackLoose = styles.pageStackLoose

export const stravaAdminLink = styles.stravaAdminLink

export const stravaAdminLinkMuted = styles.stravaAdminLinkMuted

export const calloutAmber = styles.calloutAmber

export const calloutError = styles.calloutError

export const calloutSuccess = styles.calloutSuccess

export const calloutDanger = styles.calloutDanger

export const inlineCode = styles.inlineCode

export const inlineCodeNeutral = styles.inlineCodeNeutral

export const strongDark = styles.strongDark
