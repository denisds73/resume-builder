import { useEffect, type RefObject } from 'react'

/**
 * Click-outside + Escape dismissal for popovers and menus. Replaces the
 * same effect duplicated across 8+ components — every dropdown in the app
 * was reimplementing this with subtle differences (mousedown vs click,
 * Escape coverage, capture vs bubble). Use one source.
 *
 * Active only when `open` is true so listeners don't accumulate when the
 * popover is closed.
 */
export function useDismiss(
  open: boolean,
  onDismiss: () => void,
  ref: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const node = ref.current
      if (node && !node.contains(e.target as Node)) onDismiss()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onDismiss, ref])
}
