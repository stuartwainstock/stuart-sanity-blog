import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import PortableText from '@/components/molecules/PortableText'
import {portableTextBasic, portableTextWithImage} from '@/stories/fixtures/portableText'

const meta = {
  title: 'Molecules/PortableText',
  component: PortableText,
  tags: ['autodocs'],
  args: {
    value: portableTextBasic,
  },
  argTypes: {
    pageBodyTypography: {control: 'boolean'},
  },
} satisfies Meta<typeof PortableText>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const PageBodyTypography: Story = {
  args: {
    pageBodyTypography: true,
  },
}

export const WithImage: Story = {
  args: {
    value: portableTextWithImage,
  },
}

