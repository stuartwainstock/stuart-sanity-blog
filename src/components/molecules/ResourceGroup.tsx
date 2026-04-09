import ListGroupHeading from '@/components/atoms/ListGroupHeading'
import ResourceListItem from '@/components/molecules/ResourceListItem'
import type {Resource} from '@/lib/types'

export type ResourceGroupProps = {
  mediaType: string
  groupLabel: string
  resources: Resource[]
}

export default function ResourceGroup({mediaType, groupLabel, resources}: ResourceGroupProps) {
  const headingId = `media-type-${mediaType}`

  return (
    <div className="space-y-4">
      <ListGroupHeading id={headingId}>{groupLabel}</ListGroupHeading>
      <div
        className="space-y-4"
        aria-labelledby={headingId}
        aria-label={`Resources in ${groupLabel} group`}
      >
        {resources.map((resource) => (
          <ResourceListItem key={resource._id} resource={resource} />
        ))}
      </div>
    </div>
  )
}
