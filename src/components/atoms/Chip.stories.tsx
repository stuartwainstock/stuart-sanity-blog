import {Fragment} from 'react'
import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import Chip from '@/components/atoms/Chip'
import {MEDIA_TYPE_LABELS} from '@/lib/resources/labels'

const meta = {
  title: 'Atoms/Chip',
  component: Chip,
  tags: ['autodocs'],
  args: {
    children: 'example.com',
  },
} satisfies Meta<typeof Chip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Capitalize: Story = {
  args: {
    children: 'article',
    capitalize: true,
  },
}

/** Reference for `getMediaTypeLabel` / grouped reading-list sections. */
export const MediaTypeLabelMap: Story = {
  render: () => (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      {Object.entries(MEDIA_TYPE_LABELS).map(([key, label]) => (
        <Fragment key={key}>
          <dt className="font-mono text-gray-600">{key}</dt>
          <dd className="text-gray-900">{label}</dd>
        </Fragment>
      ))}
    </dl>
  ),
}
