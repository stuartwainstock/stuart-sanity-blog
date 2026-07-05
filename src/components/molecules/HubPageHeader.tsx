import PortableText from '@/components/molecules/PortableText'
import type {TypedObject} from '@portabletext/types'
import styles from './HubPageHeader.module.css'

type HubPageHeaderProps = {
  title: string
  titleId?: string
  introduction?: TypedObject[]
  fallbackIntro?: string
}

export function HubPageHeader({title, titleId, introduction, fallbackIntro}: HubPageHeaderProps) {
  return (
    <header className={styles.header}>
      <h1 id={titleId} className={styles.title}>{title}</h1>
      {introduction?.length ? (
        <div className={styles.intro}>
          <PortableText value={introduction} />
        </div>
      ) : fallbackIntro ? (
        <p className={styles.intro}>{fallbackIntro}</p>
      ) : null}
    </header>
  )
}
