import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import Button from '@/components/atoms/Button'

const meta = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {control: 'radio', options: ['primary', 'secondary', 'ghost']},
    tone: {control: 'radio', options: ['neutral', 'brand']},
    size: {control: 'radio', options: ['sm', 'md']},
    disabled: {control: 'boolean'},
    children: {control: 'text'},
  },
  args: {
    children: 'Button',
    variant: 'primary',
    tone: 'neutral',
    size: 'md',
    disabled: false,
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Neutral: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-3">
      <Button {...args} tone="neutral" variant="primary">
        Primary
      </Button>
      <Button {...args} tone="neutral" variant="secondary">
        Secondary
      </Button>
      <Button {...args} tone="neutral" variant="ghost">
        Ghost
      </Button>
    </div>
  ),
}

export const Brand: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-3">
      <Button {...args} tone="brand" variant="primary">
        Primary
      </Button>
      <Button {...args} tone="brand" variant="secondary">
        Secondary
      </Button>
      <Button {...args} tone="brand" variant="ghost">
        Ghost
      </Button>
    </div>
  ),
}

