import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import SpeakingEngagements from '@/components/organisms/SpeakingEngagements'
import {engagementsFixture} from '@/stories/fixtures/engagements'

const meta = {
  title: 'Organisms/SpeakingEngagements',
  component: SpeakingEngagements,
  tags: ['autodocs'],
} satisfies Meta<typeof SpeakingEngagements>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    engagements: engagementsFixture,
  },
}

export const Empty: Story = {
  args: {
    engagements: [],
  },
}

