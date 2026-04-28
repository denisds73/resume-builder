import { useEffect, useState } from 'react'

export type ToastKind = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  kind: ToastKind
  message: string
}

const MAX_TOASTS = 5
const DEFAULT_DURATION_MS = 4000

let queue: ToastItem[] = []
const listeners = new Set<(items: ToastItem[]) => void>()

function emit() {
  for (const l of listeners) l(queue)
}

function push(kind: ToastKind, message: string) {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  queue = [...queue, { id, kind, message }]
  if (queue.length > MAX_TOASTS) queue = queue.slice(queue.length - MAX_TOASTS)
  emit()
}

function dismissId(id: string) {
  queue = queue.filter((t) => t.id !== id)
  emit()
}

export const toast = {
  success: (message: string) => push('success', message),
  error: (message: string) => push('error', message),
  info: (message: string) => push('info', message),
}

export function useToasts() {
  const [items, setItems] = useState<ToastItem[]>(queue)
  useEffect(() => {
    const l = (next: ToastItem[]) => setItems(next)
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])
  return { toasts: items, dismiss: dismissId }
}

export const toastDuration = DEFAULT_DURATION_MS
