import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import ListGroupHeading from '@/components/atoms/ListGroupHeading'

const meta = {
  title: 'Atoms/ListGroupHeading',
  component: ListGroupHeading,
  tags: ['autodocs'],
  args: {
    children: 'Articles',
    id: 'demo-heading',
  },
} satisfies Meta<typeof ListGroupHeading>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AsH2: Story = {
  args: {
    as: 'h2',
    children: 'Books',
  },
}
