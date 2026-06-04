import {useEffect, useRef} from 'react'
import {PatchEvent, set, useClient, type ObjectInputProps} from 'sanity'
import {
  isUnsplashCreditLine,
  photographerNameFromCreditLine,
} from '../../src/lib/unsplashCredit'

type ImageFieldValue = {
  asset?: {_ref?: string}
  credit?: string
}

const ASSET_CREDIT_QUERY = `*[_id == $id][0]{
  creditLine,
  source
}`

const RETRY_MS = [0, 300, 800, 1500]

export function ImageWithUnsplashCreditInput(props: ObjectInputProps) {
  const client = useClient({apiVersion: '2023-05-03'})
  const value = (props.value ?? undefined) as ImageFieldValue | undefined
  const assetRef = value?.asset?._ref
  const credit = value?.credit?.trim()
  const lastSyncedAssetRef = useRef<string | null>(null)

  const onChange = props.onChange

  useEffect(() => {
    if (!assetRef || credit) {
      if (!assetRef) lastSyncedAssetRef.current = null
      return
    }
    if (lastSyncedAssetRef.current === assetRef) return

    let cancelled = false

    const syncCredit = async () => {
      for (const delay of RETRY_MS) {
        if (cancelled) return
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
        if (cancelled) return

        const asset = await client.fetch<{
          creditLine?: string
          source?: {name?: string}
        } | null>(ASSET_CREDIT_QUERY, {id: assetRef})

        const creditLine = asset?.creditLine?.trim()
        if (!creditLine || !isUnsplashCreditLine(creditLine, asset?.source?.name)) {
          continue
        }

        const photographer = photographerNameFromCreditLine(creditLine)
        if (!photographer) continue

        lastSyncedAssetRef.current = assetRef
        onChange(PatchEvent.from(set(photographer, ['credit'])))
        return
      }
    }

    void syncCredit().catch(() => {
      /* Studio should stay usable if asset fetch fails */
    })

    return () => {
      cancelled = true
    }
  }, [assetRef, credit, client, onChange])

  return props.renderDefault(props)
}
