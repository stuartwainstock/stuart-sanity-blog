import Chip from '@/components/atoms/Chip'
import {
  getVariableFont,
  type VariableFontKey,
} from '@/lib/typeEmotions/variableFonts'
import styles from '../TypeEmotionsStudio.module.css'

type FontSwitcherProps = {
  fonts: VariableFontKey[]
  labFonts: VariableFontKey[]
  activeFontKey: VariableFontKey
  supportsItalic: boolean
  italic: boolean
  onFontSwitch: (key: VariableFontKey) => void
  onItalicChange: (italic: boolean) => void
}

export function FontSwitcher({
  fonts,
  labFonts,
  activeFontKey,
  supportsItalic,
  italic,
  onFontSwitch,
  onItalicChange,
}: FontSwitcherProps) {
  return (
    <div className={styles.sideStack}>
      <div className={styles.fontSwitcher} role="group" aria-label="Active variable font">
        <span className={styles.panelLabel}>Font</span>
        {fonts.map((key) => {
          const font = getVariableFont(key)
          return (
            <Chip
              key={key}
              interactive
              selected={key === activeFontKey}
              onClick={() => onFontSwitch(key)}
            >
              {font.label}
            </Chip>
          )
        })}
      </div>

      {labFonts.length > 0 ? (
        <div className={styles.fontSwitcher} role="group" aria-label="Experimental lab fonts">
          <span className={styles.panelLabel}>Lab</span>
          {labFonts.map((key) => {
            const font = getVariableFont(key)
            return (
              <Chip
                key={key}
                interactive
                selected={key === activeFontKey}
                onClick={() => onFontSwitch(key)}
              >
                {font.label}
              </Chip>
            )
          })}
        </div>
      ) : null}

      {supportsItalic ? (
        <div className={styles.fontSwitcher} role="group" aria-label="Italic style">
          <span className={styles.panelLabel}>Style</span>
          <Chip interactive selected={!italic} onClick={() => onItalicChange(false)}>
            Roman
          </Chip>
          <Chip interactive selected={italic} onClick={() => onItalicChange(true)}>
            Italic
          </Chip>
        </div>
      ) : null}
    </div>
  )
}
