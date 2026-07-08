import Link from 'next/link'
import ResourceMetaChips from '@/components/molecules/ResourceMetaChips'
import {getMediaTypeLabel} from '@/lib/resources/labels'
import type {Resource} from '@/lib/types'
import styles from './ResourceListItem.module.css'

export type ResourceListItemProps = {
  resource: Resource
  /** Item title heading level; default h3 under a section h2. */
  titleAs?: 'h2' | 'h3' | 'h4'
}

export default function ResourceListItem({resource, titleAs: TitleTag = 'h3'}: ResourceListItemProps) {
  const mediaLabel = getMediaTypeLabel(resource.mediaType)

  const inner = (
    <div className={styles.row}>
      <div className={styles.content}>
        <TitleTag className={styles.title}>{resource.title}</TitleTag>
        <ResourceMetaChips resource={resource} />
        {resource.summary ? (
          <p className={styles.summary}>{resource.summary}</p>
        ) : null}
      </div>
    </div>
  )

  if (resource.url) {
    return (
      <Link
        href={resource.url}
        className={styles.outerLink}
        aria-label={`${resource.title} - ${mediaLabel}`}
      >
        {inner}
      </Link>
    )
  }

  return <div>{inner}</div>
}
