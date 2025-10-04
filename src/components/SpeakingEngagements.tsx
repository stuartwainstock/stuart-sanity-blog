import Link from 'next/link'
import { SpeakingEngagement } from '@/lib/types'

interface SpeakingEngagementsProps {
  engagements: SpeakingEngagement[]
}

export default function SpeakingEngagements({ engagements }: SpeakingEngagementsProps) {
  if (!engagements || engagements.length === 0) {
    return null
  }

  // Sort engagements by date (newest first)
  const sortedEngagements = [...engagements].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    })
  }

  const getTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      speaking: 'Speaking',
      writing: 'Writing',
      interview: 'Interview',
      podcast: 'Podcast',
      workshop: 'Workshop',
      conference: 'Conference',
      blog: 'Blog',
      article: 'Article',
    }
    return typeLabels[type] || type
  }

  return (
    <section 
      className="mt-16"
      aria-labelledby="engagements-heading"
    >
      <h2 
        id="engagements-heading"
        className="text-2xl font-semibold mb-8 text-gray-900 leading-tight"
      >
        Speaking & Writing
      </h2>
      
      <div 
        className="space-y-6"
        role="list"
        aria-label="Speaking engagements and publications"
      >
        {sortedEngagements.map((engagement, index) => {
          const engagementContent = (
            <div 
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3 border-b border-gray-200 last:border-b-0"
              role="listitem"
            >
              <div className="flex-1">
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {engagement.title}
                </h3>
                {engagement.description && (
                  <p className="text-lg text-gray-600 mb-3 leading-relaxed">
                    {engagement.description}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
                  <span className="inline-flex items-center font-medium">
                    <span className="sr-only">Type: </span>
                    {getTypeLabel(engagement.type)}
                  </span>
                  <span className="inline-flex items-center">
                    <span className="sr-only">Date: </span>
                    {formatDate(engagement.date)}
                  </span>
                </div>
              </div>
            </div>
          )

          return engagement.url ? (
            <Link
              key={engagement._key || index}
              href={engagement.url}
              className="block hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 rounded-md transition-colors"
              aria-label={`${engagement.title} - ${getTypeLabel(engagement.type)} - ${formatDate(engagement.date)}`}
            >
              {engagementContent}
            </Link>
          ) : (
            <div key={engagement._key || index}>
              {engagementContent}
            </div>
          )
        })}
      </div>
    </section>
  )
}
