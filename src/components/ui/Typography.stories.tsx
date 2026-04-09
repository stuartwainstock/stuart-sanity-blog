import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import Link from 'next/link'
import {
  pageBodyParagraph,
  pageBodyTypography,
  pageDataSourceCredit,
  pageDataSourceLink,
  pageExcerpt,
  pageKicker,
  pageSectionHeading,
  pageTitleH1,
  pageTitleH1DataPage,
} from '@/lib/pageTypography'

const meta = {
  title: 'Atoms/Typography',
  tags: ['autodocs'],
  parameters: {
    controls: {hideNoControlsWarning: true},
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Scale: Story = {
  render: () => (
    <div className="space-y-10">
      <div>
        <div className={pageKicker}>Kicker</div>
        <div className={pageTitleH1}>H1 (pageTitleH1)</div>
        <div className={pageTitleH1DataPage}>H1 (pageTitleH1DataPage)</div>
      </div>

      <div className={pageDataSourceCredit}>
        <p>
          Data source credit block. Link example:{' '}
          <Link href="/" className={pageDataSourceLink}>
            link style
          </Link>
          .
        </p>
      </div>

      <div className={pageExcerpt}>
        Excerpt / hero secondary line. 30px, light, tracked.
      </div>

      <h2 className={pageSectionHeading}>Section heading (pageSectionHeading)</h2>

      <div className={pageBodyTypography}>
        <p className="mb-6 text-inherit">
          Body typography wrapper (pageBodyTypography). This is the baseline type scale used across
          tool pages.
        </p>
      </div>

      <p className={pageBodyParagraph}>
        Body paragraph (pageBodyParagraph). This adds max-width for readable measure and is used for
        intros above maps/tables.
      </p>
    </div>
  ),
}

