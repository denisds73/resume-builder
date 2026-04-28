import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

type Side = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: Side
  /** Delay before showing on hover, in ms. Focus shows immediately. */
  delay?: number
}

const SIDE_CLS: Record<Side, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
  left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
  right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
}

export default function Tooltip({ content, children, side = 'top', delay = 350 }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const reduce = useReducedMotion()
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [])

  function show(immediate = false) {
    if (timer.current !== null) window.clearTimeout(timer.current)
    if (immediate) {
      setOpen(true)
      return
    }
    timer.current = window.setTimeout(() => setOpen(true), delay)
  }

  function hide() {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    setOpen(false)
  }

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => show()}
      onMouseLeave={hide}
      onFocus={() => show(true)}
      onBlur={hide}
      aria-describedby={open ? id : undefined}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.span
            id={id}
            role="tooltip"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            transition={{ duration: reduce ? 0 : 0.12 }}
            className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-border bg-bg-card px-2 py-1 text-xs text-text-primary shadow-lg shadow-black/40 ${SIDE_CLS[side]}`}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
