/**
 * Site-wide heading hierarchy policy:
 * - Each page shell owns the only page-level h1 (HubPageHeader, PageHeroWithDataSource, article hero).
 * - Body content immediately below a page h1 starts at h2 (use baseHeadingLevel={2} on PortableText).
 * - Nested cards/items use h3+ only inside a parent section with a visible h2.
 * - Footer and utility labels use styled non-heading elements to avoid outline noise.
 */

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export type AuthoredHeadingLevel = 1 | 2 | 3 | 4

const MAX_HEADING_LEVEL = 6

/** Remap a CMS-authored heading level to sit below a page-level h1. */
export function remapHeadingLevel(
  authored: AuthoredHeadingLevel,
  baseHeadingLevel: HeadingLevel,
): HeadingLevel {
  const offset = baseHeadingLevel - 1
  return Math.min(authored + offset, MAX_HEADING_LEVEL) as HeadingLevel
}

export function headingTag(level: HeadingLevel): `h${HeadingLevel}` {
  return `h${level}`
}

/**
 * Representative public routes for Lighthouse and manual heading-outline checks
 * after hierarchy changes. Replace dynamic segments with a real slug when auditing.
 */
export const HEADING_VERIFICATION_ROUTES = [
  '/',
  '/journal',
  '/about',
  '/reading-list',
  '/runs',
  '/flights',
  '/pileated-watch',
  '/lab',
  '/case-studies',
] as const
