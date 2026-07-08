import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {HubPageHeader} from '@/components/molecules/HubPageHeader'
import PortableText from '@/components/molecules/PortableText'
import ReadingList from '@/components/organisms/ReadingList'
import {portableTextBasic} from '@/stories/fixtures/portableText'
import {resourcesFixture} from '@/stories/fixtures/resources'
import {hubPageWrap, pageProse, pageShellBg} from '@/lib/pageTypography'
import styles from './HubPageExample.stories.module.css'

const meta = {
  title: 'Organisms/Examples/HubPage',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
**Default layout for content hub pages** — use this pattern for new CMS-driven pages and static hubs.

| Shell | \`pageShellBg\` + \`hubPageWrap\` |
| Header | \`HubPageHeader\` (title + optional CMS intro) |
| Body | \`pageProse\` + \`PortableText\` |
| Sections below body | \`ReadingList\`, \`SpeakingEngagements\`, etc. (\`margin-top: 2.5rem\`) |

**Routes using this pattern:** \`/lab\`, \`/case-studies\`, CMS pages (\`/about\`, \`/reading-list\`, …).

**Do not use** \`pageBanner\` / \`pageTitleH1\` / \`pageBodyTypography\` (30px tracked body) for new hub-style pages — that legacy stack adds excessive top padding and title gaps.

**Data / tool pages** (Strava, eBird, TripIt) keep \`PageHeroWithDataSource\` + \`pageBodyTypography\` — see **Organisms/Examples/ToolPage**.

Chromatic visual regression runs against these Storybook stories; treat this file as the canonical reference when adding routes.
        `.trim(),
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const ReadingListHub: Story = {
  name: 'CMS hub (Reading List shape)',
  render: () => (
    <div className={pageShellBg}>
      <div className={hubPageWrap}>
        <HubPageHeader
          title="Reading List"
          fallbackIntro="Things I keep coming back to. Articles, books, podcasts, and videos that have shaped how I think."
        />

        <div className={styles.content}>
          <div className={pageProse}>
            <p className={styles.lead}>
              Intro copy from Sanity Portable Text uses <code>pageProse</code> (1.125rem / 1.75 line-height),
              not the 30px <code>pageBodyTypography</code> scale used on data tool pages.
            </p>
          </div>

          <ReadingList resources={resourcesFixture.slice(0, 3)} />
        </div>
      </div>
    </div>
  ),
}

export const LabHub: Story = {
  name: 'Static hub (/lab shape)',
  render: () => (
    <div className={pageShellBg}>
      <div className={hubPageWrap}>
        <HubPageHeader
          title="Lab"
          fallbackIntro="Experiments, maps, and side projects — tools built to explore data and ideas."
        />

        <ul className={styles.cardGrid}>
          {['Runs', 'Flights', 'Pileated Watch'].map((title) => (
            <li key={title} className={styles.cardPlaceholder}>
              {title}
            </li>
          ))}
        </ul>
      </div>
    </div>
  ),
}

export const CmsPageWithPortableText: Story = {
  name: 'CMS page with Portable Text body',
  render: () => (
    <div className={pageShellBg}>
      <div className={hubPageWrap}>
        <HubPageHeader title="About" />

        <div className={pageProse}>
          <PortableText value={portableTextBasic as never[]} pageBodyTypography baseHeadingLevel={2} />
        </div>
      </div>
    </div>
  ),
}
