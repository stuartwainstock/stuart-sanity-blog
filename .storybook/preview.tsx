import type {Preview} from '@storybook/nextjs-vite'

import '../src/app/globals.css'

const withSiteFrame: Preview['decorators'][number] = (Story) => {
  return (
    <div className="min-h-screen bg-[#e8e8e8] px-8 py-10">
      <div className="max-w-5xl mx-auto">
        <Story />
      </div>
    </div>
  )
}

const preview: Preview = {
  decorators: [withSiteFrame],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
}

export default preview

