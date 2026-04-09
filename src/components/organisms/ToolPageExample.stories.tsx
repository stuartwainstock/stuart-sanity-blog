import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import Link from 'next/link'
import PageHeroWithDataSource from '@/components/molecules/PageHeroWithDataSource'
import PortableText from '@/components/molecules/PortableText'
import Button from '@/components/atoms/Button'
import {portableTextBasic} from '@/stories/fixtures/portableText'
import {pageBodyTypography, pageDataSourceLink, pageSectionHeading} from '@/lib/pageTypography'

const meta = {
  title: 'Organisms/Examples/ToolPage',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    controls: {hideNoControlsWarning: true},
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const FlightsToolPage: Story = {
  render: () => (
    <div>
      <PageHeroWithDataSource
        titleId="tool-title"
        title="Flights"
        dataSource={
          <p>
            Data source:{' '}
            <a
              className={pageDataSourceLink}
              href="https://www.tripit.com/"
              target="_blank"
              rel="noreferrer"
            >
              TripIt
            </a>
            .
          </p>
        }
      >
        <div className={pageBodyTypography}>
          <p className="mb-0 text-inherit max-w-4xl">
            This story demonstrates an organism-level composition of molecules and atoms.
          </p>
        </div>
      </PageHeroWithDataSource>

      <main className="max-w-5xl mx-auto px-8 pt-2 pb-16 space-y-10">
        <section className="space-y-4">
          <h2 className={pageSectionHeading}>Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button tone="brand">Connect TripIt</Button>
            <Button variant="secondary">Sync</Button>
            <Link href="/" className={pageDataSourceLink}>
              Home
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className={pageSectionHeading}>Body</h2>
          <div className={pageBodyTypography}>
            <PortableText value={portableTextBasic as never[]} pageBodyTypography />
          </div>
        </section>
      </main>
    </div>
  ),
}

