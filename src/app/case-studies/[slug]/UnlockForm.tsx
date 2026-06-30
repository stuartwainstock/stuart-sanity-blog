'use client'

import {useRouter} from 'next/navigation'
import {useState} from 'react'
import styles from './page.module.css'

/**
 * Posts the share password to the unlock route. On success the route sets the
 * httpOnly cookie and we refresh the server component so the PDF viewer renders.
 */
export function UnlockForm({slug}: {slug: string}) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!password.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/case-studies/${encodeURIComponent(slug)}/unlock`, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({password}),
      })
      if (res.ok) {
        setPassword('')
        router.refresh()
        return
      }
      const data = (await res.json().catch(() => null)) as {message?: string} | null
      setError(data?.message || 'Incorrect password.')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className={styles.unlockForm} onSubmit={onSubmit} noValidate>
      <label htmlFor="case-study-password" className={styles.unlockLabel}>
        Password
      </label>
      <input
        id="case-study-password"
        name="password"
        type="password"
        autoComplete="current-password"
        className={styles.unlockInput}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'case-study-password-error' : undefined}
        required
      />
      {error ? (
        <p id="case-study-password-error" className={styles.unlockError} role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className={styles.unlockButton} disabled={loading || !password.trim()}>
        {loading ? 'Checking…' : 'View case study'}
      </button>
    </form>
  )
}
