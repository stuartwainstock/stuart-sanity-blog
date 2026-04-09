import type {ReactNode} from 'react'
import {
  pageBanner,
  pageDataSourceCredit,
  pageInner,
  pageTitleH1DataPage,
} from '@/lib/pageTypography'

type Props = {
  /** Matches `aria-labelledby` on the header. */
  titleId: string
  title: ReactNode
  /** Credit line(s): eBird, Strava, Nominatim, etc. */
  dataSource: ReactNode
  /** Optional intro or Portable Text below the credit. */
  children?: ReactNode
}

/**
 * Hero for “tool” pages backed by a third-party API: title, then data attribution, then optional intro.
 */
export default function PageHeroWithDataSource({titleId, title, dataSource, children}: Props) {
  return (
    <header className={pageBanner} role="banner" aria-labelledby={titleId}>
      <div className={pageInner}>
        <h1 id={titleId} className={pageTitleH1DataPage}>
          {title}
        </h1>
        <div className={pageDataSourceCredit}>{dataSource}</div>
        {children}
      </div>
    </header>
  )
}

