'use client'

import React, {useMemo, useState} from 'react'
import {LaunchIcon} from '@sanity/icons'
import {
  Badge,
  Button,
  Card,
  Flex,
  Stack,
  Text,
  useToast,
} from '@sanity/ui'
import type {StringInputProps} from 'sanity'
import {PatchEvent, set, useFormValue} from 'sanity'

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
}>

function truthyString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function getBirdingSuggestApiUrl(): string {
  const explicit =
    (typeof process !== 'undefined' &&
      process.env &&
      (process.env.SANITY_STUDIO_BIRDING_SUGGEST_API_URL ||
        process.env.NEXT_PUBLIC_BIRDING_SUGGEST_API_URL)) ||
    ''
  const v = typeof explicit === 'string' ? explicit.trim() : ''
  if (v) return v
  // Hosted Studio (`*.sanity.studio`) cannot call same-origin `/api/*`.
  // Fall back to the canonical site origin (same pattern as GA proxy config).
  if (typeof window !== 'undefined') {
    const host = window.location?.hostname || ''
    if (host.endsWith('.sanity.studio')) {
      return 'https://www.stuartwainstock.com/api/birding/suggest-unsplash'
    }
  }
  // Embedded Studio (same-origin) or local dev.
  return '/api/birding/suggest-unsplash'
}

function getBirdingSuggestSecret(): string {
  const fromProcess =
    (typeof process !== 'undefined' &&
      process.env &&
      (process.env.SANITY_STUDIO_BIRDING_SUGGEST_SECRET ||
        process.env.NEXT_PUBLIC_BIRDING_SUGGEST_SECRET)) ||
    ''
  const p = typeof fromProcess === 'string' ? fromProcess.trim() : ''
  if (p) return p

  // Hosted Studio (Vite) exposes env on import.meta.env at build time.
  const metaEnv = (import.meta as any)?.env
  const fromMeta =
    (metaEnv?.SANITY_STUDIO_BIRDING_SUGGEST_SECRET ||
      metaEnv?.NEXT_PUBLIC_BIRDING_SUGGEST_SECRET ||
      '') as string
  return typeof fromMeta === 'string' ? fromMeta.trim() : ''
}

