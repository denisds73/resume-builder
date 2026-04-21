import { useCallback, useEffect, useReducer, useRef } from 'react'

interface Options {
  capacity?: number
  coalesceMs?: number
}

export interface History<T> {
  state: T
  set: (next: T | ((prev: T) => T)) => void
  commit: () => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  reset: (newInitial: T) => void
}

// Shortest dotted path at which a and b differ. If many leaves differ, the
// shared prefix is returned — still useful as a coalesce key.
function firstDiffPath(a: unknown, b: unknown, prefix = ''): string {
  if (Object.is(a, b)) return prefix
  if (a === null || b === null || typeof a !== typeof b) return prefix
  if (typeof a !== 'object') return prefix
  const aObj = a as Record<string, unknown>
  const bObj = b as Record<string, unknown>
  const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)])
  const diffKeys: string[] = []
  for (const k of keys) if (!Object.is(aObj[k], bObj[k])) diffKeys.push(k)
  if (diffKeys.length !== 1) return prefix
  const k = diffKeys[0]
  return firstDiffPath(aObj[k], bObj[k], prefix ? `${prefix}.${k}` : k)
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

interface Frame<T> {
  past: T[]
  present: T
  future: T[]
  // Path being coalesced into `present`. null means the present is already
  // committed and the next edit starts a fresh history entry.
  pendingPath: string | null
  // The "committed anchor" — the state we'd roll back to if the pending
  // entry flushes. Null when nothing is pending.
  anchor: T | null
  capacity: number
}

type Action<T> =
  | { type: 'set'; updater: T | ((prev: T) => T) }
  | { type: 'commit' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset'; value: T }

function reducer<T>(state: Frame<T>, action: Action<T>): Frame<T> {
  switch (action.type) {
    case 'set': {
      const raw =
        typeof action.updater === 'function'
          ? (action.updater as (p: T) => T)(state.present)
          : action.updater
      const next = clone(raw)
      if (Object.is(next, state.present)) return state
      const anchor = state.anchor ?? state.present
      const path = firstDiffPath(anchor, next)

      // Different field than the pending edit — flush pending first.
      if (state.pendingPath !== null && state.pendingPath !== path) {
        const newPast = [...state.past, anchor]
        const trimmed =
          newPast.length > state.capacity ? newPast.slice(-state.capacity) : newPast
        return {
          ...state,
          past: trimmed,
          present: next,
          future: [],
          pendingPath: path,
          anchor: state.present, // new anchor = the just-flushed snapshot
        }
      }

      // Same path (or nothing pending yet): update present, start/extend
      // coalesce window without pushing to past.
      return {
        ...state,
        present: next,
        pendingPath: path,
        anchor: anchor,
        future: [],
      }
    }
    case 'commit': {
      if (state.pendingPath === null || state.anchor === null) return state
      const newPast = [...state.past, state.anchor]
      const trimmed =
        newPast.length > state.capacity ? newPast.slice(-state.capacity) : newPast
      return {
        ...state,
        past: trimmed,
        pendingPath: null,
        anchor: null,
        future: [],
      }
    }
    case 'undo': {
      // A pending edit rolls back to its anchor without consuming a past entry.
      if (state.pendingPath !== null && state.anchor !== null) {
        return {
          ...state,
          present: state.anchor,
          future: [state.present, ...state.future],
          pendingPath: null,
          anchor: null,
        }
      }
      if (state.past.length === 0) return state
      const prev = state.past[state.past.length - 1]
      return {
        ...state,
        past: state.past.slice(0, -1),
        present: prev,
        future: [state.present, ...state.future],
      }
    }
    case 'redo': {
      // Flush pending first (redoing ambiguous state would be confusing).
      const base =
        state.pendingPath !== null && state.anchor !== null
          ? {
              ...state,
              past: [...state.past, state.anchor],
              pendingPath: null,
              anchor: null,
            }
          : state
      if (base.future.length === 0) return base
      const next = base.future[0]
      return {
        ...base,
        past: [...base.past, base.present],
        present: next,
        future: base.future.slice(1),
      }
    }
    case 'reset': {
      return {
        past: [],
        present: action.value,
        future: [],
        pendingPath: null,
        anchor: null,
        capacity: state.capacity,
      }
    }
  }
}

export function useHistory<T>(
  initial: T | (() => T),
  options: Options = {},
): History<T> {
  const { capacity = 50, coalesceMs = 500 } = options
  const [frame, dispatch] = useReducer(
    reducer as (state: Frame<T>, action: Action<T>) => Frame<T>,
    initial,
    (seed: T | (() => T)): Frame<T> => {
      const value = typeof seed === 'function' ? (seed as () => T)() : seed
      return {
        past: [],
        present: value,
        future: [],
        pendingPath: null,
        anchor: null,
        capacity,
      }
    },
  )

  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clearPending = useCallback(() => {
    if (pendingTimer.current) {
      clearTimeout(pendingTimer.current)
      pendingTimer.current = null
    }
  }, [])

  const set = useCallback<History<T>['set']>(
    (updater) => {
      dispatch({ type: 'set', updater })
      clearPending()
      pendingTimer.current = setTimeout(() => {
        dispatch({ type: 'commit' })
        pendingTimer.current = null
      }, coalesceMs)
    },
    [coalesceMs, clearPending],
  )

  const commit = useCallback(() => {
    clearPending()
    dispatch({ type: 'commit' })
  }, [clearPending])

  const undo = useCallback(() => {
    clearPending()
    dispatch({ type: 'undo' })
  }, [clearPending])

  const redo = useCallback(() => {
    clearPending()
    dispatch({ type: 'redo' })
  }, [clearPending])

  const reset = useCallback((newInitial: T) => {
    clearPending()
    dispatch({ type: 'reset', value: newInitial })
  }, [clearPending])

  useEffect(() => () => clearPending(), [clearPending])

  return {
    state: frame.present,
    set,
    commit,
    undo,
    redo,
    canUndo: frame.past.length > 0 || frame.pendingPath !== null,
    canRedo: frame.future.length > 0,
    reset,
  }
}
