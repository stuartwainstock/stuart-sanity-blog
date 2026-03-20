import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'ojv692hs',
    dataset: 'production'
  },
  deployment: {
    appId: 'im5g0o41914b5bf3gmtyjx1f',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/cli#auto-updates
     */
    autoUpdates: true,
  }
})
