import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import ResourceMetaChips from '@/components/molecules/ResourceMetaChips'
import {resourcesFixture} from '@/stories/fixtures/resources'

const meta = {
  title: 'Molecules/ResourceMetaChips',
  component: ResourceMetaChips,
  tags: ['autodocs'],
} satisfies Meta<typeof ResourceMetaChips>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    resource: resourcesFixture[0],
  },
}

export const Minimal: Story = {
  args: {
    resource: {
      mediaType: 'podcast',
      addedDate: '2026-01-15T12:00:00.000Z',
    },
  },
}
