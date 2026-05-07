'use client'

import {useEffect} from 'react'

function isDebugEnabled(): boolean {
  try {
    const u = new URL(window.location.href)
    return u.searchParams.get('debugOverflow') === '1'
  } catch {
    return false
  }
}

function cssPath(el: Element): string {
  const parts: string[] = []
  let cur: Element | null = el
  while (cur && parts.length < 6) {
    const id = (cur as HTMLElement).id ? `#${(cur as HTMLElement).id}` : ''
    const cls =
      (cur as HTMLElement).className && typeof (cur as HTMLElement).className === 'string'
        ? '.' + (cur as HTMLElement).className.trim().split(/\s+/).slice(0, 2).join('.')
        : ''
    parts.unshift(`${cur.tagName.toLowerCase()}${id}${cls}`)
    cur = cur.parentElement
  }
  return parts.join(' > ')
}

export function OverflowDebug() {
  useEffect(() => {
    if (!isDebugEnabled()) return

    const root = document.documentElement
    const report = () => {
      const vw = window.innerWidth
      const sw = root.scrollWidth
      console.log('[overflow-debug] viewport', vw, 'scrollWidth', sw)

      const offenders: {el: Element; right: number; left: number; w: number; path: string}[] = []
      for (const el of Array.from(document.body.querySelectorAll('*'))) {
        const rect = el.getBoundingClientRect()
        if (rect.width <= vw) continue
        if (rect.left < -1 || rect.right > vw + 1) {
          offenders.push({
            el,
            left: rect.left,
            right: rect.right,
            w: rect.width,
            path: cssPath(el),
          })
        }
      }

      offenders.sort((a, b) => b.w - a.w)
      console.log('[overflow-debug] top offenders', offenders.slice(0, 10))
    }

    report()
    window.addEventListener('resize', report)
    return () => window.removeEventListener('resize', report)
  }, [])

  return null
}

