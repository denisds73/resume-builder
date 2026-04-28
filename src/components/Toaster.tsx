import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useToasts, toastDuration, type ToastItem } from '@/lib/toast'
import { MOTION, EASE } from '@/lib/motion'

export default function Toaster() {
  const { toasts, dismiss } = useToasts()
  const reduce = useReducedMotion()

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 left-4 right-4 z-[10000] flex flex-col items-center gap-2 sm:bottom-6 sm:left-auto sm:right-6 sm:items-end"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastCard
            key={t.id}
            toast={t}
            onDismiss={() => dismiss(t.id)}
            reduce={!!reduce}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastCard({
  toast: t,
  onDismiss,
  reduce,
}: {
  toast: ToastItem
  onDismiss: () => void
  reduce: boolean
}) {
  const [paused, setPaused] = useState(false)
  const remainingRef = useRef(toastDuration)
  const startRef = useRef<number>(0)

  useEffect(() => {
    if (paused) {
      if (startRef.current > 0) {
        remainingRef.current -= Date.now() - startRef.current
      }
      return
    }
    startRef.current = Date.now()
    const id = window.setTimeout(onDismiss, Math.max(0, remainingRef.current))
    return () => window.clearTimeout(id)
  }, [paused, onDismiss])

  const Icon =
    t.kind === 'success' ? CheckCircle2 : t.kind === 'error' ? AlertCircle : Info
  const accent =
    t.kind === 'success'
      ? 'text-emerald-400'
      : t.kind === 'error'
      ? 'text-red-400'
      : 'text-accent'
  const live: 'polite' | 'assertive' = t.kind === 'error' ? 'assertive' : 'polite'

  return (
    <motion.div
      role={t.kind === 'error' ? 'alert' : 'status'}
      aria-live={live}
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-border bg-bg-card/95 px-4 py-3 text-sm text-text-primary shadow-lg shadow-black/40 backdrop-blur sm:w-80"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: reduce ? 0 : MOTION.base, ease: EASE.out }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${accent}`} aria-hidden />
      <p className="flex-1 leading-snug">{t.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-1 rounded p-1 text-text-muted transition-colors hover:bg-surface hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  )
}
