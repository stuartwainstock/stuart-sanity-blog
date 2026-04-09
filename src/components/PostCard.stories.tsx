import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import PostCard from '@/components/molecules/PostCard'
import {basePost, featuredPost} from '@/stories/fixtures/posts'

const meta = {
  title: 'Molecules/PostCard',
  component: PostCard,
  tags: ['autodocs'],
  argTypes: {
    featured: {control: 'boolean'},
  },
} satisfies Meta<typeof PostCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {post: basePost},
}

export const Featured: Story = {
  args: {post: featuredPost, featured: true},
}

export const NoImage: Story = {
  args: {post: {...featuredPost, mainImage: undefined}, featured: true},
}

