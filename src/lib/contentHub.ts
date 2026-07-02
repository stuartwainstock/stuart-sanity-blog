import type {ContentHubConfig, SanityImage} from '@/lib/types'
import {isExternalProjectsHref, isValidProjectsHref} from '@/lib/projectsMenuLink'

export type {ContentHubConfig} from '@/lib/types'

export type HubLinkItem = {
  _key: string
  title: string
  href: string
  external: boolean
  summary?: string
  coverImage?: SanityImage
}

export type HubNavLink = {
  key: string
  label: string
  href: string
  navigationOrder: number
}

export function isHubNavVisible(hub?: ContentHubConfig | null): boolean {
  if (!hub) return false
  const show = hub.showInNavigation
  if (show === 'false') return false
  return Boolean(hub.label?.trim() && hub.href?.trim())
}

export function buildHubNavLinks(
  hubs: Array<{key: string; hub?: ContentHubConfig | null}>,
): HubNavLink[] {
  const links: HubNavLink[] = []
  for (const {key, hub} of hubs) {
    if (!isHubNavVisible(hub)) continue
    const label = hub!.label!.trim()
    const href = hub!.href!.trim()
    links.push({
      key,
      label,
      href,
      navigationOrder: hub!.navigationOrder ?? 10,
    })
  }
  return links.sort((a, b) => a.navigationOrder - b.navigationOrder)
}

export function isHubLinkActive(
  pathname: string,
  href: string,
  childPaths: string[] = [],
): boolean {
  if (pathname === href) return true
  return childPaths.some(
    (child) => pathname === child || pathname.startsWith(`${child}/`),
  )
}

export function normalizeHubLinkItems(
  items:
    | Array<{
        _key: string
        title?: string
        href?: string
        summary?: string
        coverImage?: SanityImage
      }>
    | undefined,
): HubLinkItem[] {
  if (!items?.length) return []
  const out: HubLinkItem[] = []
  for (const item of items) {
    const title = item.title?.trim()
    const href = item.href?.trim()
    if (!title || !href || !isValidProjectsHref(href)) continue
    const summary = item.summary?.trim()
    out.push({
      _key: item._key,
      title,
      href,
      external: isExternalProjectsHref(href),
      summary: summary || undefined,
      coverImage: item.coverImage,
    })
  }
  return out
}

export function resolveHubTitle(hub?: ContentHubConfig | null, fallback = 'Hub'): string {
  return hub?.hubTitle?.trim() || hub?.label?.trim() || fallback
}
