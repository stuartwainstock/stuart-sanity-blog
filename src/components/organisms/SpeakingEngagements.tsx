import Link from 'next/link'
import { SpeakingEngagement } from '@/lib/types'
import styles from './SpeakingEngagements.module.css'

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
      className={styles.section}
      aria-labelledby="engagements-heading"
    >
      <h2 
        id="engagements-heading"
        className={styles.heading}
      >
        Speaking & Writing
      </h2>
      
      <div 
        className={styles.list}
        aria-label="Speaking engagements and publications"
      >
        {sortedEngagements.map((engagement, index) => {
          const engagementContent = (
            <div 
              className={styles.row}
            >
              <div className={styles.content}>
                <h3 className={styles.itemTitle}>
                  {engagement.title}
                </h3>
                {engagement.description && (
                  <p className={styles.description}>
                    {engagement.description}
                  </p>
                )}
                <div className={styles.meta}>
                  <span className={styles.metaItem}>
                    <span className="sr-only">Type: </span>
                    {getTypeLabel(engagement.type)}
                  </span>
                  <span className={styles.metaItem}>
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
              className={styles.outerLink}
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