export function BirdSightingUnsplashSuggestionPanel(props: StringInputProps) {
  const {renderDefault, onChange} = props
  const toast = useToast()

  const docId = useFormValue(['_id']) as string | undefined
  const speciesName = truthyString(useFormValue(['speciesName']))
  const locationLabel = truthyString(useFormValue(['locationLabel']))
  const status = truthyString(useFormValue(['imageSuggestionStatus'])) || 'none'

  const manualQuery = truthyString(useFormValue(['suggestedCoverSearchQueryManual']))
  const lastQuery = truthyString(useFormValue(['suggestedCoverSearchQueryLast']))
  const searchPage = Number(useFormValue(['suggestedCoverSearchPage']) ?? 1) || 1

  const urlFromDoc = truthyString(useFormValue(['suggestedCoverImageUrl']))
  const hasCardImage = Boolean(useFormValue(['cardImage', 'asset', '_ref']))
  const photoPageFromDoc = truthyString(useFormValue(['suggestedCoverImagePageUrl']))
  const photographerNameFromDoc = truthyString(useFormValue(['suggestedCoverPhotographerName']))
  const photographerPageFromDoc = truthyString(useFormValue(['suggestedCoverPhotographerPageUrl']))
  const altDraftFromDoc = truthyString(useFormValue(['suggestedCoverAltDraft']))

  const [busyMode, setBusyMode] = useState<ApiMode | null>(null)
  const [optimistic, setOptimistic] = useState<SuggestionPatch | null>(null)

  const effective = useMemo(() => {
    const o = optimistic ?? {}
    const url = truthyString(o.suggestedCoverImageUrl ?? urlFromDoc)
    const photoPage = truthyString(o.suggestedCoverImagePageUrl ?? photoPageFromDoc)
    const photographerName = truthyString(
      o.suggestedCoverPhotographerName ?? photographerNameFromDoc
    )
    const photographerPage = truthyString(
      o.suggestedCoverPhotographerPageUrl ?? photographerPageFromDoc
    )
    const altDraft = truthyString(o.suggestedCoverAltDraft ?? altDraftFromDoc)
    const imageSuggestionStatus = truthyString(o.imageSuggestionStatus ?? status) || 'none'
    const suggestedCoverProvider = truthyString(o.suggestedCoverProvider) || ''
    const suggestedCoverSearchQueryLast = truthyString(
      o.suggestedCoverSearchQueryLast ?? lastQuery
    )
    const suggestedCoverSearchPage = Number(o.suggestedCoverSearchPage ?? searchPage) || 1

    return {
      url,
      photoPage,
      photographerName,
      photographerPage,
      altDraft,
      imageSuggestionStatus,
      suggestedCoverProvider,
      suggestedCoverSearchQueryLast,
      suggestedCoverSearchPage,
    }
  }, [
    optimistic,
    urlFromDoc,
    photoPageFromDoc,
    photographerNameFromDoc,
    photographerPageFromDoc,
    altDraftFromDoc,
    status,
    lastQuery,
    searchPage,
  ])

  async function copyToClipboard(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.push({status: 'success', title: `${label} copied.`})
    } catch {
      toast.push({status: 'error', title: 'Copy failed. Your browser may block clipboard access.'})
    }
  }

  async function run(mode: ApiMode) {
    if (!docId) return
    setBusyMode(mode)
    const label =
      mode === 'suggest'
        ? 'Suggest image'
        : mode === 'regenerate'
          ? 'Next suggestion'
          : mode === 'confirm'
            ? 'Confirm image'
            : 'Dismiss suggestion'
    toast.push({status: 'info', title: `${label}…`})

    try {
      const headers: Record<string, string> = {'content-type': 'application/json'}
      const secret = getBirdingSuggestSecret()
      if (secret) headers['x-birding-suggest-secret'] = secret

      const res = await fetch(getBirdingSuggestApiUrl(), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: docId,
          mode,
          // For confirm: avoid races where the server still sees an older suggestion.
          suggestedUrl: effective.url || null,
          suggestedAltDraft: effective.altDraft || null,
        }),
        // Hosted Studio uses shared-secret auth; avoid cookies to keep CORS simple.
        credentials: 'omit',
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.push({status: 'error', title: json?.message || `Failed (${res.status})`})
        return
      }

      const patch = (json?.patch ?? null) as SuggestionPatch | null
      if (patch) setOptimistic(patch)

      // Keep the radio value aligned with the server-side patch and apply card image immediately on confirm.
      if (mode === 'dismiss') {
        onChange(PatchEvent.from(set('dismissed')))
      } else if (mode === 'confirm') {
        const nextPatches = [set('none')]
        if (patch && (patch as any).cardImage) {
          nextPatches.push(set((patch as any).cardImage, ['cardImage']))
        }
        if (patch && typeof (patch as any).cardImageAlt === 'string') {
          nextPatches.push(set((patch as any).cardImageAlt, ['cardImageAlt']))
        }
        onChange(PatchEvent.from(nextPatches))
      } else {
        onChange(PatchEvent.from(set('pending_review')))
      }

      toast.push({status: 'success', title: 'Updated.'})
    } catch (e) {
      toast.push({
        status: 'error',
        title: e instanceof Error ? e.message : 'Request failed.',
      })
    } finally {
      setBusyMode(null)
    }
  }

  const hasSuggestion = Boolean(effective.url)
  const isPending = effective.imageSuggestionStatus === 'pending_review'
  const isDismissed = effective.imageSuggestionStatus === 'dismissed'

  const badgeTone =
    isPending ? 'caution' : isDismissed ? 'critical' : hasSuggestion ? 'positive' : 'default'
  const badgeLabel = isPending
    ? 'Pending review'
    : isDismissed
      ? 'Dismissed'
      : hasSuggestion
        ? 'Suggested'
        : 'No suggestion'

  return (
    <Stack space={4}>
      <Card padding={4} radius={2} shadow={1} tone="default">
        <Stack space={3}>
          <Flex justify="space-between" align="center" gap={3} wrap="wrap">
            <Text size={1} weight="semibold">
              Unsplash suggestion
            </Text>
            <Badge tone={badgeTone}>{badgeLabel}</Badge>
          </Flex>

          <Text size={1} muted>
            Editors never need terminal commands. Use the buttons below to fetch a suggestion, cycle to the next photo,
            or dismiss suggestions for this sighting.
          </Text>

          <Flex gap={2} wrap="wrap">
            <Button
              tone="primary"
              mode="default"
              text={hasSuggestion ? 'Refresh suggestion' : 'Suggest image'}
              onClick={() => run('suggest')}
              disabled={!docId || busyMode != null}
              loading={busyMode === 'suggest'}
            />
            <Button
              tone="positive"
              mode="default"
              text={hasCardImage ? 'Card image set' : 'Confirm → set Card image'}
              onClick={() => run('confirm')}
              disabled={!docId || !hasSuggestion || hasCardImage || busyMode != null}
              loading={busyMode === 'confirm'}
            />
            <Button
              tone="default"
              mode="default"
              text="Next suggestion"
              onClick={() => run('regenerate')}
              disabled={!docId || !isPending || busyMode != null}
              loading={busyMode === 'regenerate'}
            />
            <Button
              tone="critical"
              mode="ghost"
              text="Dismiss"
              onClick={() => run('dismiss')}
              disabled={!docId || busyMode != null}
              loading={busyMode === 'dismiss'}
            />
          </Flex>

          <Stack space={2}>
            <Text size={1} muted>
              <strong>Search</strong>: {manualQuery ? 'Manual override' : 'Auto'} · page {effective.suggestedCoverSearchPage}
            </Text>
            {effective.suggestedCoverSearchQueryLast ? (
              <Text size={1} muted>
                <strong>Query</strong>: {effective.suggestedCoverSearchQueryLast}
              </Text>
            ) : null}
            {speciesName ? (
              <Text size={1} muted>
                <strong>Species</strong>: {speciesName}
                {locationLabel ? ` · ${locationLabel}` : ''}
              </Text>
            ) : null}
          </Stack>

          {hasSuggestion ? (
            <Card padding={3} radius={2} tone="transparent" shadow={0}>
              <Stack space={3}>
                {/* Plain img: Studio bundle; external Unsplash CDN URL is intentional here. */}
                <img
                  src={effective.url}
                  alt=""
                  width={640}
                  height={360}
                  style={{
                    display: 'block',
                    width: '100%',
                    maxHeight: 320,
                    height: 'auto',
                    objectFit: 'cover',
                    borderRadius: 4,
                  }}
                />

                <Flex gap={3} wrap="wrap" align="center">
                  {effective.photoPage ? (
                    <Text size={1}>
                      <a href={effective.photoPage} target="_blank" rel="noreferrer">
                        <LaunchIcon style={{verticalAlign: 'text-bottom', marginRight: 6}} />
                        Open on Unsplash
                      </a>
                    </Text>
                  ) : null}
                  {effective.photographerName && effective.photographerPage ? (
                    <Text size={1}>
                      Photo by{' '}
                      <a href={effective.photographerPage} target="_blank" rel="noreferrer">
                        {effective.photographerName}
                      </a>{' '}
                      / Unsplash
                    </Text>
                  ) : null}
                </Flex>

                <Flex gap={2} wrap="wrap">
                  <Button
                    mode="ghost"
                    text="Copy preview URL"
                    onClick={() => copyToClipboard('Preview URL', effective.url)}
                    disabled={!effective.url}
                  />
                  <Button
                    mode="ghost"
                    text="Copy alt draft"
                    onClick={() => copyToClipboard('Alt draft', effective.altDraft)}
                    disabled={!effective.altDraft}
                  />
                </Flex>
              </Stack>
            </Card>
          ) : (
            <Card padding={3} radius={2} tone="transparent" shadow={0}>
              <Text size={1} muted>
                No preview yet. Click <strong>Suggest image</strong> to fetch one.
              </Text>
            </Card>
          )}

          <Text size={1} muted>
            To publish the image on the dashboard: add the photo under <strong>Card image</strong> (Unsplash asset source or upload),
            set <strong>Card image alt text</strong>, then set the workflow radio to <strong>Done</strong> and publish.
          </Text>
        </Stack>
      </Card>

      {/* Keep the underlying workflow field editable for power users */}
      {renderDefault(props)}
    </Stack>
  )
}

