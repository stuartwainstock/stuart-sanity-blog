import type {ReactNode} from 'react'
import {PortableText as BasePortableText, type PortableTextComponents} from '@portabletext/react'
import type {TypedObject} from '@portabletext/types'
import Image from 'next/image'
import { getImageUrl } from '@/lib/sanity'
import type {SanityImage} from '@/lib/types'

type PortableTextMarkLink = {href?: string}
type PortableTextImageValue = SanityImage
type PortableTextCodeValue = {language?: string; code?: string}

interface PortableTextProps {
  value: TypedObject[]
  className?: string
  /**
   * Omit Tailwind Typography `prose`; use `text-inherit` on blocks so a parent
   * with `pageBodyTypography` classes (see `@/lib/pageTypography`) controls size/weight.
   */
  pageBodyTypography?: boolean
}

function buildComponents(pageBody: boolean): PortableTextComponents {
  const normalClass = pageBody
    ? 'mb-6 text-inherit'
    : 'text-gray-700 mb-6 leading-relaxed'
  const listClass = pageBody
    ? 'list-disc list-inside mb-6 space-y-2 text-inherit'
    : 'list-disc list-inside mb-6 space-y-2 text-gray-700'
  const olClass = pageBody
    ? 'list-decimal list-inside mb-6 space-y-2 text-inherit'
    : 'list-decimal list-inside mb-6 space-y-2 text-gray-700'
  const blockquoteClass = pageBody
    ? 'border-l-4 border-blue-500 pl-6 my-8 italic text-inherit bg-gray-50 py-4'
    : 'border-l-4 border-blue-500 pl-6 my-8 italic text-gray-600 bg-gray-50 py-4'

  return {
  types: {
    image: ({value}: {value: PortableTextImageValue}) => (
      <div className="my-8">
        <Image
          src={getImageUrl(value, 800, 600)}
          alt={value.alt || 'Blog image'}
          width={800}
          height={600}
          className="rounded-lg"
        />
        {value.caption && (
          <p className="text-sm text-gray-600 text-center mt-2 italic">
            {value.caption}
          </p>
        )}
        {value.credit && (
          <p className="text-xs text-gray-700 text-center mt-1">
            Photo by {value.credit}
          </p>
        )}
      </div>
    ),
    codeBlock: ({value}: {value: PortableTextCodeValue}) => (
      <div className="my-8">
        <pre 
          className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto"
          role="region"
          aria-label={`Code block: ${value.language || 'text'}`}
          tabIndex={0}
        >
          <code className={`language-${value.language || 'text'}`}>
            {value.code || ''}
          </code>
        </pre>
      </div>
    ),
  },
  block: {
    h1: ({children}: {children?: ReactNode}) => (
      <h1 className="text-4xl font-bold text-gray-900 mt-12 mb-6 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({children}: {children?: ReactNode}) => (
      <h2 className="text-3xl font-bold text-gray-900 mt-10 mb-5 first:mt-0">
        {children}
      </h2>
    ),
    h3: ({children}: {children?: ReactNode}) => (
      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4 first:mt-0">
        {children}
      </h3>
    ),
    h4: ({children}: {children?: ReactNode}) => (
      <h4 className="text-xl font-bold text-gray-900 mt-6 mb-3 first:mt-0">
        {children}
      </h4>
    ),
    normal: ({children}: {children?: ReactNode}) => (
      <p className={normalClass}>
        {children}
      </p>
    ),
    blockquote: ({children}: {children?: ReactNode}) => (
      <blockquote className={blockquoteClass}>
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({children}: {children?: ReactNode}) => (
      <ul className={listClass}>
        {children}
      </ul>
    ),
    number: ({children}: {children?: ReactNode}) => (
      <ol className={olClass}>
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({children}: {children?: ReactNode}) => <li>{children}</li>,
    number: ({children}: {children?: ReactNode}) => <li>{children}</li>,
  },
  marks: {
    strong: ({children}: {children?: ReactNode}) => (
      <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    em: ({children}: {children?: ReactNode}) => (
      <em className="italic">{children}</em>
    ),
    code: ({children}: {children?: ReactNode}) => (
      <code className="bg-gray-100 text-gray-900 px-2 py-1 rounded text-sm font-mono">
        {children}
      </code>
    ),
    link: ({children, value}: {children?: ReactNode; value?: PortableTextMarkLink}) => {
      const href = typeof value?.href === 'string' ? value.href : ''
      const isExternal = href.startsWith('http')
      return (
        <a
          href={href}
          className="text-blue-800 hover:text-blue-900 underline"
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
        >
          {children}
          {isExternal ? <span className="sr-only"> (opens in new tab)</span> : null}
        </a>
      )
    },
  },
}
}

const defaultComponents = buildComponents(false)
const pageBodyComponents = buildComponents(true)

export default function PortableText({
  value,
  className = '',
  pageBodyTypography: pageBody = false,
}: PortableTextProps) {
  const components = pageBody ? pageBodyComponents : defaultComponents
  const wrapper = pageBody
    ? `max-w-none ${className}`.trim()
    : `prose prose-lg max-w-none ${className}`.trim()
  return (
    <div className={wrapper}>
      <BasePortableText value={value} components={components} />
    </div>
  )
}


