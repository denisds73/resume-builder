import type { CSSProperties, HTMLAttributes } from 'react'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Override default tinted treatment with a custom background. */
  style?: CSSProperties
}

/**
 * Shimmer block tuned to the dark canvas. Single moving highlight rather
 * than a pulse — calmer in periphery, reads as "this will become content"
 * rather than "the screen is broken." Honors prefers-reduced-motion via
 * the existing globals.css rule.
 */
export default function Skeleton({ className = '', style, ...rest }: SkeletonProps) {
  return (
    <div
      role="presentation"
      aria-hidden
      className={`skeleton-shimmer relative overflow-hidden rounded-md bg-surface/60 ${className}`}
      style={style}
      {...rest}
    />
  )
}
