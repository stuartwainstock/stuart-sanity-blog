'use client'

import React, {useMemo, useState} from 'react'
import {LaunchIcon} from '@sanity/icons'
import {Button, Card, Flex, Stack, Text, useToast} from '@sanity/ui'
import type {StringInputProps} from 'sanity'
import {PatchEvent, set, useFormValue} from 'sanity'

// ── Types ─────────────────────────────────────────────────────────────────────

type ApiMode = 'suggest' | 'regenerate' | 'dismiss' | 'confirm'

type SuggestionPatch = Partial<{
  suggestedCoverProvider: 'none' | 'unsplash'
  suggestedCoverImageUrl: string | null
  suggestedCoverImagePageUrl: string | null
  suggestedCoverPhotographerName: string | null
  suggestedCoverPhotographerPageUrl: string | null
  suggestedCoverAltDraft: string | null
  suggestedCoverSearchQueryLast: string
  suggestedCoverSearchPage: number
  imageSuggestionStatus: 'none' | 'pending_review' | 'dismissed'
  cardImage: unknown
  cardImageAlt: string | null
}>

// ── Env helpers ───────────────────────────────────────────────────────────────

type ViteImportMeta = ImportMeta & {env?: Record<string, string | undefined>}

function getApiUrl(): string {
  const explicit =
    (typeof process !== 'undefined' &&
      process.env?.SANITY_STUDIO_BIRDING_SUGGEST_API_URL?.trim()) ||
    ''
  if (explicit) return explicit
  if (typeof window !== 'undefined' && window.location?.hostname?.endsWith('.sanity.studio')) {
    return 'https://www.stuartwainstock.com/api/birding/suggest-unsplash'
  }
  return '/api/birding/suggest-unsplash'
}

function getSecret(): string {
  const fromProcess =
    (typeof process !== 'undefined' &&
      process.env?.SANITY_STUDIO_BIRDING_SUGGEST_SECRET?.trim()) ||
    ''
  if (fromProcess) return fromProcess
  const meta = (import.meta as ViteImportMeta).env
  return meta?.SANITY_STUDIO_BIRDING_SUGGEST_SECRET?.trim() ?? ''
}

