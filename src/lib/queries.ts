import { groq } from 'next-sanity'

// Get all posts with authors and categories
export const POSTS_QUERY = groq`
  *[_type == "post"] | order(publishedAt desc) {
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
    featured,
    author->{
      _id,
      name,
      slug,
      image {
        asset->{
          _id,
          url
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
    featured,
    body,
    author->{
      _id,
      name,
      slug,
      bio,
      image {
        asset->{
          _id,
          url
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

// Get featured posts
export const FEATURED_POSTS_QUERY = groq`
  *[
    _type == "post"
    && featured == "true"
  ] | order(publishedAt desc) {
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
          _id,
          url
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
    mainImage {
      asset->{
        _id,
        url
      },
      alt,
      caption,
      credit
    },
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
    mainImage {
      asset->{
        _id,
        url
      },
      alt,
      caption,
      credit
    },
    body,
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
    readingList[] {
      _key,
      title,
      author,
      category,
      url,
      description,
      isbn,
      publishedYear,
      publisher,
      coverId
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

// Get site settings
export const SITE_SETTINGS_QUERY = groq`
  *[_type == "siteSettings"][0] {
    title,
    description,
    journalDescription,
    logo {
      asset->{
        _id,
        url
      },
      alt,
      credit
    },
    favicon {
      asset->{
        _id,
        url
      }
    },
    url,
    social,
    footer,
    seo
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
          _id,
          url
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
        asset->{
          _id,
          url
        },
        alt,
        credit
      },
      keywords,
      noIndex
    }
  }
`
