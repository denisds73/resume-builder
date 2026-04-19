import { useCallback, useState } from 'react'

export interface UseFieldReturn {
  /** Error message to display, or `undefined` if the field is valid or hasn't been touched yet. */
  error: string | undefined
  /** Whether the user has blurred the field at least once. */
  touched: boolean
  /** Bind to the input's onBlur to enable error reveal after first blur. */
  onBlur: () => void
  /** Imperatively mark touched (useful when running a final validate pass). */
  markTouched: () => void
}

/**
 * Tiny validation helper: track whether a field has been blurred, and
 * surface errors only once it has. Validators run on every render (pure
 * functions), so as the user edits after first blur the error updates
 * live — showing up when they type something invalid and clearing the
 * instant they fix it.
 */
export function useField(
  value: string,
  validator?: (v: string) => string | undefined,
): UseFieldReturn {
  const [touched, setTouched] = useState(false)
  const error = touched && validator ? validator(value) : undefined
  const onBlur = useCallback(() => setTouched(true), [])
  const markTouched = onBlur
  return { error, touched, onBlur, markTouched }
}
