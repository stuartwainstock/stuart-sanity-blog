import type {SpecimenPalette} from '@/lib/typeEmotions/palettes'
import styles from '../TypeEmotionsStudio.module.css'

type PaletteSwatchesProps = {
  palette: SpecimenPalette
}

export function PaletteSwatches({palette}: PaletteSwatchesProps) {
  return (
    <div className={styles.paletteRow} aria-label={`${palette.name} swatches`}>
      <span className={styles.panelLabel}>Palette</span>
      <div className={styles.swatches}>
        {palette.swatches.map((hex) => (
          <span
            key={hex}
            className={styles.swatch}
            style={{backgroundColor: `#${hex}`}}
            title={`#${hex}`}
          />
        ))}
      </div>
      <a
        href={palette.coolorsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.paletteLink}
      >
        {palette.name}
      </a>
    </div>
  )
}
