/**
 * Shared motion tokens. Most enter/exit transitions in the app should use
 * one of these so the family animates at consistent tempo. Replace
 * literal durations (0.12 / 0.15 / 0.18 / 0.22) at call sites with
 * `MOTION.fast/base/slow`.
 */
export const MOTION = {
  /** Snappy popover/menu pop-in. */
  fast: 0.12,
  /** Modal backdrop fade. */
  backdrop: 0.15,
  /** Default panel/dialog enter — the most common token. */
  base: 0.18,
  /** Slower hero reveals (welcome dialog, marquee list mounts). */
  slow: 0.22,
} as const

export const EASE = {
  /** The standard ease-out for entering elements. */
  out: 'easeOut' as const,
}
