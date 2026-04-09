import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import ReadingList from '@/components/organisms/ReadingList'
import {resourcesFixture} from '@/stories/fixtures/resources'

const meta = {
  title: 'Organisms/ReadingList',
  component: ReadingList,
  tags: ['autodocs'],
} satisfies Meta<typeof ReadingList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    resources: resourcesFixture,
  },
}

export const Empty: Story = {
  args: {
    resources: [],
  },
}

