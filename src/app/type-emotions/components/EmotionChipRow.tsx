import Chip from '@/components/atoms/Chip'
import type {EmotionEntry, EmotionId} from '@/lib/typeEmotions/catalog'
import styles from '../TypeEmotionsStudio.module.css'

type EmotionChipRowProps = {
  catalog: EmotionEntry[]
  selectedId: EmotionId
  onSelect: (id: EmotionId) => void
}

export function EmotionChipRow({catalog, selectedId, onSelect}: EmotionChipRowProps) {
  return (
    <div className={styles.chips} role="group" aria-label="Emotion presets">
      {catalog.map((emotion) => (
        <Chip
          key={emotion.id}
          interactive
          selected={emotion.id === selectedId}
          onClick={() => onSelect(emotion.id)}
        >
          {emotion.label}
        </Chip>
      ))}
    </div>
  )
}
