import { groq } from 'next-sanity'

const creditedImageAssetProjection = `
  _id,
  url,
  creditLine,
  source
`

const creditedImageValueProjection = `
  asset->{
    ${creditedImageAssetProjection}
  },
  alt,
  caption,
  credit
`

const postMainImageProjection = `
  mainImage {
    ${creditedImageValueProjection}
  }
`

const blockContentBodyProjection = `
  body[]{
    _type,
    _key,
    style,
    listItem,
    level,
    children[]{
      _type,
      _key,
      text,
      marks
    },
    markDefs[]{
      _key,
      _type,
      href
    },
    asset->{
      ${creditedImageAssetProjection},
      metadata {
        dimensions {
          width,
          height,
          aspectRatio
        }
      }
    },
    hotspot,
    crop,
    alt,
    caption,
    credit,
    language,
    code,
    url,
    title
  }
`

// Get all posts with authors and categories
export const POSTS_QUERY = groq`
  *[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    ${postMainImageProjection},
    publishedAt,
    featured,
    author->{
      _id,
      name,
      slug,
      image {
        asset->{
          ${creditedImageAssetProjection}
        },
        alt,
        credit
      }
    },
    categories[]->{
      _id,
      title,
      slug,
      color
    }
  }
`

// Get a single post by slug
export const POST_QUERY = groq`
  *[
    _type == "post"
    && slug.current == $slug
  ][0]{
    _id,
    title,
    slug,
    excerpt,
    ${postMainImageProjection},
    publishedAt,
    featured,
    ${blockContentBodyProjection},
    author->{
      _id,
      name,
      slug,
      bio,
      image {
        asset->{
          ${creditedImageAssetProjection}
        },
        alt,
        credit
      },
      social
    },
    categories[]->{
      _id,
      title,
      slug,
      color,
      description
    },
    seo
  }
`

// Get featured posts (featured is boolean in schema; migrate legacy string values in dataset)
export const FEATURED_POSTS_QUERY = groq`
  *[
    _type == "post"
    && featured == true
  ] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    ${postMainImageProjection},
    publishedAt,
    author->{
      _id,
      name,
      slug,
      image {
        asset->{
          ${creditedImageAssetProjection}
        },
        alt,
        credit
      }
    },
    categories[]->{
      _id,
      title,
      slug,
      color
    }
  }
`

// Get all pages
export const PAGES_QUERY = groq`
  *[
    _type == "page"
  ] | order(navigationOrder asc) {
    _id,
    title,
    slug,
    excerpt,
    ${postMainImageProjection},
    showInNavigation,
    navigationOrder
  }
`

// Get a single page by slug
export const PAGE_QUERY = groq`
  *[
    _type == "page"
    && slug.current == $slug
  ][0]{
    _id,
    title,
    slug,
    excerpt,
    ${postMainImageProjection},
    ${blockContentBodyProjection},
    showInNavigation,
    navigationOrder,
    speakingEngagements[] {
      _key,
      title,
      date,
      type,
      url,
      description
    },
    seo
  }
`

// Get navigation pages
export const NAVIGATION_QUERY = groq`
  *[
    _type == "page"
    && (showInNavigation == "true" || showInNavigation == true)
  ] | order(navigationOrder asc) {
    _id,
    title,
    slug
  }
`

const contentHubProjection = `
  label,
  href,
  hubTitle,
  hubIntroduction,
  showInNavigation,
  navigationOrder,
  seo {
    metaTitle,
    metaDescription,
    openGraphImage {
      ${creditedImageValueProjection}
    },
    keywords,
    noIndex
  }
`

const hubLinkItemProjection = `
  _key,
  title,
  href,
  summary,
  coverImage {
    ${creditedImageValueProjection}
  }
`

// Get site settings
export const SITE_SETTINGS_QUERY = groq`
  *[_type == "siteSettings"][0] {
    title,
    description,
    journalDescription,
    logo {
      ${creditedImageValueProjection}
    },
    favicon {
      asset->{
        _id,
        url
      }
    },
    url,
    social,
    projectsMenu {
      ${contentHubProjection},
      items[] {
        ${hubLinkItemProjection}
      }
    },
    caseStudiesHub {
      ${contentHubProjection}
    },
    footer {
      copyright,
      sections[] {
        title,
        links[] {
          title,
          url,
          external
        }
      }
    },
    seo
  }
`