function ts(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Attribution({
  photographerName,
  photographerPage,
  photoPage,
}: {
  photographerName: string
  photographerPage: string
  photoPage: string
}) {
  if (!photographerName && !photoPage) return null
  return (
    <Text size={1} muted>
      {'Photo'}
      {photographerName ? (
        <>
          {' by '}
          {photographerPage ? (
            <a href={photographerPage} target="_blank" rel="noreferrer" style={{color: 'inherit'}}>
              {photographerName}
            </a>
          ) : (
            photographerName
          )}
        </>
      ) : null}
      {' on '}
      {photoPage ? (
        <a href={photoPage} target="_blank" rel="noreferrer" style={{color: 'inherit'}}>
          {'Unsplash '}
          <LaunchIcon style={{verticalAlign: 'text-bottom', fontSize: '0.9em'}} />
        </a>
      ) : (
        'Unsplash'
      )}
    </Text>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * Replaces the imageSuggestionStatus radio field in the Visual tab.
 * Three clear states: empty → pending review (photo + confirm/next/skip) → confirmed.
 * Never renders the raw workflow radio or any machine-written suggestedCover* fields.
 */
export function BirdSightingUnsplashSuggestionPanel(props: StringInputProps) {
  const {onChange} = props
  const toast = useToast()

  // Read document values for state and optimistic updates
  const docId = useFormValue(['_id']) as string | undefined
  const speciesName = ts(useFormValue(['speciesName']))
  const status = ts(useFormValue(['imageSuggestionStatus'])) || 'none'
  const urlFromDoc = ts(useFormValue(['suggestedCoverImageUrl']))
  const photoPageFromDoc = ts(useFormValue(['suggestedCoverImagePageUrl']))
  const photographerNameFromDoc = ts(useFormValue(['suggestedCoverPhotographerName']))
  const photographerPageFromDoc = ts(useFormValue(['suggestedCoverPhotographerPageUrl']))
  const altDraftFromDoc = ts(useFormValue(['suggestedCoverAltDraft']))
  const hasCardImage = Boolean(useFormValue(['cardImage', 'asset', '_ref']))

  const [busyMode, setBusyMode] = useState<ApiMode | null>(null)
  const [optimistic, setOptimistic] = useState<SuggestionPatch | null>(null)

  // Merge optimistic state over document values so the UI responds immediately
  const eff = useMemo(() => {
    const o = optimistic ?? {}
    return {
      url: ts(o.suggestedCoverImageUrl ?? urlFromDoc),
      photoPage: ts(o.suggestedCoverImagePageUrl ?? photoPageFromDoc),
      photographerName: ts(o.suggestedCoverPhotographerName ?? photographerNameFromDoc),
      photographerPage: ts(o.suggestedCoverPhotographerPageUrl ?? photographerPageFromDoc),
      altDraft: ts(o.suggestedCoverAltDraft ?? altDraftFromDoc),
      status: ts(o.imageSuggestionStatus ?? status) || 'none',
    }
  }, [
    optimistic,
    urlFromDoc,
    photoPageFromDoc,
    photographerNameFromDoc,
    photographerPageFromDoc,
    altDraftFromDoc,
    status,
  ])

  const isBusy = busyMode !== null
  const isPending = eff.status === 'pending_review' && Boolean(eff.url)
  const isDismissed = eff.status === 'dismissed'

  async function run(mode: ApiMode) {
    if (!docId) return
    setBusyMode(mode)
    try {
      const headers: Record<string, string> = {'content-type': 'application/json'}
      const secret = getSecret()
      if (secret) headers['x-birding-suggest-secret'] = secret

      const res = await fetch(getApiUrl(), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: docId,
          mode,
          suggestedUrl: eff.url || null,
          suggestedAltDraft: eff.altDraft || null,
        }),
        credentials: 'omit',
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.push({status: 'error', title: json?.message || `Error ${res.status}`})
        return
      }

      const patch = (json?.patch ?? null) as SuggestionPatch | null
      if (patch) setOptimistic(patch)

      // Keep the workflow field value aligned with the server patch
      if (mode === 'dismiss') {
        onChange(PatchEvent.from(set('dismissed')))
      } else if (mode === 'confirm') {
        // The API route already wrote cardImage, cardImageAlt, and imageSuggestionStatus:'none'
        // directly to Sanity server-side. Only update this field's local value here —
        // passing doc-root paths through onChange would scope them to
        // imageSuggestionStatus.cardImage instead of the document-level field.
        onChange(PatchEvent.from(set('none')))
        toast.push({status: 'success', title: 'Photo added to card image.'})
      } else {
        onChange(PatchEvent.from(set('pending_review')))
      }
    } catch (e) {
      toast.push({
        status: 'error',
        title: e instanceof Error ? e.message : 'Request failed.',
      })
    } finally {
      setBusyMode(null)
    }
  }

  // ── State: confirmed ───────────────────────────────────────────────────────
  // Card image is already set — show a success state. To replace, editors remove
  // the card image field below and suggest again.
  if (hasCardImage) {
    return (
      <Card padding={4} radius={2} shadow={1} tone="positive">
        <Stack space={3}>
          <Text size={1} weight="semibold">
            ✓ Photo added to card image
          </Text>
          <Text size={1} muted>
            The image below is live on the dashboard. To replace it, clear the Card image
            field and click Suggest an image.
          </Text>
        </Stack>
      </Card>
    )
  }

  // ── State: pending review ──────────────────────────────────────────────────
  // A suggestion exists — show the photo large and surface the three actions.
  if (isPending) {
    return (
      <Card padding={0} radius={2} shadow={1} tone="default" style={{overflow: 'hidden'}}>
        {/* Full-width preview — plain img, Unsplash CDN, Studio bundle only */}
        <img
          src={eff.url}
          alt={`Suggested photo for ${speciesName || 'this sighting'} — verify species match before confirming`}
          style={{display: 'block', width: '100%', maxHeight: 300, objectFit: 'cover'}}
        />

        <Stack space={4} padding={4}>
          <Attribution
            photographerName={eff.photographerName}
            photographerPage={eff.photographerPage}
            photoPage={eff.photoPage}
          />

          <Text size={1} muted>
            Verify the species in the photo matches <strong>{speciesName || 'this sighting'}</strong> before confirming.
          </Text>

          <Flex gap={2} wrap="wrap" align="center">
            <Button
              tone="positive"
              mode="default"
              text="Use this photo"
              onClick={() => run('confirm')}
              disabled={isBusy}
              loading={busyMode === 'confirm'}
            />
            <Button
              tone="default"
              mode="ghost"
              text="Try another"
              onClick={() => run('regenerate')}
              disabled={isBusy}
              loading={busyMode === 'regenerate'}
            />
            {/* Skip sits at the far right — destructive but recoverable */}
            <div style={{marginLeft: 'auto'}}>
              <Button
                tone="critical"
                mode="bleed"
                text="Skip"
                onClick={() => run('dismiss')}
                disabled={isBusy}
                loading={busyMode === 'dismiss'}
              />
            </div>
          </Flex>
        </Stack>
      </Card>
    )
  }

  // ── State: dismissed ───────────────────────────────────────────────────────
  if (isDismissed) {
    return (
      <Card padding={4} radius={2} shadow={1} tone="caution">
        <Stack space={3}>
          <Text size={1} weight="semibold">Skipped</Text>
          <Text size={1} muted>
            Unsplash suggestions are turned off for this sighting. Click below to try again.
          </Text>
          <div>
            <Button
              tone="default"
              mode="default"
              text="Suggest an image"
              onClick={() => run('suggest')}
              disabled={isBusy || !docId}
              loading={busyMode === 'suggest'}
            />
          </div>
        </Stack>
      </Card>
    )
  }

  // ── State: empty / initial ─────────────────────────────────────────────────
  return (
    <Card padding={4} radius={2} shadow={1} tone="default">
      <Stack space={4}>
        <Stack space={2}>
          <Text size={1} weight="semibold">No image yet</Text>
          <Text size={1} muted>
            Get an Unsplash photo matched to{' '}
            <strong>{speciesName || 'this species'}</strong>. You&apos;ll preview it here
            before anything is published to the dashboard.
          </Text>
        </Stack>
        <div>
          <Button
            tone="primary"
            mode="default"
            text="Suggest an image"
            onClick={() => run('suggest')}
            disabled={isBusy || !docId}
            loading={busyMode === 'suggest'}
          />
        </div>
        {!docId ? (
          <Text size={1} muted>
            Save this sighting first, then suggest an image.
          </Text>
        ) : null}
      </Stack>
    </Card>
  )
}
