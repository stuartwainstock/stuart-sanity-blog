import type {Post} from '@/lib/types'

export const basePost: Post = {
  _id: 'post-1',
  title: 'Designing for real people',
  slug: {current: 'designing-for-real-people'},
  publishedAt: '2026-01-15T12:00:00.000Z',
  excerpt: 'A short excerpt that should clamp to three lines in the card layout.',
  author: {
    _id: 'author-1',
    name: 'Stuart',
    slug: {current: 'stuart'},
  },
  categories: [
    {_id: 'cat-1', title: 'Design', slug: {current: 'design'}, color: 'blue'},
    {_id: 'cat-2', title: 'Product', slug: {current: 'product'}, color: 'gray'},
  ],
}

export const featuredPost: Post = {
  ...basePost,
  _id: 'post-2',
  title: 'Featured: Systems thinking in practice',
  slug: {current: 'featured-systems-thinking'},
  excerpt:
    'A longer excerpt used to validate typography, spacing, and clamping in the featured layout. It should still feel readable and balanced.',
  mainImage: {
    asset: {_id: 'image-1', url: 'https://via.placeholder.com/1200x630.png?text=Hero+Image'},
    alt: 'Placeholder hero image',
    credit: 'Placeholder',
  },
}

