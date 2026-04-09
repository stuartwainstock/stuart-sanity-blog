import type {SiteSettings} from '@/lib/types'

export const minimalSiteSettings: SiteSettings = {
  title: 'Stuart’s site',
  description: 'A modern blog built with Next.js and Sanity.',
}

export const fullSiteSettings: SiteSettings = {
  title: 'Stuart’s site',
  description: 'A modern blog built with Next.js and Sanity.',
  social: {
    twitter: 'example',
    github: 'example',
    linkedin: 'example',
  },
  footer: {
    copyright: '© 2026 Stuart Wainstock',
    sections: [
      {
        title: 'Projects',
        links: [
          {title: 'Runs', url: '/runs', external: false},
          {title: 'Pileated Watch', url: '/pileated-watch', external: false},
        ],
      },
      {
        title: 'Elsewhere',
        links: [
          {title: 'GitHub', url: 'https://github.com/example', external: true},
          {title: 'LinkedIn', url: 'https://linkedin.com/in/example', external: true},
        ],
      },
    ],
  },
}

