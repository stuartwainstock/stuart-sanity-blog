import type {Resource} from '@/lib/types'

export const resourcesFixture: Resource[] = [
  {
    _id: 'res-1',
    title: 'Great product writing',
    url: 'https://example.com/product-writing',
    summary: 'Notes on clarity, voice, and writing for interfaces.',
    addedDate: '2026-03-20T12:00:00.000Z',
    mediaType: 'article',
    status: 'published',
    sourceDomain: 'example.com',
    tags: ['writing', 'product'],
  },
  {
    _id: 'res-2',
    title: 'A design systems book',
    url: 'https://example.com/design-systems-book',
    summary: 'A book that explores tokens, components, and governance.',
    addedDate: '2026-02-01T12:00:00.000Z',
    mediaType: 'book',
    status: 'published',
    sourceDomain: 'example.com',
    tags: ['design-systems'],
  },
  {
    _id: 'res-3',
    title: 'A talk on maps and data',
    url: 'https://example.com/maps-talk',
    addedDate: '2026-01-05T12:00:00.000Z',
    mediaType: 'video',
    status: 'published',
    sourceDomain: 'example.com',
  },
]

