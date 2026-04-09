import type {TypedObject} from '@portabletext/types'
import type {PortableTextBlock} from '@portabletext/types'

export const portableTextBasic: PortableTextBlock[] = [
  {
    _type: 'block',
    style: 'normal',
    _key: 'p1',
    children: [
      {
        _type: 'span',
        _key: 's1',
        text: 'This is Portable Text rendered with your site defaults.',
        marks: [],
      },
    ],
    markDefs: [],
  },
  {
    _type: 'block',
    style: 'h2',
    _key: 'h2',
    children: [{_type: 'span', _key: 's2', text: 'Section heading', marks: []}],
    markDefs: [],
  },
  {
    _type: 'block',
    style: 'normal',
    _key: 'p2',
    children: [
      {
        _type: 'span',
        _key: 's3',
        text: 'A paragraph with a link.',
        marks: ['m1'],
      },
    ],
    markDefs: [{_type: 'link', _key: 'm1', href: 'https://example.com'}],
  },
  {
    _type: 'block',
    style: 'normal',
    _key: 'p3',
    children: [{_type: 'span', _key: 's4', text: 'Bullet list:', marks: []}],
    markDefs: [],
  },
  {
    _type: 'block',
    style: 'normal',
    _key: 'li1',
    listItem: 'bullet',
    level: 1,
    children: [{_type: 'span', _key: 's5', text: 'First item', marks: []}],
    markDefs: [],
  },
  {
    _type: 'block',
    style: 'normal',
    _key: 'li2',
    listItem: 'bullet',
    level: 1,
    children: [{_type: 'span', _key: 's6', text: 'Second item', marks: []}],
    markDefs: [],
  },
]

export const portableTextWithImage: TypedObject[] = [
  ...portableTextBasic,
  {
    _type: 'image',
    _key: 'img1',
    asset: {
      _id: 'image-fixture',
      url: 'https://via.placeholder.com/1200x630.png?text=PortableText+Image',
    },
    alt: 'Fixture image',
    caption: 'Image caption',
    credit: 'Photo credit',
  } as unknown as TypedObject,
]

