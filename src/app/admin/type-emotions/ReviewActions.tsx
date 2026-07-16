'use client'

import {useRouter} from 'next/navigation'
import {useState} from 'react'
import Button from '@/components/atoms/Button'
import styles from './page.module.css'

type ReviewActionsProps = {
  eventId: string
  query: string
  matchedEmotionId: string | null
}

export function ReviewActions({eventId, query, matchedEmotionId}: ReviewActionsProps) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(action: 'addSynonym' | 'dismiss' | 'needsContent') {
    setBusy(action)
    setError(null)
    try {
      const res = await fetch('/api/type-emotions/review', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          eventId,
          action,
          emotionId: matchedEmotionId,
          synonym: query,
        }),
      })
      const data = (await res.json()) as {error?: string}
      if (!res.ok) {
        setError(data.error || 'Request failed')
        return
      }
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={styles.actions}>
      {matchedEmotionId ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          tone="neutral"
          disabled={Boolean(busy)}
          onClick={() => void run('addSynonym')}
        >
          {busy === 'addSynonym' ? 'Adding…' : `Add “${query}” → ${matchedEmotionId}`}
        </Button>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        tone="neutral"
        disabled={Boolean(busy)}
        onClick={() => void run('dismiss')}
      >
        {busy === 'dismiss' ? '…' : 'Dismiss'}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        tone="neutral"
        disabled={Boolean(busy)}
        onClick={() => void run('needsContent')}
      >
        {busy === 'needsContent' ? '…' : 'Needs content'}
      </Button>
      {error ? (
        <span className={styles.actionError} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}
