import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import Footer from '@/components/organisms/Footer'
import {fullSiteSettings, minimalSiteSettings} from '@/stories/fixtures/siteSettings'

const meta = {
  title: 'Organisms/Footer',
  component: Footer,
  tags: ['autodocs'],
} satisfies Meta<typeof Footer>

export default meta
type Story = StoryObj<typeof meta>

export const Minimal: Story = {
  args: {
    siteSettings: minimalSiteSettings,
  },
}

export const Full: Story = {
  args: {
    siteSettings: fullSiteSettings,
  },
}

