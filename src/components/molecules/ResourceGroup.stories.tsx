import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import ResourceGroup from '@/components/molecules/ResourceGroup'
import {getMediaTypeLabel} from '@/lib/resources/labels'
import {resourcesFixture} from '@/stories/fixtures/resources'

const articleResources = resourcesFixture.filter((r) => r.mediaType === 'article')

const meta = {
  title: 'Molecules/ResourceGroup',
  component: ResourceGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof ResourceGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Articles: Story = {
  args: {
    mediaType: 'article',
    groupLabel: getMediaTypeLabel('article'),
    resources: articleResources.length > 0 ? articleResources : resourcesFixture.slice(0, 1),
  },
}
