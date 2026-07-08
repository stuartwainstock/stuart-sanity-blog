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
    baseHeadingLevel: {control: {type: 'number', min: 1, max: 6}},
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

export const UnderPageH1: Story = {
  args: {
    pageBodyTypography: true,
    baseHeadingLevel: 2,
  },
}

export const WithImage: Story = {
  args: {
    value: portableTextWithImage,
  },
}

