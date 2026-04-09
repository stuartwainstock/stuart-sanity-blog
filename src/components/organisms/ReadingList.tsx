import ResourceGroup from '@/components/molecules/ResourceGroup'
import {getMediaTypeLabel} from '@/lib/resources/labels'
import type {Resource} from '@/lib/types'

interface ReadingListProps {
  resources: Resource[]
}

export default function ReadingList({resources}: ReadingListProps) {
  if (!resources || resources.length === 0) {
    return null
  }

  const groupedResources = resources.reduce(
    (acc, resource) => {
      const mediaType = resource.mediaType || 'other'
      if (!acc[mediaType]) {
        acc[mediaType] = []
      }
      acc[mediaType].push(resource)
      return acc
    },
    {} as Record<string, Resource[]>,
  )

  const sortedMediaTypes = Object.keys(groupedResources).sort()

  return (
    <section className="mt-16" aria-labelledby="reading-list-content">
      <div id="reading-list-content" className="space-y-12">
        {sortedMediaTypes.map((mediaType) => (
          <ResourceGroup
            key={mediaType}
            mediaType={mediaType}
            groupLabel={getMediaTypeLabel(mediaType)}
            resources={groupedResources[mediaType]}
          />
        ))}
      </div>
    </section>
  )
}
