import type {ReactNode} from 'react'
import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {
  allJsonTokenLeaves,
  cssCustomProperties,
  documentedHexInGlobals,
  extendedPaletteColors,
  semanticBackgroundClasses,
  spacingSteps,
  tokenPathToCssVar,
} from '@/stories/designTokens.data'
import {
  pageBanner,
  pageBodyParagraph,
  pageBodyTypography,
  pageContent,
  pageDataSourceCredit,
  pageDataSourceLink,
  pageExcerpt,
  pageInner,
  pageKicker,
  pageSectionHeading,
  pageShellBg,
  pageTitleH1,
  pageTitleH1DataPage,
} from '@/lib/pageTypography'
import s from './DesignTokens.module.css'

const meta = {
  title: 'Foundations/Design Tokens',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Visual reference for tokens: `tokens/*.json` → Style Dictionary → `src/styles/generated/tokens.css`, plus shared `pageTypography` classes. Run `npm run tokens:build` after editing JSON.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const TYPE_SCALE: {label: string; className: string}[] = [
  {label: '0.75rem (text-xs)', className: s.scaleXs},
  {label: '0.875rem (text-sm)', className: s.scaleSm},
  {label: '1rem (text-base)', className: s.scaleBase},
  {label: '1.125rem (text-lg)', className: s.scaleLg},
  {label: '1.25rem (text-xl)', className: s.scaleXl},
  {label: '1.5rem (text-2xl)', className: s.scale2xl},
  {label: '1.875rem (text-3xl)', className: s.scale3xl},
  {label: '2.25rem (text-4xl)', className: s.scale4xl},
]

const GRAY_HEX = [
  {name: '100', hex: '#f3f4f6'},
  {name: '200', hex: '#e5e7eb'},
  {name: '300', hex: '#d1d5db'},
  {name: '400', hex: '#9ca3af'},
  {name: '500', hex: '#6b7280'},
  {name: '600', hex: '#4b5563'},
  {name: '700', hex: '#374151'},
  {name: '800', hex: '#1f2937'},
  {name: '900', hex: '#111827'},
]

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section className={s.section} aria-labelledby={id}>
      <h2 id={id} className={s.sectionTitle}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Mono({children}: {children: ReactNode}) {
  return <code className={s.mono}>{children}</code>
}

export const Reference: Story = {
  render: () => (
    <article className={s.article}>
      <header className={s.header}>
        <p className={s.kicker}>Foundations</p>
        <h1 className={s.title}>Design tokens</h1>
        <p className={s.lead}>
          JSON sources (Style Dictionary), generated CSS variables, semantic helpers in <Mono>globals.css</Mono>, and
          shared typography classes from <Mono>pageTypography.ts</Mono>.
        </p>
      </header>

      <Section id="section-css-vars" title="CSS custom properties (:root)">
        <div className={s.tableScroll}>
          <table className={s.table}>
            <thead>
              <tr className={s.thRow}>
                <th className={s.th}>Variable</th>
                <th className={s.th}>Value</th>
                <th className={s.th}>Preview</th>
                <th className={s.th}>Note</th>
              </tr>
            </thead>
            <tbody>
              {cssCustomProperties.map((row) => (
                <tr key={row.name} className={s.tr}>
                  <td className={s.tdMono}>{row.name}</td>
                  <td className={s.tdMono}>{row.value}</td>
                  <td className={s.td}>
                    {row.name.includes('color') && row.value.startsWith('#') ? (
                      <span
                        className={s.swatch}
                        style={{backgroundColor: row.value}}
                        title={row.value}
                      />
                    ) : row.name.includes('font') ? (
                      <span style={{fontFamily: 'var(--font-work-sans)'}} className={s.fontPreview}>
                        Work Sans preview
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className={s.tdNote}>{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="section-sd-json" title="Style Dictionary — all leaves from tokens/*.json">
        <p className={s.muted}>
          Paths are token paths; CSS names match the generated file (e.g.{' '}
          <Mono>color.background</Mono> → <Mono>{tokenPathToCssVar('color.background')}</Mono>).
        </p>
        <div className={s.tableScroll}>
          <table className={s.table}>
            <thead>
              <tr className={s.thRow}>
                <th className={s.th}>Token path</th>
                <th className={s.th}>CSS variable</th>
                <th className={s.th}>Value</th>
                <th className={s.th}>Preview</th>
              </tr>
            </thead>
            <tbody>
              {allJsonTokenLeaves.map((row) => {
                const cssName = tokenPathToCssVar(row.path)
                const isHex = row.$value.startsWith('#')
                return (
                  <tr key={row.path} className={s.tr}>
                    <td className={s.tdMono}>{row.path}</td>
                    <td className={s.tdMono}>{cssName}</td>
                    <td className={s.tdMono}>{row.$value}</td>
                    <td className={s.td}>
                      {isHex ? (
                        <span
                          className={s.swatch}
                          style={{backgroundColor: row.$value}}
                          title={row.$value}
                        />
                      ) : (
                        <span className={s.fontPreview} style={{fontFamily: row.$value}}>
                          Aa Work Sans
                        </span>
                      )}
                      {row.$description ? <p className={s.tokenDesc}>{row.$description}</p> : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="section-extended-palette" title="Extended palette (custom + semantic)">
        <p className={s.muted}>
          Values from <Mono>tokens/color.json</Mono>; use via <Mono>var(--color-…)</Mono> in CSS or the semantic{' '}
          <Mono>.bg-*</Mono> helpers in <Mono>globals.css</Mono>.
        </p>
        <div className={s.paletteGrid}>
          {extendedPaletteColors.map(({token, hex}) => (
            <div key={token} className={s.paletteCard}>
              <div className={s.paletteSwatch} style={{backgroundColor: hex}} />
              <div className={s.paletteMeta}>
                <div className={s.paletteToken}>{token}</div>
                <div className={s.paletteHex}>{hex}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="section-semantic-bg" title="Semantic background classes">
        <div className={s.semanticGrid}>
          {semanticBackgroundClasses.map(({className, note}) => (
            <div key={className} className={`${s.semanticCard} ${className}`}>
              <Mono>{className}</Mono>
              <span className={s.semanticNote}>{note}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="section-globals-hex" title="Documented colors (prose, body, selection)">
        <p className={s.muted}>
          Sourced from <Mono>tokens/color.json</Mono> → <Mono>color.documented.*</Mono>; referenced in{' '}
          <Mono>globals.css</Mono> prose and base styles.
        </p>
        <div className={s.docHexRow}>
          {documentedHexInGlobals.map(({label, hex}) => (
            <div key={label} className={s.docHexCard}>
              <span className={s.docHexDot} style={{backgroundColor: hex}} />
              <div>
                <div className={s.docHexLabel}>{label}</div>
                <div className={s.docHexValue}>{hex}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="section-typography-exports" title="Typography — pageTypography.ts">
        <p className={s.muted}>
          Import these strings and spread onto <Mono>className</Mono>. Shell / layout helpers are included for
          reference.
        </p>
        <div className={s.typographyStack}>
          <div className={s.typographyBlock}>
            <div className={s.typographyLabelRow}>
              <span className={s.typographyTag}>pageShellBg</span>
              <Mono>{pageShellBg}</Mono>
            </div>
            <div className={`${s.shellSample} ${pageShellBg}`}>Shell background sample</div>
          </div>
          <div className={s.typographyBlock}>
            <div className={s.typographyLabelRow}>
              <span className={s.typographyTag}>pageBanner / pageContent</span>
            </div>
            <ul className={s.list}>
              <li>
                <Mono>pageBanner</Mono> — <span className={s.tdMono}>{pageBanner}</span>
              </li>
              <li>
                <Mono>pageContent</Mono> — <span className={s.tdMono}>{pageContent}</span>
              </li>
            </ul>
          </div>
          <div className={s.typographyBlock}>
            <div className={s.typographyLabelRow}>
              <span className={s.typographyTag}>pageInner</span>
              <Mono>{pageInner}</Mono>
            </div>
            <div className={`${s.innerSample} ${pageInner}`}>
              <div className={pageKicker}>pageKicker</div>
              <div className={pageTitleH1}>pageTitleH1</div>
              <div className={pageTitleH1DataPage}>pageTitleH1DataPage</div>
            </div>
          </div>
          <div className={s.typographyBlock}>
            <div className={s.typographyLabelRow}>
              <span className={s.typographyTag}>pageDataSourceCredit / pageDataSourceLink</span>
            </div>
            <div className={pageDataSourceCredit}>
              Credit line with <span className={pageDataSourceLink}>pageDataSourceLink</span>.
            </div>
          </div>
          <div className={s.typographyBlock}>
            <div className={s.typographyLabelRow}>
              <Mono>pageExcerpt</Mono>
            </div>
            <div className={pageExcerpt}>Excerpt — 30px, light, letter-spaced.</div>
          </div>
          <div className={s.typographyBlock}>
            <div className={s.typographyLabelRow}>
              <Mono>pageSectionHeading</Mono>
            </div>
            <h2 className={pageSectionHeading}>Section heading sample</h2>
          </div>
          <div className={s.typographyBlock}>
            <div className={s.typographyLabelRow}>
              <Mono>pageBodyTypography</Mono>
            </div>
            <div className={pageBodyTypography}>
              Body block — same scale as long-form CMS pages (30px, light, tracking).
            </div>
          </div>
          <div className={s.typographyBlock}>
            <div className={s.typographyLabelRow}>
              <Mono>pageBodyParagraph</Mono>
            </div>
            <p className={pageBodyParagraph}>
              Paragraph with max-width for readable measure (maps, tool intros).
            </p>
          </div>
        </div>
      </Section>

      <Section id="section-type-scale" title="Type scale (representative rem steps)">
        <p className={s.muted}>Common display sizes; pair with weight and color tokens as needed.</p>
        <div className={s.typeScalePanel}>
          {TYPE_SCALE.map(({label, className}) => (
            <div key={label} className={s.typeRow}>
              <Mono>{label}</Mono>
              <span className={className}>The quick brown fox</span>
            </div>
          ))}
          <div className={s.typeRowBorder}>
            <Mono>30px (page body)</Mono>
            <span className={s.body30}>The quick brown fox</span>
          </div>
        </div>
      </Section>

      <Section id="section-gray-palette" title="Neutral gray scale (reference)">
        <p className={s.muted}>Common UI neutrals for borders, text, and surfaces.</p>
        <GraySwatches />
      </Section>

      <Section id="section-spacing" title="Spacing scale (0.25rem step)">
        <p className={s.muted}>
          <Mono>1</Mono> = 0.25rem (4px at default root). Layout padding often uses multiples (e.g. 2rem horizontal).
        </p>
        <div className={s.spacingStack}>
          {spacingSteps.map((n) => (
            <div key={n} className={s.spacingRow}>
              <div className={s.spacingKey}>{n}</div>
              <div className={s.spacingTrack}>
                <div className={s.spacingBar} style={{width: `${n * 0.25}rem`}} />
              </div>
              <div className={s.spacingPx}>{n * 4}px</div>
            </div>
          ))}
        </div>
      </Section>
    </article>
  ),
}

function GraySwatches() {
  return (
    <div className={s.grayGrid}>
      {GRAY_HEX.map(({name, hex}) => (
        <div key={name} className={s.grayCell}>
          <div className={s.grayBar} style={{backgroundColor: hex}} />
          <div className={s.grayLabel}>{name}</div>
        </div>
      ))}
    </div>
  )
}
