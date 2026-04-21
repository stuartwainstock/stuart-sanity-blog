'use client'

import {useEffect, useRef, useState, type ReactNode} from 'react'

type Props = {
  children: ReactNode
  /**
   * IntersectionObserver rootMargin. Use a positive top/bottom margin to mount
   * slightly before the user scrolls to the content.
   */
  rootMargin?: string
  /**
   * When true, mount immediately (useful for tests or if IntersectionObserver is unavailable).
   */
  eager?: boolean
  /**
   * What to render before mounting `children`.
   */
  fallback?: ReactNode
  className?: string
}

export default function LazyMount({
  children,
  rootMargin = '300px 0px',
  eager = false,
  fallback = null,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [mounted, setMounted] = useState(() => eager || typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    if (eager) return
    if (mounted) return
    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMounted(true)
          io.disconnect()
        }
      },
      {root: null, rootMargin},
    )

    io.observe(el)
    return () => io.disconnect()
  }, [eager, mounted, rootMargin])

  return (
    <div ref={ref} className={className}>
      {mounted ? children : fallback}
    </div>
  )
}

