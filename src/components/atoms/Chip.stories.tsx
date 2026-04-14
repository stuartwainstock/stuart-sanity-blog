import {Fragment} from 'react'
import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import Chip from '@/components/atoms/Chip'
import {MEDIA_TYPE_LABELS} from '@/lib/resources/labels'
import s from './Chip.stories.module.css'

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
    <dl className={s.dl}>
      {Object.entries(MEDIA_TYPE_LABELS).map(([key, label]) => (
        <Fragment key={key}>
          <dt className={s.dt}>{key}</dt>
          <dd className={s.dd}>{label}</dd>
        </Fragment>
      ))}
    </dl>
  ),
}
