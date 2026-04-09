import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import Link from 'next/link'
import PageHeroWithDataSource from '@/components/molecules/PageHeroWithDataSource'
import {pageBodyTypography, pageDataSourceLink} from '@/lib/pageTypography'

const meta = {
  title: 'Molecules/PageHeroWithDataSource',
  component: PageHeroWithDataSource,
  tags: ['autodocs'],
  args: {
    titleId: 'hero-title',
    title: 'Flights',
    dataSource: (
      <p>
        Data source:{' '}
        <a className={pageDataSourceLink} href="https://www.tripit.com/" target="_blank" rel="noreferrer">
          TripIt
        </a>
        .
      </p>
    ),
  },
} satisfies Meta<typeof PageHeroWithDataSource>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithIntro: Story = {
  args: {
    children: (
      <div className={pageBodyTypography}>
        <p className="mb-0 text-inherit max-w-4xl">
          A short intro below the attribution. Example internal link:{' '}
          <Link href="/" className={pageDataSourceLink}>
            Home
          </Link>
          .
        </p>
      </div>
    ),
  },
}

