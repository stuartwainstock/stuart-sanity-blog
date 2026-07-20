'use client'

import React, {useCallback, useEffect, useRef, useState} from 'react'
import {CheckmarkCircleIcon, DocumentPdfIcon} from '@sanity/icons'
import {Badge, Button, Card, Flex, Stack, Text, useToast} from '@sanity/ui'
import type {ObjectInputProps} from 'sanity'
import {PatchEvent, set, useFormValue} from 'sanity'

type PdfValue = {
  _type?: string
  configured?: string
  originalFilename?: string
}

function studioApiBase(): string {
  const fromEnv =
    (typeof process !== 'undefined' &&
      process.env?.SANITY_STUDIO_CASE_STUDY_API_BASE?.trim()) ||
    ''
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return ''
}

function studioSecret(): string {
  return (
    (typeof process !== 'undefined' &&
      process.env?.SANITY_STUDIO_CASE_STUDY_ADMIN_SECRET?.trim()) ||
    ''
  )
}

/**
 * Uploads the protected PDF to private Supabase Storage via the site admin API.
 * Sanity only stores a non-secret configured flag + filename for Studio UX.
 */
export function PdfProtectionInput(props: ObjectInputProps) {
  const {value, onChange} = props
  const current = (value ?? {}) as PdfValue
  const slugValue = useFormValue(['slug']) as {current?: string} | undefined
  const slug = slugValue?.current?.trim() || ''
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  const [busy, setBusy] = useState(false)
  const [hasPdf, setHasPdf] = useState(current.configured === 'yes')
  const [filename, setFilename] = useState(current.originalFilename || '')

  const refresh = useCallback(async () => {
    if (!slug) return
    try {
      const headers: Record<string, string> = {}
      const secret = studioSecret()
      if (secret) headers['x-case-study-admin-secret'] = secret
      const res = await fetch(
        `${studioApiBase()}/api/admin/case-studies/${encodeURIComponent(slug)}/pdf`,
        {method: 'GET', credentials: 'include', headers},
      )
      if (!res.ok) return
      const data = (await res.json()) as {hasPdf?: boolean; originalFilename?: string | null}
      setHasPdf(Boolean(data.hasPdf))
      if (data.originalFilename) setFilename(data.originalFilename)
      if (data.hasPdf) {
        onChange(
          PatchEvent.from([
            set('yes', ['configured']),
            set(data.originalFilename || 'case-study.pdf', ['originalFilename']),
          ]),
        )
      }
    } catch {
      /* ignore */
    }
  }, [slug, onChange])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function onFileSelected(file: File | undefined) {
    if (!file || !slug) return
    if (file.type && file.type !== 'application/pdf') {
      toast.push({status: 'warning', title: 'Upload a PDF file.'})
      return
    }
    setBusy(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const headers: Record<string, string> = {}
      const secret = studioSecret()
      if (secret) headers['x-case-study-admin-secret'] = secret
      const res = await fetch(
        `${studioApiBase()}/api/admin/case-studies/${encodeURIComponent(slug)}/pdf`,
        {method: 'POST', credentials: 'include', headers, body},
      )
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean
        message?: string
        originalFilename?: string
      } | null
      if (!res.ok || !data?.ok) {
        toast.push({
          status: 'error',
          title:
            data?.message ||
            'Upload failed. Set the access password first, and sign in at /admin/login (or configure the Studio secret).',
        })
        return
      }
      const name = data.originalFilename || file.name
      onChange(
        PatchEvent.from([
          set('yes', ['configured']),
          set(name, ['originalFilename']),
        ]),
      )
      setHasPdf(true)
      setFilename(name)
      toast.push({status: 'success', title: 'PDF uploaded to private storage.'})
    } catch {
      toast.push({status: 'error', title: 'Could not upload the PDF.'})
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <Card padding={4} radius={2} shadow={1} tone={hasPdf ? 'positive' : 'caution'}>
      <Stack space={4}>
        <Flex align="center" gap={2}>
          <Text size={2}>
            {hasPdf ? <CheckmarkCircleIcon /> : <DocumentPdfIcon />}
          </Text>
          <Text size={1} weight="semibold">
            {hasPdf ? 'PDF stored privately' : 'No PDF uploaded'}
          </Text>
          <Badge tone={hasPdf ? 'positive' : 'caution'}>
            {hasPdf ? 'Private' : 'Missing'}
          </Badge>
        </Flex>

        <Text size={1} muted>
          {hasPdf
            ? `Current file: ${filename || 'case-study.pdf'}. Re-upload to replace. Served only after visitors unlock the case study.`
            : 'Upload the case study PDF. It is stored in private Supabase Storage — not on the public Sanity CDN.'}
        </Text>

        {!slug ? (
          <Text size={1} muted>
            Save a slug on this document before uploading.
          </Text>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          disabled={busy || !slug}
          onChange={(e) => void onFileSelected(e.currentTarget.files?.[0])}
          style={{maxWidth: '100%'}}
        />

        <Button
          text={hasPdf ? 'Choose a replacement PDF' : 'Choose PDF'}
          tone="primary"
          mode="ghost"
          disabled={busy || !slug}
          loading={busy}
          onClick={() => inputRef.current?.click()}
        />
      </Stack>
    </Card>
  )
}
