import Link from 'next/link'
import { Resource } from '@/lib/types'

interface ReadingListProps {
  resources: Resource[]
}

export default function ReadingList({ resources }: ReadingListProps) {
  if (!resources || resources.length === 0) {
    return null
  }

  const getMediaLabel = (mediaType: string) => {
    const labels: Record<string, string> = {
      article: 'Articles',
      book: 'Books',
      video: 'Videos',
      podcast: 'Podcasts',
      tool: 'Tools',
      other: 'Other',
    }
    return labels[mediaType] || mediaType
  }

  const groupedResources = resources.reduce((acc, resource) => {
    const mediaType = resource.mediaType || 'other'
    if (!acc[mediaType]) {
      acc[mediaType] = []
    }
    acc[mediaType].push(resource)
    return acc
  }, {} as Record<string, Resource[]>)

  const sortedMediaTypes = Object.keys(groupedResources).sort()

  return (
    <section 
      className="mt-16"
      aria-labelledby="reading-list-content"
    >
      <div 
        id="reading-list-content"
        className="space-y-12"
      >
        {sortedMediaTypes.map((mediaType) => (
          <div key={mediaType} className="space-y-4">
            <h3 
              className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2"
              id={`media-type-${mediaType}`}
            >
              {getMediaLabel(mediaType)}
            </h3>
            
            <div 
              className="space-y-4"
              aria-labelledby={`media-type-${mediaType}`}
              aria-label={`Resources in ${getMediaLabel(mediaType)} group`}
            >
              {groupedResources[mediaType].map((resource) => {
                const resourceContent = (
                  <div 
                    className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/30 transition-colors rounded-md px-2 -mx-2"
                  >
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900 mb-1 leading-tight">
                        {resource.title}
                      </h4>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-1">
                        {resource.sourceDomain && (
                          <span className="bg-gray-100 px-2 py-1 rounded-md">{resource.sourceDomain}</span>
                        )}
                        <span className="bg-gray-100 px-2 py-1 rounded-md capitalize">{resource.mediaType}</span>
                        {resource.addedDate && (
                          <span className="bg-gray-100 px-2 py-1 rounded-md">
                            {new Date(resource.addedDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                        {resource.tags && resource.tags.length > 0 && (
                          <span className="bg-gray-100 px-2 py-1 rounded-md">
                            {resource.tags.slice(0, 2).join(', ')}
                          </span>
                        )}
                      </div>
                      {resource.summary && (
                        <p className="text-base text-gray-600 leading-relaxed">
                          {resource.summary}
                        </p>
                      )}
                    </div>
                  </div>
                )

                return resource.url ? (
                  <Link
                    key={resource._id}
                    href={resource.url}
                    className="block focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 rounded-lg transition-all duration-200"
                    aria-label={`${resource.title} - ${getMediaLabel(resource.mediaType)}`}
                  >
                    {resourceContent}
                  </Link>
                ) : (
                  <div key={resource._id}>
                    {resourceContent}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
