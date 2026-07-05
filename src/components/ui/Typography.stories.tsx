import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import Link from 'next/link'
import {
  hubPageWrap,
  pageBodyParagraph,
  pageBodyTypography,
  pageDataSourceCredit,
  pageDataSourceLink,
  pageExcerpt,
  pageKicker,
  pageProse,
  pageSectionHeading,
  pageTitleH1,
  pageTitleH1DataPage,
} from '@/lib/pageTypography'
import s from './Typography.stories.module.css'

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
    <div className={s.stack}>
      <div className={hubPageWrap}>
        <div className={pageKicker}>Hub shell (hubPageWrap)</div>
        <div className={pageTitleH1}>Hub title uses HubPageHeader in production</div>
        <div className={pageProse}>
          <p className={s.bodyLead}>
            Hub / CMS body (pageProse). Default for /lab, /case-studies, and CMS pages.
          </p>
        </div>
      </div>

      <div>
        <div className={pageKicker}>Tool page scale</div>
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
        <p className={s.bodyLead}>
          Tool page body (pageBodyTypography). Used on data-driven project pages with external APIs.
        </p>
      </div>

      <p className={pageBodyParagraph}>
        Body paragraph (pageBodyParagraph). This adds max-width for readable measure and is used for
        intros above maps/tables.
      </p>
    </div>
  ),
}