/** Lab hub page — projectsMenu hub fields + curated child links. */
export const LAB_HUB_QUERY = groq`
  *[_type == "siteSettings"][0].projectsMenu {
    ${contentHubProjection},
    items[] {
      ${hubLinkItemProjection}
    }
  }
`

/** Case studies hub page — hub copy from site settings. */
export const CASE_STUDIES_HUB_QUERY = groq`
  *[_type == "siteSettings"][0].caseStudiesHub {
    ${contentHubProjection}
  }
`

// Get all categories
export const CATEGORIES_QUERY = groq`
  *[_type == "category"] | order(title asc) {
    _id,
    title,
    slug,
    description,
    color
  }
`

// Get posts by category
export const POSTS_BY_CATEGORY_QUERY = groq`
  *[_type == "post" && references(*[_type == "category" && slug.current == $slug]._id)] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    mainImage {
      asset->{
        _id,
        url
      },
      alt,
      caption,
      credit
    },
    publishedAt,
    author->{
      _id,
      name,
      slug,
      image {
        asset->{
          ${creditedImageAssetProjection}
        },
        alt,
        credit
      }
    },
    categories[]->{
      _id,
      title,
      slug,
      color
    }
  }
`

// Get all authors
export const authorsQuery = groq`
  *[_type == "author"] | order(name asc) {
    _id,
    name,
    slug,
    bio,
    image {
      asset->{
        _id,
        url
      },
      alt
    },
    social
  }
`

// Get posts by author
export const POSTS_BY_AUTHOR_QUERY = groq`
  *[_type == "post" && author._ref == *[_type == "author" && slug.current == $slug][0]._id] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    mainImage {
      asset->{
        _id,
        url
      },
      alt,
      caption,
      credit
    },
    publishedAt,
    categories[]->{
      _id,
      title,
      slug,
      color
    }
  }
`

export const AUTHOR_QUERY = groq`
  *[
    _type == "author"
    && slug.current == $slug
  ][0]{
    _id,
    name,
    slug,
    image,
    bio,
    email,
    website,
    social {
      twitter,
      linkedin,
      github
    }
  }
`

export const HOMEPAGE_QUERY = groq`
  *[
    _type == "homepage"
  ][0]{
    _id,
    title,
    hero {
      title,
      subtitle,
      primaryButton {
        text,
        url
      },
      secondaryButton {
        text,
        url
      }
    },
    seo {
      metaTitle,
      metaDescription,
      openGraphImage {
        ${creditedImageValueProjection}
      },
      keywords,
      noIndex
    }
  }
`

/** Flights — /flights (TripIt) (document ID fixed in Studio structure). */
export const TOOL_PROJECT_PAGE_FLIGHTS_QUERY = groq`
  *[_type == "toolProjectPage" && _id == "toolProjectPage-flights"][0]{
    _id,
    projectKey,
    pageTitle,
    heroIntroduction,
    mapSectionTitle,
    mapSectionIntroduction,
    tableSectionTitle,
    tableSectionIntroduction,
    seo {
      metaTitle,
      metaDescription,
      openGraphImage {
        ${creditedImageValueProjection}
      },
      keywords,
      noIndex
    },
  }
`

/** Strava /runs singleton — document ID fixed in Studio structure. */
export const TOOL_PROJECT_PAGE_RUNS_QUERY = groq`
  *[_type == "toolProjectPage" && _id == "toolProjectPage-runs"][0]{
    _id,
    projectKey,
    pageTitle,
    heroIntroduction,
    mapSectionTitle,
    mapSectionIntroduction,
    tableSectionTitle,
    tableSectionIntroduction,
    seo {
      metaTitle,
      metaDescription,
      openGraphImage {
        ${creditedImageValueProjection}
      },
      keywords,
      noIndex
    },
  }
`

/** Birding Dashboard — /birding-dashboard (document ID fixed in Studio structure). */
export const TOOL_PROJECT_PAGE_BIRDING_QUERY = groq`
  *[_type == "toolProjectPage" && _id == "toolProjectPage-birding-dashboard"][0]{
    _id,
    projectKey,
    pageTitle,
    heroIntroduction,
    birdingSightingsTitle,
    birdingSightingsIntroduction,
    seo {
      metaTitle,
      metaDescription,
      openGraphImage {
        ${creditedImageValueProjection}
      },
      keywords,
      noIndex
    },
  }
`

