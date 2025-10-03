import { PortableText as BasePortableText } from '@portabletext/react'
import Image from 'next/image'
import { getImageUrl } from '@/lib/sanity'

interface PortableTextValue {
  _type: string
  [key: string]: unknown
}

interface PortableTextProps {
  value: PortableTextValue[]
  className?: string
}

const components = {
  types: {
    image: ({ value }: { value: PortableTextValue }) => (
      <div className="my-8">
        <Image
          src={getImageUrl(value, 800, 600)}
          alt={(value as any).alt || 'Blog image'}
          width={800}
          height={600}
          className="rounded-lg"
        />
        {(value as any).caption && (
          <p className="text-sm text-gray-600 text-center mt-2 italic">
            {(value as any).caption}
          </p>
        )}
      </div>
    ),
    codeBlock: ({ value }: { value: PortableTextValue }) => (
      <div className="my-8">
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code className={`language-${(value as any).language || 'text'}`}>
            {(value as any).code}
          </code>
        </pre>
      </div>
    ),
  },
  block: {
    h1: ({ children }: { children: React.ReactNode }) => (
      <h1 className="text-4xl font-bold text-gray-900 mt-12 mb-6 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }: { children: React.ReactNode }) => (
      <h2 className="text-3xl font-bold text-gray-900 mt-10 mb-5 first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }: { children: React.ReactNode }) => (
      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4 first:mt-0">
        {children}
      </h3>
    ),
    h4: ({ children }: { children: React.ReactNode }) => (
      <h4 className="text-xl font-bold text-gray-900 mt-6 mb-3 first:mt-0">
        {children}
      </h4>
    ),
    normal: ({ children }: { children: React.ReactNode }) => (
      <p className="text-gray-700 mb-6 leading-relaxed">
        {children}
      </p>
    ),
    blockquote: ({ children }: { children: React.ReactNode }) => (
      <blockquote className="border-l-4 border-blue-500 pl-6 my-8 italic text-gray-600 bg-gray-50 py-4">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: { children: React.ReactNode }) => (
      <ul className="list-disc list-inside mb-6 space-y-2 text-gray-700">
        {children}
      </ul>
    ),
    number: ({ children }: { children: React.ReactNode }) => (
      <ol className="list-decimal list-inside mb-6 space-y-2 text-gray-700">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
    number: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
  },
  marks: {
    strong: ({ children }: { children: React.ReactNode }) => (
      <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    em: ({ children }: { children: React.ReactNode }) => (
      <em className="italic">{children}</em>
    ),
    code: ({ children }: { children: React.ReactNode }) => (
      <code className="bg-gray-100 text-gray-900 px-2 py-1 rounded text-sm font-mono">
        {children}
      </code>
    ),
    link: ({ children, value }: { children: React.ReactNode; value: { href: string } }) => (
      <a
        href={value.href}
        className="text-blue-600 hover:text-blue-800 underline"
        target={value.href.startsWith('http') ? '_blank' : undefined}
        rel={value.href.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
  },
}

export default function PortableText({ value, className = '' }: PortableTextProps) {
  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      <BasePortableText value={value} components={components} />
    </div>
  )
}
