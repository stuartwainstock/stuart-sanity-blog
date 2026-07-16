'use client'

import React, {useCallback, useEffect, useState} from 'react'
import {AddIcon, TrashIcon} from '@sanity/icons'
import {Button, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {
  PatchEvent,
  insert,
  set,
  unset,
  useClient,
  useFormValue,
  type ArrayOfObjectsInputProps,
} from 'sanity'

type AxisRow = {
  _key: string
  _type?: string
  tag?: string
  value?: number
}

type FaceAxis = {
  tag?: string
  default?: number
}

type FontFaceRef = {_ref?: string}

function newKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
  }
  return Math.random().toString(36).slice(2, 14)
}

function asRows(value: unknown): AxisRow[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is AxisRow => Boolean(item && typeof item === 'object'))
}

/**
 * Lightweight editor for emotion coordinate / intense arrays.
 * Prefills axis tags from the primary fontFace when the array is empty.
 */
export function AxisCoordinateInput(props: ArrayOfObjectsInputProps) {
  const {value, onChange, readOnly} = props
  const rows = asRows(value)
  const client = useClient({apiVersion: '2025-01-01'})
  const fontFaceRefs = useFormValue(['fontFace']) as FontFaceRef[] | undefined
  const [faceAxes, setFaceAxes] = useState<FaceAxis[]>([])

  useEffect(() => {
    const ref = Array.isArray(fontFaceRefs) ? fontFaceRefs[0]?._ref : undefined
    if (!ref) {
      setFaceAxes([])
      return
    }
    let cancelled = false
    client
      .fetch<{axes?: FaceAxis[]} | null>(`*[_id == $id][0]{ axes[]{ tag, "default": default } }`, {
        id: ref,
      })
      .then((doc) => {
        if (!cancelled) setFaceAxes(Array.isArray(doc?.axes) ? doc.axes : [])
      })
      .catch(() => {
        if (!cancelled) setFaceAxes([])
      })
    return () => {
      cancelled = true
    }
  }, [client, fontFaceRefs])

  const writeRows = useCallback(
    (next: AxisRow[]) => {
      onChange(PatchEvent.from(next.length ? set(next) : unset()))
    },
    [onChange],
  )

  const updateRow = useCallback(
    (index: number, patch: Partial<AxisRow>) => {
      const next = rows.map((row, i) => (i === index ? {...row, ...patch} : row))
      writeRows(next)
    },
    [rows, writeRows],
  )

  const removeRow = useCallback(
    (index: number) => {
      writeRows(rows.filter((_, i) => i !== index))
    },
    [rows, writeRows],
  )

  const addRow = useCallback(
    (tag = '', axisDefault = 0) => {
      const item: AxisRow = {
        _type: 'axisTagValue',
        _key: newKey(),
        tag,
        value: axisDefault,
      }
      if (rows.length === 0) {
        onChange(PatchEvent.from(set([item])))
        return
      }
      onChange(PatchEvent.from(insert([item], 'after', [rows[rows.length - 1]._key])))
    },
    [onChange, rows],
  )

  const prefillFromFace = useCallback(() => {
    if (!faceAxes.length) return
    const next: AxisRow[] = faceAxes
      .filter((axis) => typeof axis.tag === 'string' && axis.tag.length > 0)
      .map((axis) => ({
        _type: 'axisTagValue',
        _key: newKey(),
        tag: axis.tag,
        value: typeof axis.default === 'number' ? axis.default : 0,
      }))
    writeRows(next)
  }, [faceAxes, writeRows])

  return (
    <Stack space={3}>
      {rows.length === 0 && faceAxes.length > 0 && !readOnly ? (
        <Card padding={3} radius={2} tone="primary" border>
          <Flex align="center" justify="space-between" gap={3}>
            <Text size={1}>
              Prefill {faceAxes.length} axis tag{faceAxes.length === 1 ? '' : 's'} from the primary
              font face?
            </Text>
            <Button
              mode="ghost"
              text="Prefill from font"
              onClick={prefillFromFace}
              fontSize={1}
              padding={2}
            />
          </Flex>
        </Card>
      ) : null}

      <Stack space={2}>
        {rows.map((row, index) => (
          <Flex key={row._key || index} gap={2} align="center">
            <Card flex={1} padding={0}>
              <TextInput
                value={row.tag ?? ''}
                placeholder="tag (e.g. wght)"
                readOnly={readOnly}
                onChange={(event) => updateRow(index, {tag: event.currentTarget.value})}
              />
            </Card>
            <Card style={{width: 120}} padding={0}>
              <TextInput
                type="number"
                value={row.value == null ? '' : String(row.value)}
                placeholder="value"
                readOnly={readOnly}
                onChange={(event) => {
                  const raw = event.currentTarget.value
                  if (raw === '') {
                    updateRow(index, {value: undefined})
                    return
                  }
                  const parsed = Number(raw)
                  if (!Number.isNaN(parsed)) updateRow(index, {value: parsed})
                }}
              />
            </Card>
            {!readOnly ? (
              <Button
                mode="bleed"
                icon={TrashIcon}
                tone="critical"
                padding={2}
                onClick={() => removeRow(index)}
                aria-label={`Remove axis ${row.tag || index + 1}`}
              />
            ) : null}
          </Flex>
        ))}
      </Stack>

      {!readOnly ? (
        <Flex>
          <Button
            mode="ghost"
            icon={AddIcon}
            text="Add axis"
            onClick={() => addRow()}
            fontSize={1}
            padding={2}
          />
        </Flex>
      ) : null}
    </Stack>
  )
}