/** Type Emotions — /type-emotions page chrome (document ID fixed in Studio structure). */
export const TOOL_PROJECT_PAGE_TYPE_EMOTIONS_QUERY = groq`
  *[_type == "toolProjectPage" && _id == "toolProjectPage-type-emotions"][0]{
    _id,
    projectKey,
    pageTitle,
    heroIntroduction,
    seo {
      metaTitle,
      metaDescription,
      openGraphImage {
        ${creditedImageValueProjection}
      },
      keywords,
      noIndex
    },
  }
`

/** Variable font faces for Type Emotions (axis metadata; loading stays in fonts.ts). */
export const TYPE_EMOTION_FONT_FACES_QUERY = groq`
  *[_type == "variableFontFace"] | order(label asc){
    _id,
    key,
    label,
    cssVar,
    fallback,
    category,
    italicSupport,
    axes[]{
      tag,
      label,
      min,
      max,
      step,
      "default": default,
      group
    }
  }
`

/** Coolors specimen palettes for Type Emotions. */
export const TYPE_EMOTION_PALETTES_QUERY = groq`
  *[_type == "specimenPalette"] | order(label asc){
    _id,
    key,
    label,
    sourceUrl,
    swatches,
    roles,
    intensityHigh,
    intensityMax
  }
`

/** Emotion catalog for Type Emotions playground. */
export const TYPE_EMOTIONS_QUERY = groq`
  *[_type == "typeEmotion"] | order(label asc){
    _id,
    "emotionId": emotionId.current,
    label,
    synonyms,
    "fontKey": fontFace[0]->key,
    "alternateFontKeys": alternateFontFaces[]->key,
    coordinate[]{
      tag,
      value
    },
    intense[]{
      tag,
      value
    },
    italic,
    transform,
    "paletteKey": palette[0]->key,
    surface,
    specimenWord,
    reason
  }
`

export const EBIRD_BIRDING_QUERY = groq`
  *[_type == "ebirdBirding" && _id == "ebirdBirding"][0]{
    _id,
    mapPageTitle,
    mapPageIntroduction,
    mapSectionTitle,
    sightingsSectionTitle,
    sightingsIntroduction,
    mapDataSource,
    hotspotCodes,
    regionCode,
    focusSpeciesCode,
    focusSpeciesCommonName,
    recentDaysBack,
    maxObservationsToFetch,
    defaultMapLatitude,
    defaultMapLongitude,
    defaultMapZoom,
    seoMap {
      metaTitle,
      metaDescription,
      openGraphImage {
        ${creditedImageValueProjection}
      },
      keywords,
      noIndex
    },
  }
`

/** Birding Dashboard sync scope singleton — controls /birding-dashboard sync. */
export const EBIRD_DASHBOARD_QUERY = groq`
  *[_type == "ebirdDashboard" && _id == "ebirdDashboard"][0]{
    _id,
    mapDataSource,
    hotspotCodes,
    regionCode,
    recentDaysBack,
    maxObservationsToFetch,
  }
`

// ── Birding Dashboard ─────────────────────────────────────────────────────────

/** All bird sightings for the /birding-dashboard page, newest first. */
export const BIRD_SIGHTINGS_QUERY = groq`
  *[
    _type == "birdSighting"
  ] | order(observedOn desc) {
    _id,
    speciesName,
    speciesCode,
    observedOn,
    locationLabel,
    altText,
    plumageColors,
    callAudioUrl,
    ebirdChecklistUri,
    latitude,
    longitude,
    cardImage {
      asset->{
        _id,
        url
      },
      alt
    },
    cardImageAlt,
    imageSuggestionStatus,
    suggestedCoverProvider,
    suggestedCoverImageUrl,
    suggestedCoverImagePageUrl,
    suggestedCoverPhotographerName,
    suggestedCoverPhotographerPageUrl,
    suggestedCoverAltDraft,
    suggestedAudioRecordist,
    suggestedAudioSourceUrl
  }
`

/** Paginated bird sightings for /birding-dashboard (newest first). */
export const BIRD_SIGHTINGS_PAGE_QUERY = groq`
  *[
    _type == "birdSighting"
  ] | order(observedOn desc) [$start...$end] {
    _id,
    speciesName,
    speciesCode,
    observedOn,
    locationLabel,
    altText,
    plumageColors,
    callAudioUrl,
    ebirdChecklistUri,
    latitude,
    longitude,
    cardImage {
      asset->{
        _id,
        url
      },
      alt
    },
    cardImageAlt,
    imageSuggestionStatus,
    suggestedCoverProvider,
    suggestedCoverImageUrl,
    suggestedCoverImagePageUrl,
    suggestedCoverPhotographerName,
    suggestedCoverPhotographerPageUrl,
    suggestedCoverAltDraft,
    suggestedAudioRecordist,
    suggestedAudioSourceUrl
  }
`

