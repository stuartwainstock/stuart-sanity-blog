import type {ReactNode} from 'react'
import {PortableText as BasePortableText, type PortableTextComponents} from '@portabletext/react'
import type {TypedObject} from '@portabletext/types'
import Image from 'next/image'
import { getImageUrl } from '@/lib/sanity'
import type {SanityImage} from '@/lib/types'
import {parseYouTubeVideoId, youtubeNocookieEmbedSrc} from '@/lib/youtube'
import styles from './PortableText.module.css'

type PortableTextMarkLink = {href?: string}
type PortableTextImageValue = SanityImage
type PortableTextCodeValue = {language?: string; code?: string}
type PortableTextYoutubeValue = {url?: string; title?: string; caption?: string}

interface PortableTextProps {
  value: TypedObject[]
  className?: string
  /**
   * When false, blocks avoid the global `.prose` wrapper; use inherited styles so a parent with
   * `pageBodyTypography` (see `@/lib/pageTypography`) controls size/weight.
   */
  pageBodyTypography?: boolean
}

function buildComponents(pageBody: boolean): PortableTextComponents {
  const normalClass = pageBody ? styles.normalPageBody : styles.normalDefault
  const ulClass = `${pageBody ? styles.listPageBody : styles.listDefault} ${styles.ulDisc}`
  const olClass = `${pageBody ? styles.listPageBody : styles.listDefault} ${styles.olDecimal}`
  const blockquoteClass = pageBody ? styles.blockquotePageBody : styles.blockquoteDefault

  return {
  types: {
    image: ({value}: {value: PortableTextImageValue}) => (
      <div className={styles.imageBlock}>
        <Image
          src={getImageUrl(value, 800, 600)}
          alt={value.alt || 'Blog image'}
          width={800}
          height={600}
          sizes="(min-width: 960px) 800px, 100vw"
          className={styles.image}
        />
        {value.caption && (
          <p className={styles.caption}>
            {value.caption}
          </p>
        )}
        {value.credit && (
          <p className={styles.credit}>
            Photo by {value.credit}
          </p>
        )}
      </div>
    ),
    codeBlock: ({value}: {value: PortableTextCodeValue}) => (
      <div className={styles.codeBlockWrap}>
        <pre 
          className={styles.codePre}
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
    youtube: ({value}: {value: PortableTextYoutubeValue}) => {
      const id = value.url ? parseYouTubeVideoId(value.url) : null
      if (!id) {
        return (
          <p className={styles.youtubeFallback}>
            {value.url ? (
              <>
                Could not embed this video.{' '}
                <a
                  href={value.url}
                  className={styles.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open on YouTube
                </a>
                <span className="sr-only"> (opens in new tab)</span>
              </>
            ) : (
              'Missing YouTube URL.'
            )}
          </p>
        )
      }
      const title = value.title?.trim() || 'YouTube video'
      return (
        <figure className={styles.youtubeBlock}>
          <div className={styles.youtubeAspect}>
            <iframe
              className={styles.youtubeIframe}
              src={youtubeNocookieEmbedSrc(id)}
              title={title}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          {value.caption ? (
            <figcaption className={styles.youtubeCaption}>{value.caption}</figcaption>
          ) : null}
        </figure>
      )
    },
  },
  block: {
    h1: ({children}: {children?: ReactNode}) => (
      <h1 className={styles.h1}>
        {children}
      </h1>
    ),
    h2: ({children}: {children?: ReactNode}) => (
      <h2 className={styles.h2}>
        {children}
      </h2>
    ),
    h3: ({children}: {children?: ReactNode}) => (
      <h3 className={styles.h3}>
        {children}
      </h3>
    ),
    h4: ({children}: {children?: ReactNode}) => (
      <h4 className={styles.h4}>
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
      <ul className={ulClass}>
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
      <strong className={styles.strong}>{children}</strong>
    ),
    em: ({children}: {children?: ReactNode}) => (
      <em className="italic">{children}</em>
    ),
    code: ({children}: {children?: ReactNode}) => (
      <code className={styles.inlineCode}>
        {children}
      </code>
    ),
    link: ({children, value}: {children?: ReactNode; value?: PortableTextMarkLink}) => {
      const href = typeof value?.href === 'string' ? value.href : ''
      const isExternal = href.startsWith('http')
      return (
        <a
          href={href}
          className={styles.link}
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
  const wrapper = `${styles.wrapper} ${className}`.trim()
  return (
    <div className={wrapper}>
      <BasePortableText value={value} components={components} />
    </div>
  )
}


