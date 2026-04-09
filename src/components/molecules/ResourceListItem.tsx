import Link from 'next/link'
import ResourceMetaChips from '@/components/molecules/ResourceMetaChips'
import {getMediaTypeLabel} from '@/lib/resources/labels'
import type {Resource} from '@/lib/types'

export type ResourceListItemProps = {
  resource: Resource
}

export default function ResourceListItem({resource}: ResourceListItemProps) {
  const mediaLabel = getMediaTypeLabel(resource.mediaType)

  const inner = (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/30 transition-colors rounded-md px-2 -mx-2">
      <div className="flex-1">
        <h4 className="text-lg font-medium text-gray-900 mb-1 leading-tight">{resource.title}</h4>
        <ResourceMetaChips resource={resource} />
        {resource.summary ? (
          <p className="text-base text-gray-800 leading-relaxed">{resource.summary}</p>
        ) : null}
      </div>
    </div>
  )

  if (resource.url) {
    return (
      <Link
        href={resource.url}
        className="block focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 rounded-lg transition-all duration-200"
        aria-label={`${resource.title} - ${mediaLabel}`}
      >
        {inner}
      </Link>
    )
  }

  return <div>{inner}</div>
}
