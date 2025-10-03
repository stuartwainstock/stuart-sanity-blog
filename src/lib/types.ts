export interface SanityImage {
  asset: {
    _id: string
    url: string
  }
  alt?: string
}

export interface SEO {
  metaTitle?: string
  metaDescription?: string
  openGraphImage?: SanityImage
  keywords?: string[]
  noIndex?: boolean
}

export interface Author {
  _id: string
  name: string
  slug: {
    current: string
  }
  image?: SanityImage
  bio?: any[]
  email?: string
  website?: string
  social?: {
    twitter?: string
    linkedin?: string
    github?: string
  }
}

export interface Category {
  _id: string
  title: string
  slug: {
    current: string
  }
  description?: string
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'pink' | 'gray'
}

export interface Post {
  _id: string
  title: string
  slug: {
    current: string
  }
  author?: Author
  mainImage?: SanityImage
  categories?: Category[]
  publishedAt: string
  excerpt?: string
  body?: any[]
  featured?: boolean
  seo?: SEO
}

export interface Page {
  _id: string
  title: string
  slug: {
    current: string
  }
  mainImage?: SanityImage
  excerpt?: string
  body?: any[]
  showInNavigation?: boolean
  navigationOrder?: number
  seo?: SEO
}

export interface SiteSettings {
  title: string
  description?: string
  logo?: SanityImage
  favicon?: SanityImage
  url?: string
  social?: {
    twitter?: string
    facebook?: string
    instagram?: string
    linkedin?: string
    github?: string
  }
  footer?: {
    copyright?: string
    links?: Array<{
      title: string
      url: string
    }>
  }
  seo?: SEO
}

export interface Homepage {
  _id: string
  title: string
  hero: {
    title: string
    subtitle?: string
    primaryButton?: {
      text: string
      url: string
    }
    secondaryButton?: {
      text: string
      url: string
    }
  }
  featuredSection: {
    title: string
    subtitle?: string
  }
  recentSection: {
    title: string
    subtitle?: string
  }
  ctaSection: {
    title: string
    subtitle?: string
    buttonText: string
    buttonUrl: string
  }
  seo?: SEO
}
