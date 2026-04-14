import type {Metadata} from 'next'
import Link from 'next/link'
import {isStravaAdminAuthConfigured, safeRelativeRedirectPath} from '@/lib/admin/session'
import {pageContent, pageShellBg} from '@/lib/pageTypography'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Sign in',
  robots: {index: false, follow: false},
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{next?: string}>
}) {
  const {next} = await searchParams
  const nextPath = safeRelativeRedirectPath(typeof next === 'string' ? next : null)

  if (!isStravaAdminAuthConfigured()) {
    return (
      <div className={pageShellBg}>
        <div className={pageContent}>
          <h1 className={styles.title}>Admin sign-in unavailable</h1>
          <p className={styles.lead}>
            Set <code className={styles.code}>ADMIN_PASSWORD</code> in the environment
            to enable protected Strava OAuth.
          </p>
          <Link href="/" className={styles.navLink}>
            Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={pageShellBg}>
      <div className={pageContent}>
        <h1 className={`${styles.title} ${styles.titleTight}`}>Site admin sign-in</h1>
        <p className={styles.leadNarrow}>
          Enter the password configured as <code className={styles.code}>ADMIN_PASSWORD</code>{' '}
          in your deployment. This is required before connecting Strava or completing the OAuth callback.
        </p>
        <form
          action="/api/admin/session"
          method="post"
          className={styles.form}
        >
          <input type="hidden" name="next" value={nextPath} />
          <div className={styles.field}>
            <label htmlFor="admin-password" className={styles.label}>
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={styles.input}
            />
          </div>
          <button
            type="submit"
            className={styles.submit}
          >
            Sign in
          </button>
        </form>
        <p className={styles.footerLinks}>
          <Link href="/" className={styles.navLink}>
            Home
          </Link>
          <Link href="/admin/strava" className={styles.navLink}>
            Strava sync (after you sign in)
          </Link>
        </p>
      </div>
    </div>
  )
}
