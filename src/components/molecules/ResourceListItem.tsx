import Link from 'next/link'
import ResourceMetaChips from '@/components/molecules/ResourceMetaChips'
import {getMediaTypeLabel} from '@/lib/resources/labels'
import type {Resource} from '@/lib/types'
import styles from './ResourceListItem.module.css'

export type ResourceListItemProps = {
  resource: Resource
}

export default function ResourceListItem({resource}: ResourceListItemProps) {
  const mediaLabel = getMediaTypeLabel(resource.mediaType)

  const inner = (
    <div className={styles.row}>
      <div className={styles.content}>
        <h4 className={styles.title}>{resource.title}</h4>
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
