import { groq } from 'next-sanity'

// Get all posts with authors and categories
export const postsQuery = groq`
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
      alt
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
        alt
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
export const postQuery = groq`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    mainImage {
      asset->{
        _id,
        url
      },
      alt
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
        alt
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
export const featuredPostsQuery = groq`
  *[_type == "post" && featured == true] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    mainImage {
      asset->{
        _id,
        url
      },
      alt
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
        alt
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
export const pagesQuery = groq`
  *[_type == "page"] | order(navigationOrder asc) {
    _id,
    title,
    slug,
    excerpt,
    mainImage {
      asset->{
        _id,
        url
      },
      alt
    },
    showInNavigation,
    navigationOrder
  }
`

// Get a single page by slug
export const pageQuery = groq`
  *[_type == "page" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    mainImage {
      asset->{
        _id,
        url
      },
      alt
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
      googleBooksId,
      publishedDate,
      publisher,
      pageCount,
      thumbnail,
      isbn
    },
    seo
  }
`

// Get navigation pages
export const navigationQuery = groq`
  *[_type == "page" && showInNavigation == true] | order(navigationOrder asc) {
    _id,
    title,
    slug
  }
`

// Get site settings
export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0] {
    title,
    description,
    logo {
      asset->{
        _id,
        url
      },
      alt
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
export const categoriesQuery = groq`
  *[_type == "category"] | order(title asc) {
    _id,
    title,
    slug,
    description,
    color
  }
`

// Get posts by category
export const postsByCategoryQuery = groq`
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
      alt
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
        alt
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
export const postsByAuthorQuery = groq`
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
      alt
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

export const authorQuery = groq`
  *[_type == "author" && slug.current == $slug][0] {
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

export const homepageQuery = groq`
  *[_type == "homepage"][0] {
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
      openGraphImage,
      keywords,
      noIndex
    }
  }
`
