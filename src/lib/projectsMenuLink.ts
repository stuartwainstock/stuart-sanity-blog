/** True when href should use a plain anchor (opens off-site). */
export function isExternalProjectsHref(href: string): boolean {
  return /^https?:\/\//i.test(href.trim())
}

/** Internal paths (/…) or absolute http(s) URLs. */
export function isValidProjectsHref(href: string): boolean {
  const t = href.trim()
  if (!t) return false
  if (isExternalProjectsHref(t)) {
    try {
      const u = new URL(t)
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      return false
    }
  }
  return t.startsWith('/') && !t.startsWith('//')
}

export type ProjectsMenuNavItem = {
  _key: string
  title: string
  href: string
  external: boolean
}

export function normalizeProjectsMenuItems(
  items: Array<{_key: string; title?: string; href?: string}> | undefined,
): ProjectsMenuNavItem[] {
  if (!items?.length) return []
  const out: ProjectsMenuNavItem[] = []
  for (const item of items) {
    const title = item.title?.trim()
    const href = item.href?.trim()
    if (!title || !href || !isValidProjectsHref(href)) continue
    out.push({
      _key: item._key,
      title,
      href,
      external: isExternalProjectsHref(href),
    })
  }
  return out
}
