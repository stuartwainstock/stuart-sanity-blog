import type {Metadata} from 'next'
import Link from 'next/link'
import {isStravaAdminAuthConfigured, safeRelativeRedirectPath} from '@/lib/admin/session'
import {pageContent, pageShellBg} from '@/lib/pageTypography'

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
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Admin sign-in unavailable</h1>
          <p className="text-gray-700 mb-6">
            Set <code className="text-sm bg-gray-100 px-1 rounded">ADMIN_PASSWORD</code> in the environment
            to enable protected Strava OAuth.
          </p>
          <Link href="/runs" className="text-orange-600 hover:text-orange-700 font-medium">
            Back to Runs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={pageShellBg}>
      <div className={pageContent}>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Site admin sign-in</h1>
        <p className="text-gray-600 mb-6 max-w-lg">
          Enter the password configured as <code className="text-sm bg-gray-100 px-1 rounded">ADMIN_PASSWORD</code>{' '}
          in your deployment. This is required before connecting Strava or completing the OAuth callback.
        </p>
        <form
          action="/api/admin/session"
          method="post"
          className="max-w-sm space-y-4"
        >
          <input type="hidden" name="next" value={nextPath} />
          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-800 mb-1">
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Sign in
          </button>
        </form>
        <p className="mt-8">
          <Link href="/runs" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
            Cancel — back to Runs
          </Link>
        </p>
      </div>
    </div>
  )
}
