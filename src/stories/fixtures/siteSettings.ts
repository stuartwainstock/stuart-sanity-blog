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
  projectsMenu: {
    label: 'Projects',
    href: '/lab',
    hubTitle: 'Lab',
    items: [
      {_key: 'runs', title: 'Runs', href: '/runs'},
      {_key: 'pileated', title: 'Pileated Watch', href: '/pileated-watch'},
      {_key: 'external', title: 'Other project', href: 'https://example.com/project'},
    ],
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

