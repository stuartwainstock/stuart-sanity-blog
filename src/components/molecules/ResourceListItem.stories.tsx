import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import ResourceListItem from '@/components/molecules/ResourceListItem'
import {resourcesFixture} from '@/stories/fixtures/resources'

const meta = {
  title: 'Molecules/ResourceListItem',
  component: ResourceListItem,
  tags: ['autodocs'],
} satisfies Meta<typeof ResourceListItem>

export default meta
type Story = StoryObj<typeof meta>

export const WithLink: Story = {
  args: {
    resource: resourcesFixture[0],
  },
}

export const WithoutUrl: Story = {
  args: {
    resource: {
      ...resourcesFixture[0],
      url: '',
    },
  },
}
