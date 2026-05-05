'use client'

import React, {useMemo, useState} from 'react'
import {LaunchIcon} from '@sanity/icons'
import {Button, Card, Flex, Stack, Text, useToast} from '@sanity/ui'
import type {StringInputProps} from 'sanity'
import {PatchEvent, set, useFormValue} from 'sanity'

// ── Types ─────────────────────────────────────────────────────────────────────

type ApiMode = 'suggest' | 'regenerate' | 'dismiss' | 'confirm'

type SuggestionPatch = Partial<{
  audioSuggestionStatus: 'none' | 'pending_review' | 'dismissed'
  suggestedAudioUrl: string | null
  suggestedAudioRecordist: string | null
  suggestedAudioSourceUrl: string | null
  suggestedAudioType: string | null
  suggestedAudioQuality: string | null
  suggestedAudioLength: string | null
  suggestedAudioPage: number | null
  callAudioUrl: string | null
}>

// ── Env helpers ───────────────────────────────────────────────────────────────

type ViteImportMeta = ImportMeta & {env?: Record<string, string | undefined>}

function getApiUrl(): string {
  const audioExplicit =
    (typeof process !== 'undefined' &&
      process.env?.SANITY_STUDIO_BIRDING_SUGGEST_AUDIO_API_URL?.trim()) ||
    ''
  if (audioExplicit) return audioExplicit

  const shared =
    (typeof process !== 'undefined' &&
      process.env?.SANITY_STUDIO_BIRDING_SUGGEST_API_URL?.trim()) ||
    ''
  if (shared) {
    try {
      const u = new URL(shared)
      const segs = u.pathname.split('/').filter(Boolean)
      const last = segs[segs.length - 1]
      if (last === 'suggest-unsplash') {
        segs[segs.length - 1] = 'suggest-audio'
        u.pathname = `/${segs.join('/')}`
        return u.toString()
      }
    } catch {
      /* fall through */
    }
    if (shared.includes('suggest-unsplash')) {
      return shared.replace(/suggest-unsplash/g, 'suggest-audio')
    }
    return shared
  }

  if (typeof window !== 'undefined' && window.location?.hostname?.endsWith('.sanity.studio')) {
    return 'https://www.stuartwainstock.com/api/birding/suggest-audio'
  }
  return '/api/birding/suggest-audio'
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

function AudioAttribution({
  recordist,
  sourceUrl,
  recordingType,
  quality,
  lengthSeconds,
}: {
  recordist: string
  sourceUrl: string
  recordingType: string
  quality: string
  lengthSeconds: string
}) {
  const lengthLabel =
    lengthSeconds &&
    (lengthSeconds.includes(':') ? lengthSeconds : `${lengthSeconds}s`)
  const meta = [recordingType, quality ? `quality ${quality}` : '', lengthLabel || '']
    .filter(Boolean)
    .join(' · ')

  return (
    <Stack space={2}>
      {(recordist || sourceUrl) && (
        <Text size={1} muted>
          {'Recording'}
          {recordist ? ` by ${recordist}` : ''}
          {' on '}
          {sourceUrl ? (
            <a href={sourceUrl} target="_blank" rel="noreferrer" style={{color: 'inherit'}}>
              {'Xeno-canto '}
              <LaunchIcon style={{verticalAlign: 'text-bottom', fontSize: '0.9em'}} />
            </a>
          ) : (
            'Xeno-canto'
          )}
        </Text>
      )}
      {meta && (
        <Text size={1} muted>
          {meta}
        </Text>
      )}
    </Stack>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * Replaces the audioSuggestionStatus radio field in the Accessibility tab.
 * Four clear states: empty → pending review (audio preview + confirm/next/skip) → confirmed.
 * Never renders the raw workflow radio or any machine-written suggestedAudio* fields.
 */
export function BirdSightingAudioSuggestionPanel(props: StringInputProps) {
  const {onChange} = props
  const toast = useToast()

  // Read document values for state and optimistic updates
  const docId = useFormValue(['_id']) as string | undefined
  const speciesName = ts(useFormValue(['speciesName']))
  const status = ts(useFormValue(['audioSuggestionStatus'])) || 'none'
  const audioUrlFromDoc = ts(useFormValue(['suggestedAudioUrl']))
  const recordistFromDoc = ts(useFormValue(['suggestedAudioRecordist']))
  const sourceUrlFromDoc = ts(useFormValue(['suggestedAudioSourceUrl']))
  const recordingTypeFromDoc = ts(useFormValue(['suggestedAudioType']))
  const qualityFromDoc = ts(useFormValue(['suggestedAudioQuality']))
  const lengthFromDoc = ts(useFormValue(['suggestedAudioLength']))
  const hasCallAudio = Boolean(useFormValue(['callAudioUrl']))

  const [busyMode, setBusyMode] = useState<ApiMode | null>(null)
  const [optimistic, setOptimistic] = useState<SuggestionPatch | null>(null)

  // Merge optimistic state over document values so the UI responds immediately
  const eff = useMemo(() => {
    const o = optimistic ?? {}
    return {
      audioUrl: ts(o.suggestedAudioUrl ?? audioUrlFromDoc),
      recordist: ts(o.suggestedAudioRecordist ?? recordistFromDoc),
      sourceUrl: ts(o.suggestedAudioSourceUrl ?? sourceUrlFromDoc),
      recordingType: ts(o.suggestedAudioType ?? recordingTypeFromDoc),
      quality: ts(o.suggestedAudioQuality ?? qualityFromDoc),
      lengthSeconds: ts(o.suggestedAudioLength ?? lengthFromDoc),
      status: ts(o.audioSuggestionStatus ?? status) || 'none',
    }
  }, [
    optimistic,
    audioUrlFromDoc,
    recordistFromDoc,
    sourceUrlFromDoc,
    recordingTypeFromDoc,
    qualityFromDoc,
    lengthFromDoc,
    status,
  ])

  const isBusy = busyMode !== null
  const isPending = eff.status === 'pending_review' && Boolean(eff.audioUrl)
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
        body: JSON.stringify({id: docId, mode}),
        credentials: 'omit',
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.push({status: 'error', title: json?.message || `Error ${res.status}`})
        return
      }

      const patch = (json?.patch ?? null) as SuggestionPatch | null
      if (patch) setOptimistic(patch)

      // Keep the workflow field value aligned with the server patch.
      // The API route owns all Sanity writes; onChange only updates this field's local value.
      if (mode === 'dismiss') {
        onChange(PatchEvent.from(set('dismissed')))
      } else if (mode === 'confirm') {
        onChange(PatchEvent.from(set('none')))
        toast.push({status: 'success', title: 'Recording added to call audio.'})
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
  // callAudioUrl is already set — show a success state.
  // To replace, editors clear the Call Audio URL field and suggest again.
  if (hasCallAudio) {
    return (
      <Card padding={4} radius={2} shadow={1} tone="positive">
        <Stack space={3}>
          <Text size={1} weight="semibold">
            ✓ Recording added to call audio
          </Text>
          <Text size={1} muted>
            The audio is live on the dashboard. To replace it, clear the Call Audio URL field
            and click Suggest a recording.
          </Text>
          {eff.recordist || eff.sourceUrl ? (
            <AudioAttribution
              recordist={eff.recordist}
              sourceUrl={eff.sourceUrl}
              recordingType={eff.recordingType}
              quality={eff.quality}
              lengthSeconds={eff.lengthSeconds}
            />
          ) : null}
        </Stack>
      </Card>
    )
  }

  // ── State: pending review ──────────────────────────────────────────────────
  // A suggestion exists — show the audio player and surface the three actions.
  if (isPending) {
    return (
      <Card padding={4} radius={2} shadow={1} tone="default">
        <Stack space={4}>
          {/* Native audio player — small footprint, no external deps */}
          <audio
            controls
            src={eff.audioUrl}
            style={{width: '100%', display: 'block'}}
            preload="metadata"
          />

          <AudioAttribution
            recordist={eff.recordist}
            sourceUrl={eff.sourceUrl}
            recordingType={eff.recordingType}
            quality={eff.quality}
            lengthSeconds={eff.lengthSeconds}
          />

          <Text size={1} muted>
            Verify this is the correct species before confirming.{' '}
            <strong>{speciesName || 'This sighting'}</strong>
          </Text>

          <Flex gap={2} wrap="wrap" align="center">
            <Button
              tone="positive"
              mode="default"
              text="Use this recording"
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
            Xeno-canto suggestions are turned off for this sighting. Click below to try again.
          </Text>
          <div>
            <Button
              tone="default"
              mode="default"
              text="Suggest a recording"
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
          <Text size={1} weight="semibold">No audio yet</Text>
          <Text size={1} muted>
            Find a Xeno-canto recording matched to{' '}
            <strong>{speciesName || 'this species'}</strong>. You&apos;ll preview it here
            before anything is published to the dashboard.
          </Text>
        </Stack>
        <div>
          <Button
            tone="primary"
            mode="default"
            text="Suggest a recording"
            onClick={() => run('suggest')}
            disabled={isBusy || !docId}
            loading={busyMode === 'suggest'}
          />
        </div>
        {!docId ? (
          <Text size={1} muted>
            Save this sighting first, then suggest a recording.
          </Text>
        ) : null}
      </Stack>
    </Card>
  )
}
