export const RESERVED_HANDLES = new Set([
  'admin', 'api', 'r', 'app', 'settings', 'new', 'profile',
  'login', 'signup', 'share', 'help', 'about', 'terms', 'privacy',
])

const HANDLE_RE = /^[a-z0-9][a-z0-9-]{1,22}[a-z0-9]$/
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$/

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug)
}

export interface HandleError {
  ok: false
  reason: 'too-short' | 'too-long' | 'invalid-chars' | 'reserved'
}
export interface HandleOk { ok: true }
export type HandleValidation = HandleOk | HandleError

export function validateHandle(handle: string): HandleValidation {
  if (handle.length < 3) return { ok: false, reason: 'too-short' }
  if (handle.length > 24) return { ok: false, reason: 'too-long' }
  if (!HANDLE_RE.test(handle)) return { ok: false, reason: 'invalid-chars' }
  if (RESERVED_HANDLES.has(handle)) return { ok: false, reason: 'reserved' }
  return { ok: true }
}

export function handleErrorMessage(reason: HandleError['reason']): string {
  switch (reason) {
    case 'too-short':    return 'Handle must be at least 3 characters.'
    case 'too-long':     return 'Handle must be 24 characters or fewer.'
    case 'invalid-chars':return 'Only lowercase letters, numbers, and hyphens. No leading/trailing hyphens.'
    case 'reserved':     return 'That handle is reserved. Try another.'
  }
}
