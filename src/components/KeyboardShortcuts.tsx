import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Keyboard, X } from 'lucide-react'
import { KBD_OPEN_EVENT } from '@/lib/keyboardShortcuts'

interface Shortcut {
  keys: string[]
  label: string
}

interface Group {
  title: string
  items: Shortcut[]
}

const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform)
const mod = isMac ? '⌘' : 'Ctrl'
const shift = isMac ? '⇧' : 'Shift'

const GROUPS: Group[] = [
  {
    title: 'Editing',
    items: [
      { keys: [mod, 'Z'], label: 'Undo' },
      { keys: [mod, shift, 'Z'], label: 'Redo' },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { keys: ['←'], label: 'Previous section' },
      { keys: ['→'], label: 'Next section' },
    ],
  },
  {
    title: 'General',
    items: [
      { keys: ['?'], label: 'Show this overlay' },
      { keys: ['Esc'], label: 'Close any popover or dialog' },
    ],
  },
]

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '?') {
        const t = e.target as HTMLElement | null
        if (
          t &&
          (t.tagName === 'INPUT' ||
            t.tagName === 'TEXTAREA' ||
            t.isContentEditable ||
            t.closest('[role="dialog"]') ||
            t.closest('[role="alertdialog"]'))
        ) {
          return
        }
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    const onCustom = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener(KBD_OPEN_EVENT, onCustom)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(KBD_OPEN_EVENT, onCustom)
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="kbd-title"
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full max-w-lg rounded-xl border border-border bg-bg-card p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-text-muted" />
                <h2 id="kbd-title" className="font-display text-xl text-text-primary">
                  Keyboard shortcuts
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-md p-1 text-text-muted hover:bg-surface hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {GROUPS.map((g) => (
                <div key={g.title}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {g.title}
                  </h3>
                  <ul className="space-y-1.5">
                    {g.items.map((s) => (
                      <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-text-secondary">{s.label}</span>
                        <span className="flex items-center gap-1">
                          {s.keys.map((k) => (
                            <kbd
                              key={k}
                              className="inline-flex min-w-[1.5rem] items-center justify-center rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[0.7rem] text-text-primary"
                            >
                              {k}
                            </kbd>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p className="mt-5 border-t border-border pt-4 text-xs text-text-muted">
              Press <kbd className="rounded border border-border bg-surface px-1 font-mono">?</kbd> any time outside an input.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
