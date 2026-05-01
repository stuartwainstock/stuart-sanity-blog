import {LaunchIcon} from '@sanity/icons'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import type {UrlInputProps} from 'sanity'
import {useFormValue} from 'sanity'

/**
 * Studio-only: shows an inline preview of the suggested Unsplash image URL so
 * editors do not need to copy the URL into a browser tab to verify the pick.
 */
export function SuggestedCoverImageUrlInput(props: UrlInputProps) {
  const {renderDefault, value} = props
  const photoPage = useFormValue(['suggestedCoverImagePageUrl']) as string | undefined
  const photographerName = useFormValue(['suggestedCoverPhotographerName']) as string | undefined
  const photographerPage = useFormValue(['suggestedCoverPhotographerPageUrl']) as string | undefined

  const url = typeof value === 'string' && value.trim().length > 0 ? value.trim() : ''

  return (
    <Stack space={4}>
      {renderDefault(props)}
      {url ? (
        <Card padding={3} radius={2} shadow={1} tone="default">
          <Stack space={3}>
            <Text size={1} weight="semibold">
              Preview (verify species match before adding Card image)
            </Text>
            {/* Plain img: Studio bundle; external Unsplash CDN URL is intentional here. */}
            <img
              src={url}
              alt=""
              width={640}
              height={360}
              style={{
                display: 'block',
                width: '100%',
                maxHeight: 280,
                height: 'auto',
                objectFit: 'cover',
                borderRadius: 4,
              }}
            />
            <Flex gap={3} wrap="wrap" align="center">
              {photoPage ? (
                <Text size={1}>
                  <a href={photoPage} target="_blank" rel="noreferrer">
                    <LaunchIcon style={{verticalAlign: 'text-bottom', marginRight: 6}} />
                    Open on Unsplash
                  </a>
                </Text>
              ) : null}
              {photographerName && photographerPage ? (
                <Text size={1}>
                  Photo by{' '}
                  <a href={photographerPage} target="_blank" rel="noreferrer">
                    {photographerName}
                  </a>{' '}
                  / Unsplash
                </Text>
              ) : null}
            </Flex>
          </Stack>
        </Card>
      ) : null}
    </Stack>
  )
}
