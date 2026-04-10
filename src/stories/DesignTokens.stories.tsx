import type {ReactNode} from 'react'
import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {
  allJsonTokenLeaves,
  cssCustomProperties,
  documentedHexInGlobals,
  semanticBackgroundClasses,
  spacingSteps,
  tailwindExtendedColors,
  tokenPathToCssVar,
  typeScaleSteps,
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

const meta = {
  title: 'Foundations/Design Tokens',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Visual reference for tokens: `tokens/*.json` → Style Dictionary → `src/styles/generated/tokens.css`, Tailwind extensions + `pageTypography.ts`. Run `npm run tokens:build` after editing JSON.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

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
    <section className="mb-14 scroll-mt-8" aria-labelledby={id}>
      <h2 id={id} className="text-2xl font-semibold text-gray-900 border-b border-gray-300 pb-2 mb-6">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Mono({children}: {children: ReactNode}) {
  return <code className="text-xs font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">{children}</code>
}

export const Reference: Story = {
  render: () => (
    <article className="text-gray-900">
      <header className="mb-10">
        <p className="text-sm text-gray-600 mb-1">Foundations</p>
        <h1 className="text-3xl font-bold text-gray-900">Design tokens</h1>
        <p className="mt-3 text-base text-gray-600 max-w-3xl">
          JSON sources (Style Dictionary), generated CSS variables, Tailwind extensions, and shared
          typography classes.
        </p>
      </header>

      <Section id="section-css-vars" title="CSS custom properties (:root)">
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="p-3 font-medium">Variable</th>
                <th className="p-3 font-medium">Value</th>
                <th className="p-3 font-medium">Preview</th>
                <th className="p-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {cssCustomProperties.map((row) => (
                <tr key={row.name} className="border-b border-gray-100 last:border-0">
                  <td className="p-3 font-mono text-xs">{row.name}</td>
                  <td className="p-3 font-mono text-xs">{row.value}</td>
                  <td className="p-3">
                    {row.name.includes('color') && row.value.startsWith('#') ? (
                      <span
                        className="inline-block h-8 w-14 rounded border border-gray-200 shadow-inner"
                        style={{backgroundColor: row.value}}
                        title={row.value}
                      />
                    ) : row.name.includes('font') ? (
                      <span style={{fontFamily: 'var(--font-work-sans)'}} className="text-lg">
                        Work Sans preview
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-3 text-gray-600">{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="section-sd-json" title="Style Dictionary — all leaves from tokens/*.json">
        <p className="text-sm text-gray-600 mb-4">
          Paths are token paths; CSS names match the generated file (e.g.{' '}
          <Mono>color.background</Mono> → <Mono>{tokenPathToCssVar('color.background')}</Mono>).
        </p>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="p-3 font-medium">Token path</th>
                <th className="p-3 font-medium">CSS variable</th>
                <th className="p-3 font-medium">Value</th>
                <th className="p-3 font-medium">Preview</th>
              </tr>
            </thead>
            <tbody>
              {allJsonTokenLeaves.map((row) => {
                const cssName = tokenPathToCssVar(row.path)
                const isHex = row.$value.startsWith('#')
                return (
                  <tr key={row.path} className="border-b border-gray-100 last:border-0">
                    <td className="p-3 font-mono text-xs">{row.path}</td>
                    <td className="p-3 font-mono text-xs">{cssName}</td>
                    <td className="p-3 font-mono text-xs">{row.$value}</td>
                    <td className="p-3">
                      {isHex ? (
                        <span
                          className="inline-block h-8 w-14 rounded border border-gray-200 shadow-inner"
                          style={{backgroundColor: row.$value}}
                          title={row.$value}
                        />
                      ) : (
                        <span className="text-lg" style={{fontFamily: row.$value}}>
                          Aa Work Sans
                        </span>
                      )}
                      {row.$description ? (
                        <p className="mt-1 text-xs text-gray-500">{row.$description}</p>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="section-tailwind-colors" title="Tailwind extended colors">
        <p className="text-sm text-gray-600 mb-4">
          Use <Mono>bg-{'{token}'}</Mono>, <Mono>text-{'{token}'}</Mono>, etc. (see{' '}
          <Mono>tailwind.config.js</Mono>).
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {tailwindExtendedColors.map(({token, hex}) => (
            <div
              key={token}
              className="rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm"
            >
              <div
                className="h-16 w-full border-b border-gray-100"
                style={{backgroundColor: hex}}
              />
              <div className="p-2">
                <div className="font-mono text-xs font-medium text-gray-900">{token}</div>
                <div className="font-mono text-[10px] text-gray-500">{hex}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="section-semantic-bg" title="Semantic background classes">
        <div className="grid gap-3 sm:grid-cols-2">
          {semanticBackgroundClasses.map(({className, note}) => (
            <div
              key={className}
              className={`flex items-center justify-between rounded-lg border border-gray-200 px-4 py-4 ${className}`}
            >
              <Mono>{className}</Mono>
              <span className="text-xs text-gray-600">{note}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="section-globals-hex" title="Documented colors (prose, body, selection)">
        <p className="text-sm text-gray-600 mb-4">
          Sourced from <Mono>tokens/color.json</Mono> → <Mono>color.documented.*</Mono>; referenced in
          <Mono>globals.css</Mono> prose and base styles.
        </p>
        <div className="flex flex-wrap gap-3">
          {documentedHexInGlobals.map(({label, hex}) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <span
                className="h-6 w-6 shrink-0 rounded border border-gray-200"
                style={{backgroundColor: hex}}
              />
              <div>
                <div className="font-medium text-gray-900">{label}</div>
                <div className="font-mono text-xs text-gray-500">{hex}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="section-typography-exports" title="Typography — pageTypography.ts">
        <p className="text-sm text-gray-600 mb-6">
          Import these strings and spread onto <Mono>className</Mono>. Shell / layout helpers are
          included for reference.
        </p>
        <div className="space-y-8">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                pageShellBg
              </span>
              <Mono>{pageShellBg}</Mono>
            </div>
            <div className={`rounded border border-dashed border-gray-300 p-4 ${pageShellBg}`}>
              Shell background sample
            </div>
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                pageBanner / pageContent
              </span>
            </div>
            <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
              <li>
                <Mono>pageBanner</Mono> — <span className="font-mono text-xs">{pageBanner}</span>
              </li>
              <li>
                <Mono>pageContent</Mono> — <span className="font-mono text-xs">{pageContent}</span>
              </li>
            </ul>
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                pageInner
              </span>
              <Mono>{pageInner}</Mono>
            </div>
            <div className={`rounded border border-gray-200 bg-white p-4 ${pageInner}`}>
              <div className={pageKicker}>pageKicker</div>
              <div className={pageTitleH1}>pageTitleH1</div>
              <div className={pageTitleH1DataPage}>pageTitleH1DataPage</div>
            </div>
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                pageDataSourceCredit / pageDataSourceLink
              </span>
            </div>
            <div className={pageDataSourceCredit}>
              Credit line with <span className={pageDataSourceLink}>pageDataSourceLink</span>.
            </div>
          </div>
          <div>
            <div className="mb-2">
              <Mono>pageExcerpt</Mono>
            </div>
            <div className={pageExcerpt}>Excerpt — 30px, light, letter-spaced.</div>
          </div>
          <div>
            <div className="mb-2">
              <Mono>pageSectionHeading</Mono>
            </div>
            <h2 className={pageSectionHeading}>Section heading sample</h2>
          </div>
          <div>
            <div className="mb-2">
              <Mono>pageBodyTypography</Mono>
            </div>
            <div className={pageBodyTypography}>
              Body block — same scale as long-form CMS pages (30px, light, tracking).
            </div>
          </div>
          <div>
            <div className="mb-2">
              <Mono>pageBodyParagraph</Mono>
            </div>
            <p className={pageBodyParagraph}>
              Paragraph with max-width for readable measure (maps, tool intros).
            </p>
          </div>
        </div>
      </Section>

      <Section id="section-type-scale" title="Tailwind type scale (representative)">
        <p className="text-sm text-gray-600 mb-4">
          Default Tailwind font-size utilities; combine with <Mono>font-weight</Mono>,{' '}
          <Mono>text-gray-*</Mono>, etc.
        </p>
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          {typeScaleSteps.map((cls) => (
            <div key={cls} className="flex flex-wrap items-baseline gap-4">
              <Mono>{cls}</Mono>
              <span className={cls}>The quick brown fox</span>
            </div>
          ))}
          <div className="flex flex-wrap items-baseline gap-4 border-t border-gray-100 pt-3">
            <Mono>text-[30px] (page body)</Mono>
            <span className="text-[30px] font-light tracking-[2px] leading-[1.6] text-gray-600">
              The quick brown fox
            </span>
          </div>
        </div>
      </Section>

      <Section id="section-gray-palette" title="Tailwind gray scale (common text)">
        <p className="text-sm text-gray-600 mb-4">
          Default palette — often <Mono>text-gray-600</Mono>, <Mono>text-gray-900</Mono>, etc.
        </p>
        <GraySwatches />
      </Section>

      <Section id="section-spacing" title="Spacing scale (Tailwind default)">
        <p className="text-sm text-gray-600 mb-4">
          <Mono>1</Mono> = 0.25rem (4px at default root). Site uses padding like <Mono>px-8</Mono>,{' '}
          <Mono>py-10</Mono>, <Mono>mb-12</Mono> frequently.
        </p>
        <div className="space-y-2">
          {spacingSteps.map((n) => (
            <div key={n} className="flex items-center gap-4">
              <div className="w-24 shrink-0 font-mono text-xs text-gray-500">{n}</div>
              <div className="flex h-8 flex-1 items-center bg-gray-100">
              <div
                className="h-4 bg-orange-500/80"
                style={{width: `${n * 0.25}rem`}}
              />
              </div>
              <div className="w-20 shrink-0 font-mono text-xs text-gray-400">{n * 4}px</div>
            </div>
          ))}
        </div>
      </Section>
    </article>
  ),
}

/** Tailwind cannot infer dynamic gray class names — explicit swatches */
function GraySwatches() {
  const classes = [
    'bg-gray-100',
    'bg-gray-200',
    'bg-gray-300',
    'bg-gray-400',
    'bg-gray-500',
    'bg-gray-600',
    'bg-gray-700',
    'bg-gray-800',
    'bg-gray-900',
  ] as const
  return (
    <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-9">
      {classes.map((c) => (
        <div key={c} className="text-center">
          <div className={`h-12 w-full rounded-t border border-gray-200 ${c}`} />
          <div className="rounded-b border border-t-0 border-gray-200 bg-white px-1 py-1 font-mono text-[10px] text-gray-700">
            {c.replace('bg-', '')}
          </div>
        </div>
      ))}
    </div>
  )
}
