'use client'

import React, {useState} from 'react'
import {CheckmarkCircleIcon, LockIcon} from '@sanity/icons'
import {Badge, Button, Card, Flex, Stack, Text, TextInput, useToast} from '@sanity/ui'
import type {ObjectInputProps} from 'sanity'
import {PatchEvent, set, unset} from 'sanity'

/**
 * Custom input for the `caseStudyAccess` object. Editors type a share password once;
 * only a random salt + SHA-256(salt:password) hash is stored. The plaintext is never
 * persisted, so the password stays safe even though the dataset is publicly readable.
 *
 * The hashing formula here MUST match `hashPassword` in src/lib/caseStudy/password.ts.
 */
type AccessValue = {
  _type?: string
  salt?: string
  hash?: string
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function randomSaltHex(bytes = 16): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return toHex(digest)
}

export function AccessPasswordInput(props: ObjectInputProps) {
  const {value, onChange} = props
  const current = (value ?? {}) as AccessValue
  const hasPassword = Boolean(current.hash && current.salt)
  const toast = useToast()

  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  async function savePassword() {
    const password = draft.trim()
    if (password.length < 4) {
      toast.push({status: 'warning', title: 'Use at least 4 characters.'})
      return
    }
    setBusy(true)
    try {
      const salt = randomSaltHex()
      const hash = await sha256Hex(`${salt}:${password}`)
      onChange(PatchEvent.from([set(salt, ['salt']), set(hash, ['hash'])]))
      setDraft('')
      toast.push({status: 'success', title: 'Password set.'})
    } catch {
      toast.push({status: 'error', title: 'Could not set the password.'})
    } finally {
      setBusy(false)
    }
  }

  function clearPassword() {
    onChange(PatchEvent.from([unset(['salt']), unset(['hash'])]))
    setDraft('')
    toast.push({status: 'success', title: 'Password cleared.'})
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
            ? 'Stored as a one-way hash — it cannot be displayed again. Enter a new value below to replace it.'
            : 'Visitors must enter this password to view the PDF. It is stored as a one-way hash, so keep a copy somewhere safe to share it.'}
        </Text>

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
              disabled={busy || draft.trim().length === 0}
              loading={busy}
            />
            {hasPassword ? (
              <Button
                text="Clear"
                tone="critical"
                mode="ghost"
                onClick={clearPassword}
                disabled={busy}
              />
            ) : null}
          </Flex>
        </Stack>
      </Stack>
    </Card>
  )
}