/** Total count of bird sightings (for pagination). */
export const BIRD_SIGHTINGS_COUNT_QUERY = groq`
  count(*[_type == "birdSighting"])
`

export const PUBLISHED_RESOURCES_QUERY = groq`
  *[
    _type == "resource" &&
    status == "published"
  ] | order(addedDate desc) {
    _id,
    title,
    url,
    summary,
    image,
    addedDate,
    mediaType,
    status,
    sourceDomain,
    normalizedUrl,
    tags
  }
`

// ── Case studies (password-protected PDFs) ─────────────────────────────────────
// Public listing/meta queries must never project PDF bytes or password material.
// Credentials + PDF objects live in private Supabase; the Next unlock/file routes
// read them server-side after the unlock cookie is verified.

/** Listing cards → /case-studies. No secrets, no PDF. */
export const CASE_STUDIES_QUERY = groq`
  *[
    _type == "caseStudy"
    && defined(slug.current)
  ] | order(coalesce(year, "") desc, title asc) {
    _id,
    title,
    slug,
    summary,
    client,
    role,
    year,
    coverImage {
      asset->{
        _id,
        url
      },
      alt,
      hotspot,
      crop
    }
  }
`

/** Gate page render → /case-studies/[slug]. Public copy only (no hash, no PDF URL). */
export const CASE_STUDY_META_QUERY = groq`
  *[
    _type == "caseStudy"
    && slug.current == $slug
  ][0]{
    _id,
    title,
    slug,
    summary,
    client,
    role,
    year,
    liveUrl,
    overview,
    coverImage {
      asset->{
        _id,
        url
      },
      alt,
      hotspot,
      crop
    },
    seo {
      metaTitle,
      metaDescription,
      openGraphImage {
        ${creditedImageValueProjection}
      },
      keywords,
      noIndex
    }
  }
`

/** @deprecated Password material moved to private Supabase — do not use. */
export const CASE_STUDY_ACCESS_QUERY = groq`
  *[
    _type == "caseStudy"
    && slug.current == $slug
  ][0]{
    "configured": access.configured
  }
`

/** @deprecated PDF bytes moved to private Supabase — do not use CDN URLs. */
export const CASE_STUDY_FILE_QUERY = groq`
  *[
    _type == "caseStudy"
    && slug.current == $slug
  ][0]{
    title,
    "slug": slug.current,
    "pdfConfigured": pdfProtection.configured,
    "originalFilename": pdfProtection.originalFilename
  }
`

// ── Sitemap ───────────────────────────────────────────────────────────────────
// Lightweight projections for /sitemap.xml. Exclude documents missing a slug or
// flagged noIndex so the sitemap only advertises indexable URLs.

/** Canonical site URL from site settings (drives sitemap + robots base URL). */
export const SITE_URL_QUERY = groq`
  *[_type == "siteSettings"][0].url
`

/** Indexable posts → /journal/[slug]. */
export const SITEMAP_POSTS_QUERY = groq`
  *[
    _type == "post"
    && defined(slug.current)
    && seo.noIndex != true
  ]{
    "slug": slug.current,
    _updatedAt
  }
`

/** Indexable pages → /[slug]. */
export const SITEMAP_PAGES_QUERY = groq`
  *[
    _type == "page"
    && defined(slug.current)
    && seo.noIndex != true
  ]{
    "slug": slug.current,
    _updatedAt
  }
`

/** Categories → /category/[slug]. */
export const SITEMAP_CATEGORIES_QUERY = groq`
  *[
    _type == "category"
    && defined(slug.current)
  ]{
    "slug": slug.current,
    _updatedAt
  }
`

/** Authors → /author/[slug]. */
export const SITEMAP_AUTHORS_QUERY = groq`
  *[
    _type == "author"
    && defined(slug.current)
  ]{
    "slug": slug.current,
    _updatedAt
  }
`

/** Indexable hub listing pages from site settings (Lab, Case studies, etc.). */
export const SITEMAP_HUBS_QUERY = groq`
  *[_type == "siteSettings"][0]{
    _updatedAt,
    "hubs": [
      projectsMenu{
        href,
        seo {
          noIndex
        }
      },
      caseStudiesHub{
        href,
        seo {
          noIndex
        }
      }
    ]
  }
`
