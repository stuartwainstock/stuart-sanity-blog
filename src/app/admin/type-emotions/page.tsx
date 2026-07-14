import type {Metadata} from 'next'
import Link from 'next/link'
import {redirect} from 'next/navigation'
import {hasValidAdminSession, isStravaAdminAuthConfigured} from '@/lib/admin/session'
import {createServerSupabase} from '@/lib/supabase/server'
import {pageBodyTypography, pageContent, pageShellBg} from '@/lib/pageTypography'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Type Emotions — search review',
  robots: {index: false, follow: false},
}

export const dynamic = 'force-dynamic'

type SearchEventRow = {
  id: string
  created_at: string
  query: string
  kind: 'fallback' | 'weak' | 'feedback'
  matched_emotion_id: string | null
  matched_via: string | null
  matched_on: string | null
  score: number | null
}

const KIND_LABEL: Record<SearchEventRow['kind'], string> = {
  fallback: 'No match',
  weak: 'Weak match',
  feedback: 'Flagged',
}

export default async function AdminTypeEmotionsPage() {
  const allowed = await hasValidAdminSession()
  if (!allowed) {
    redirect(`/admin/login?next=${encodeURIComponent('/admin/type-emotions')}`)
  }

  let rows: SearchEventRow[] = []
  let loadError: string | null = null

  try {
    const supabase = createServerSupabase()
    const {data, error} = await supabase
      .from('type_emotion_search_events')
      .select(
        'id, created_at, query, kind, matched_emotion_id, matched_via, matched_on, score',
      )
      .order('created_at', {ascending: false})
      .limit(100)

    if (error) {
      loadError = error.message
    } else {
      rows = (data ?? []) as SearchEventRow[]
    }
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load events'
  }

  const counts = {
    fallback: rows.filter((r) => r.kind === 'fallback').length,
    weak: rows.filter((r) => r.kind === 'weak').length,
    feedback: rows.filter((r) => r.kind === 'feedback').length,
  }

  return (
    <div className={pageShellBg}>
      <div className={pageContent}>
        <p className={styles.kicker}>
          <Link href="/admin/strava">Admin</Link> / Type Emotions
        </p>
        <h1 className={styles.title}>Type Emotions — search review</h1>
        <div className={pageBodyTypography}>
          <p>
            Unmatched, weak, and flagged searches from{' '}
            <Link href="/type-emotions">/type-emotions</Link>. Use these to grow synonyms,
            rematch emotions, or attach palettes in{' '}
            <code>src/lib/typeEmotions/catalog.ts</code>.
          </p>
          {!isStravaAdminAuthConfigured() ? (
            <p className={styles.warn}>Admin auth env is not fully configured.</p>
          ) : null}
        </div>

        <dl className={styles.stats}>
          <div>
            <dt>No match</dt>
            <dd>{counts.fallback}</dd>
          </div>
          <div>
            <dt>Weak</dt>
            <dd>{counts.weak}</dd>
          </div>
          <div>
            <dt>Flagged</dt>
            <dd>{counts.feedback}</dd>
          </div>
          <div>
            <dt>Showing</dt>
            <dd>{rows.length}</dd>
          </div>
        </dl>

        {loadError ? (
          <p className={styles.warn} role="alert">
            Could not load events: {loadError}
          </p>
        ) : rows.length === 0 ? (
          <p className={styles.empty}>
            No events yet. Search something unknown on the lab page, or mark a result as “Not
            quite right?”.
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">Kind</th>
                  <th scope="col">Query</th>
                  <th scope="col">Landed on</th>
                  <th scope="col">Signal</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className={styles.mono}>
                      {new Date(row.created_at).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td>
                      <span className={styles.kind} data-kind={row.kind}>
                        {KIND_LABEL[row.kind]}
                      </span>
                    </td>
                    <td className={styles.query}>{row.query}</td>
                    <td className={styles.mono}>
                      {row.matched_emotion_id ?? '—'}
                      {row.matched_via ? ` · ${row.matched_via}` : ''}
                    </td>
                    <td className={styles.mono}>
                      {row.matched_on ? `“${row.matched_on}”` : '—'}
                      {typeof row.score === 'number' ? ` · ${Math.round(Number(row.score) * 100)}%` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className={styles.footnote}>
          Table: <code>public.type_emotion_search_events</code> · also visible in the Supabase
          dashboard. Script:{' '}
          <code>scripts/supabase-type-emotion-search-events.sql</code>
        </p>
      </div>
    </div>
  )
}
