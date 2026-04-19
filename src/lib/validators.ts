/**
 * Pure validators for form fields. Each returns `undefined` for "valid"
 * or a user-facing error message. Callers pair them with a touched-state
 * hook so errors only surface after a field has been blurred.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(v: string): string | undefined {
  if (!v.trim()) return undefined
  return EMAIL_RE.test(v.trim()) ? undefined : 'Enter a valid email address.'
}

/** Keep digits, spaces, hyphens, parens, dots — strip everything else. */
export function sanitizePhoneLocal(v: string): string {
  return v.replace(/[^\d\s\-().]/g, '')
}

export function validatePhoneLocal(v: string): string | undefined {
  const trimmed = v.trim()
  if (!trimmed) return undefined
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 7) return 'Phone number looks too short.'
  if (digits.length > 15) return 'Phone number looks too long.'
  return undefined
}

/**
 * Accept URLs with or without scheme, and with or without `www`. If a
 * `domainHint` is passed (e.g. `linkedin.com`), require the URL's host
 * to include it — a stricter check that catches typos like "linkdin.com".
 */
export function validateUrl(v: string, domainHint?: string): string | undefined {
  const trimmed = v.trim()
  if (!trimmed) return undefined
  let url: URL
  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    url = new URL(withScheme)
  } catch {
    return 'Enter a valid URL.'
  }
  // Require a dot in the hostname so bare words like "foo" don't pass.
  if (!url.hostname.includes('.')) return 'Enter a valid URL.'
  if (domainHint) {
    const host = url.hostname.toLowerCase()
    if (!host.includes(domainHint.toLowerCase())) {
      return `URL should be on ${domainHint}.`
    }
  }
  return undefined
}

export function validateMaxLength(v: string, max: number): string | undefined {
  return v.length > max ? `Keep this under ${max} characters.` : undefined
}

/** Compose multiple validators; the first error wins. */
export function composeValidators(
  ...validators: Array<(v: string) => string | undefined>
): (v: string) => string | undefined {
  return (v) => {
    for (const fn of validators) {
      const err = fn(v)
      if (err) return err
    }
    return undefined
  }
}
