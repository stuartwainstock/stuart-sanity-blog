import Chip from '@/components/atoms/Chip'
import type {Resource} from '@/lib/types'

export type ResourceMetaChipsProps = {
  resource: Pick<Resource, 'mediaType' | 'addedDate'> & {
    sourceDomain?: string
    tags?: string[]
  }
}

function formatAddedDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function ResourceMetaChips({resource}: ResourceMetaChipsProps) {
  return (
    <div className="flex flex-wrap gap-3 text-sm text-gray-700 mb-1">
      {resource.sourceDomain ? <Chip>{resource.sourceDomain}</Chip> : null}
      <Chip capitalize>{resource.mediaType}</Chip>
      {resource.addedDate ? <Chip>{formatAddedDate(resource.addedDate)}</Chip> : null}
      {resource.tags && resource.tags.length > 0 ? (
        <Chip>{resource.tags.slice(0, 2).join(', ')}</Chip>
      ) : null}
    </div>
  )
}
