'use client'

import React, {useCallback, useEffect, useState} from 'react'
import {CheckmarkCircleIcon, LockIcon} from '@sanity/icons'
import {Badge, Button, Card, Flex, Stack, Text, TextInput, useToast} from '@sanity/ui'
import type {ObjectInputProps} from 'sanity'
import {PatchEvent, set, unset, useFormValue} from 'sanity'

type AccessValue = {
  _type?: string
  configured?: string
  /** Legacy public fields — cleared on next save. */
  salt?: string
  hash?: string
}

type ViteImportMeta = ImportMeta & {env?: Record<string, string | undefined>}

function studioApiBase(): string {
  const fromProcess =
    (typeof process !== 'undefined' &&
      process.env.SANITY_STUDIO_CASE_STUDY_API_BASE?.trim()) ||
    ''
  const fromMeta = ((import.meta as ViteImportMeta).env?.SANITY_STUDIO_CASE_STUDY_API_BASE || '').trim()
  const fromEnv = (fromProcess || fromMeta).replace(/\/$/, '')
  if (fromEnv) return fromEnv
  // Hosted Studio has no same-origin /api — fall back to the production site.
  if (typeof window !== 'undefined' && window.location?.hostname?.endsWith('.sanity.studio')) {
    return 'https://www.stuartwainstock.com'
  }
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/studio')) {
    return ''
  }
  return ''
}

function studioSecret(): string {
  const fromProcess =
    (typeof process !== 'undefined' &&
      process.env.SANITY_STUDIO_CASE_STUDY_ADMIN_SECRET?.trim()) ||
    ''
  if (fromProcess) return fromProcess
  const meta = (import.meta as ViteImportMeta).env
  return meta?.SANITY_STUDIO_CASE_STUDY_ADMIN_SECRET?.trim() ?? ''
}

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = {'Content-Type': 'application/json'}
  const secret = studioSecret()
  if (secret) headers['x-case-study-admin-secret'] = secret
  return headers
}

/**
 * Sets the share password via the site admin API. Credentials are stored in
 * private Supabase — this Sanity field only mirrors a non-secret `configured` flag.
 */
export function AccessPasswordInput(props: ObjectInputProps) {
  const {value, onChange} = props
  const current = (value ?? {}) as AccessValue
  const slugValue = useFormValue(['slug']) as {current?: string} | undefined
  const slug = slugValue?.current?.trim() || ''
  const toast = useToast()

  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [hasPassword, setHasPassword] = useState(current.configured === 'yes')

  const refresh = useCallback(async () => {
    if (!slug) return
    try {
      const res = await fetch(`${studioApiBase()}/api/admin/case-studies/${encodeURIComponent(slug)}/access`, {
        method: 'GET',
        credentials: 'include',
        headers: authHeaders(),
      })
      if (!res.ok) return
      const data = (await res.json()) as {hasPassword?: boolean}
      setHasPassword(Boolean(data.hasPassword))
      if (data.hasPassword) {
        onChange(
          PatchEvent.from([
            set('yes', ['configured']),
            unset(['salt']),
            unset(['hash']),
          ]),
        )
      }
    } catch {
      /* ignore — editor may be offline / not signed in */
    }
  }, [slug, onChange])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function savePassword() {
    const password = draft.trim()
    if (!slug) {
      toast.push({status: 'warning', title: 'Set and save a slug first.'})
      return
    }
    if (password.length < 4) {
      toast.push({status: 'warning', title: 'Use at least 4 characters.'})
      return
    }
    setBusy(true)
    try {
      const res = await fetch(
        `${studioApiBase()}/api/admin/case-studies/${encodeURIComponent(slug)}/access`,
        {
          method: 'POST',
          credentials: 'include',
          headers: authHeaders(),
          body: JSON.stringify({password}),
        },
      )
      const data = (await res.json().catch(() => null)) as {ok?: boolean; message?: string} | null
      if (!res.ok || !data?.ok) {
        const detail = data?.message || `HTTP ${res.status}`
        toast.push({
          status: 'error',
          title: `${detail}. For hosted Studio, set SANITY_STUDIO_CASE_STUDY_* in sanity/.env.production and redeploy; on Vercel set CASE_STUDY_ADMIN_SECRET to the same value.`,
        })
        return
      }
      onChange(
        PatchEvent.from([set('yes', ['configured']), unset(['salt']), unset(['hash'])]),
      )
      setHasPassword(true)
      setDraft('')
      toast.push({status: 'success', title: 'Password set (stored privately).'})
    } catch {
      toast.push({status: 'error', title: 'Could not set the password.'})
    } finally {
      setBusy(false)
    }
  }

  async function clearPassword() {
    if (!slug) return
    setBusy(true)
    try {
      const res = await fetch(
        `${studioApiBase()}/api/admin/case-studies/${encodeURIComponent(slug)}/access`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: authHeaders(),
        },
      )
      const data = (await res.json().catch(() => null)) as {ok?: boolean; message?: string} | null
      if (!res.ok || !data?.ok) {
        toast.push({
          status: 'error',
          title: data?.message || 'Could not clear the password.',
        })
        return
      }
      onChange(PatchEvent.from([unset(['configured']), unset(['salt']), unset(['hash'])]))
      setHasPassword(false)
      setDraft('')
      toast.push({status: 'success', title: 'Password cleared.'})
    } catch {
      toast.push({status: 'error', title: 'Could not clear the password.'})
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card padding={4} radius={2} shadow={1} tone={hasPassword ? 'positive' : 'caution'}>
      <Stack space={4}>
        <Flex align="center" gap={2}>
          <Text size={2}>{hasPassword ? <CheckmarkCircleIcon /> : <LockIcon />}</Text>
          <Text size={1} weight="semibold">
            {hasPassword ? 'Password set' : 'No password set'}
          </Text>
          <Badge tone={hasPassword ? 'positive' : 'caution'}>
            {hasPassword ? 'Protected' : 'Open'}
          </Badge>
        </Flex>

        <Text size={1} muted>
          {hasPassword
            ? 'Stored privately (not in this public dataset). Enter a new value below to replace it.'
            : 'Visitors must enter this password to view the PDF. It is hashed and stored in private Supabase — keep a copy somewhere safe to share it.'}
        </Text>

        {!slug ? (
          <Text size={1} muted>
            Save a slug on this document before setting a password.
          </Text>
        ) : null}

        <Stack space={3}>
          <TextInput
            type="password"
            placeholder={hasPassword ? 'Enter a new password to replace' : 'Set a password'}
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            autoComplete="new-password"
          />
          <Flex gap={2}>
            <Button
              text={hasPassword ? 'Replace password' : 'Set password'}
              tone="primary"
              onClick={savePassword}
              disabled={busy || !slug || draft.trim().length === 0}
              loading={busy}
            />
            {hasPassword ? (
              <Button
                text="Clear"
                tone="critical"
                mode="ghost"
                onClick={clearPassword}
                disabled={busy || !slug}
              />
            ) : null}
          </Flex>
        </Stack>
      </Stack>
    </Card>
  )
}
