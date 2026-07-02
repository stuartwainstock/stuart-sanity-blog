import PortableText from '@/components/molecules/PortableText'
import type {TypedObject} from '@portabletext/types'
import styles from './HubPageHeader.module.css'

type HubPageHeaderProps = {
  title: string
  introduction?: TypedObject[]
  fallbackIntro?: string
}

export function HubPageHeader({title, introduction, fallbackIntro}: HubPageHeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
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
