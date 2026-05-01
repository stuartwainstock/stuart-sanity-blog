import React from 'react'
import {LaunchIcon} from '@sanity/icons'
import {Button, Card, Flex, Stack, Text, useToast} from '@sanity/ui'
import type {UrlInputProps} from 'sanity'
import {useFormValue} from 'sanity'

/**
 * Studio-only: shows an inline preview of the suggested Unsplash image URL so
 * editors do not need to copy the URL into a browser tab to verify the pick.
 */
export function SuggestedCoverImageUrlInput(props: UrlInputProps) {
  const {renderDefault, value} = props
  const toast = useToast()

  const docId = useFormValue(['_id']) as string | undefined
  const speciesName = useFormValue(['speciesName']) as string | undefined
  const imageSuggestionStatus = useFormValue(['imageSuggestionStatus']) as string | undefined
  const photoPage = useFormValue(['suggestedCoverImagePageUrl']) as string | undefined
  const photographerName = useFormValue(['suggestedCoverPhotographerName']) as string | undefined
  const photographerPage = useFormValue(['suggestedCoverPhotographerPageUrl']) as string | undefined

  const url = typeof value === 'string' && value.trim().length > 0 ? value.trim() : ''
  const canCallApi = Boolean(docId && !String(docId).startsWith('drafts.'))

  function suggestSecret(): string {
    const fromProcess =
      (typeof process !== 'undefined' &&
        process.env &&
        (process.env.SANITY_STUDIO_BIRDING_SUGGEST_SECRET ||
          process.env.NEXT_PUBLIC_BIRDING_SUGGEST_SECRET)) ||
      ''
    const p = typeof fromProcess === 'string' ? fromProcess.trim() : ''
    if (p) return p
    const metaEnv = (import.meta as any)?.env
    const fromMeta =
      (metaEnv?.SANITY_STUDIO_BIRDING_SUGGEST_SECRET ||
        metaEnv?.NEXT_PUBLIC_BIRDING_SUGGEST_SECRET ||
        '') as string
    return typeof fromMeta === 'string' ? fromMeta.trim() : ''
  }

  function apiUrl(): string {
    if (typeof window !== 'undefined') {
      const host = window.location?.hostname || ''
      if (host.endsWith('.sanity.studio')) {
        return 'https://www.stuartwainstock.com/api/birding/suggest-unsplash'
      }
    }
    return '/api/birding/suggest-unsplash'
  }

  async function run(mode: 'suggest' | 'regenerate') {
    if (!canCallApi) return
    const label = mode === 'regenerate' ? 'Next suggestion' : 'Suggest image'
    toast.push({status: 'info', title: `${label}…`})
    try {
      const headers: Record<string, string> = {'content-type': 'application/json'}
      const secret = suggestSecret()
      if (secret) headers['x-birding-suggest-secret'] = secret

      const res = await fetch(apiUrl(), {
        method: 'POST',
        headers,
        body: JSON.stringify({id: docId, mode}),
        credentials: 'omit',
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.push({
          status: 'error',
          title: json?.message || `Failed (${res.status})`,
        })
        return
      }
      toast.push({status: 'success', title: 'Suggestion updated.'})
    } catch (e) {
      toast.push({
        status: 'error',
        title: e instanceof Error ? e.message : 'Request failed.',
      })
    }
  }

  return (
    <Stack space={4}>
      {renderDefault(props)}
      <Card padding={3} radius={2} shadow={0} tone="transparent">
        <Stack space={3}>
          <Text size={1} muted>
            {url
              ? 'If this photo is wrong, fetch the next Unsplash result.'
              : 'No suggestion yet. Fetch one from Unsplash so you can review it here.'}
          </Text>
          <Flex gap={2} wrap="wrap">
            <Button
              mode="default"
              tone="primary"
              text={url ? 'Refresh suggestion' : 'Suggest image'}
              onClick={() => run('suggest')}
              disabled={!canCallApi}
            />
            <Button
              mode="default"
              tone="default"
              text="Next suggestion"
              onClick={() => run('regenerate')}
              disabled={!canCallApi || imageSuggestionStatus !== 'pending_review'}
            />
          </Flex>
          {!canCallApi ? (
            <Text size={1} muted>
              Suggestions run on published documents only (not drafts). Publish this sighting first, then retry.
            </Text>
          ) : null}
          {speciesName ? (
            <Text size={1} muted>
              Searching for: {speciesName}
            </Text>
          ) : null}
        </Stack>
      </Card>
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
