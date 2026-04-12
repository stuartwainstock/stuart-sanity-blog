/** Shared layout + type scale for CMS pages (e.g. About) and matching static pages. */
export const pageShellBg = 'min-h-screen bg-[#e8e8e8]'

export const pageBanner = 'pt-24 pb-4 px-8'

export const pageInner = 'max-w-5xl mx-auto'

export const pageTitleH1 =
  'text-4xl font-semibold mb-12 text-gray-900 leading-tight'

/**
 * H1 on data-driven tool pages (map + external API) when attribution sits directly under the title.
 * Pair with {@link pageDataSourceCredit}.
 */
export const pageTitleH1DataPage =
  'text-4xl font-semibold mb-4 text-gray-900 leading-tight'

/**
 * Primary data-source attribution block (eBird, Strava, OSM, etc.) placed **below** the H1.
 */
export const pageDataSourceCredit =
  'text-sm text-gray-600 mb-10 max-w-4xl space-y-2'

/** Links inside {@link pageDataSourceCredit} (uses design tokens for link color). */
export const pageDataSourceLink =
  'text-[var(--color-link)] underline underline-offset-2 hover:text-[var(--color-link-hover)]'

export const pageExcerpt =
  'text-[30px] font-light tracking-[2px] leading-[1.6] mb-2 text-gray-600 max-w-4xl'

export const pageContent = 'max-w-5xl mx-auto px-8 pt-2 pb-16'

/** Wrapper around Portable Text body (inherits into blocks when using pageBodyTypography). */
export const pageBodyTypography =
  'text-[30px] font-light tracking-[2px] leading-[1.6] text-gray-600'

/** Long-form helper copy (map blurb, table intro) at body scale with readable measure. */
export const pageBodyParagraph = `${pageBodyTypography} max-w-4xl`

/** Section headings below the hero (Map, table, etc.). */
export const pageSectionHeading =
  'text-3xl font-bold text-gray-900 mt-10 mb-5'

/** Small line above the title (attribution, meta). */
export const pageKicker = 'text-sm text-gray-600 mb-4'
