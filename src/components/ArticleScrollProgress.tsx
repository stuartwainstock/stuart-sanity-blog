'use client'

import {useCallback, useEffect, useState} from 'react'

type ArticleScrollProgressProps = {
  /** ID of the element whose height defines reading length (usually the wrapping `<article>`). */
  articleId: string
}

const SIZE = 40
const STROKE = 2
const R = (SIZE - STROKE) / 2
const CX = SIZE / 2
const CY = SIZE / 2
const CIRC = 2 * Math.PI * R

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

export default function ArticleScrollProgress({articleId}: ArticleScrollProgressProps) {
  const [progress, setProgress] = useState(0)

  const update = useCallback(() => {
    const el = document.getElementById(articleId)
    if (!el) return

    const scrollY = window.scrollY
    const top = el.getBoundingClientRect().top + scrollY
    const height = el.offsetHeight
    const vh = window.innerHeight
    const denom = Math.max(1, height - vh)
    const p = clamp01((scrollY - top) / denom)
    setProgress(p)
  }, [articleId])

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => update())
    window.addEventListener('scroll', update, {passive: true})
    window.addEventListener('resize', update)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [update])

  const offset = CIRC * (1 - progress)

  return (
    <div
      className="flex justify-center"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      aria-label="Article reading progress"
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="shrink-0"
        aria-hidden="true"
      >
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          className="text-gray-200"
        />
        <g transform={`rotate(-90 ${CX} ${CY})`}>
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="var(--color-link)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-150 ease-out"
          />
        </g>
      </svg>
    </div>
  )
}
