'use client'

import {useState} from 'react'
import Image from 'next/image'
import Button from '@/components/atoms/Button'
import type {UnsplashPhoto} from '@/lib/unsplash/types'
import styles from './PixelArtStudio.module.css'

type Props = {
  onPick: (result: UnsplashPhoto) => void
  disabled?: boolean
}

export function UnsplashPicker({onPick, disabled}: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UnsplashPhoto[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function runSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed || status === 'loading') return

    setStatus('loading')
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/lab/pixel-art/unsplash-search?query=${encodeURIComponent(trimmed)}`)
      const json = (await res.json().catch(() => null)) as
        | {ok: true; results: UnsplashPhoto[]}
        | {message?: string}
        | null

      if (!res.ok || !json || !('ok' in json)) {
        setResults([])
        setStatus('error')
        setErrorMessage((json && 'message' in json && json.message) || 'Search failed. Try again.')
        return
      }

      setResults(json.results)
      setStatus('idle')
      if (json.results.length === 0) {
        setErrorMessage('No photos found for that search — try something else.')
      }
    } catch {
      setResults([])
      setStatus('error')
      setErrorMessage('Search failed. Check your connection and try again.')
    }
  }

  return (
    <div className={styles.unsplashPicker}>
      <form className={styles.unsplashForm} onSubmit={runSearch}>
        <label htmlFor="unsplash-query" className={styles.unsplashLabel}>
          Search Unsplash for a photo
        </label>
        <div className={styles.unsplashRow}>
          <input
            id="unsplash-query"
            type="text"
            className={styles.unsplashInput}
            placeholder="pileated woodpecker, hummingbird, owl…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={disabled}
            maxLength={100}
          />
          <Button type="submit" variant="secondary" disabled={disabled || status === 'loading' || !query.trim()}>
            {status === 'loading' ? 'Searching…' : 'Search'}
          </Button>
        </div>
      </form>

      {errorMessage ? <p className={styles.unsplashError}>{errorMessage}</p> : null}

      {results.length > 0 ? (
        <ul className={styles.unsplashResults} role="list" aria-label="Unsplash search results">
          {results.map((result) => (
            <li key={result.id}>
              <button
                type="button"
                className={styles.unsplashThumbButton}
                onClick={() => onPick(result)}
                disabled={disabled}
                aria-label={
                  result.altDescription
                    ? `Use this photo: ${result.altDescription}`
                    : 'Use this photo'
                }
              >
                <Image
                  src={result.thumbUrl}
                  alt={result.altDescription || ''}
                  width={140}
                  height={100}
                  className={styles.unsplashThumbImage}
                  unoptimized
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <p className={styles.unsplashCredit}>
        Photo search powered by{' '}
        <a href="https://unsplash.com/?utm_source=stuartwainstock&utm_medium=referral" target="_blank" rel="noopener noreferrer">
          Unsplash
        </a>
        .
      </p>
    </div>
  )
}
