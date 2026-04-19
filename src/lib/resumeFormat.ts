import type { ResumeData } from '@/types/resume'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function formatDateRange(start: string | null, end: string | null): string {
  const a = formatMonthYear(start)
  const b = end === null && start ? 'present' : formatMonthYear(end)
  if (a && b) return `${a} - ${b}`
  return a || b || ''
}

export function formatMonthYear(value: string | null): string {
  if (!value) return ''
  const [year, month] = value.split('-')
  const m = Number(month)
  if (!year) return ''
  if (!m || m < 1 || m > 12) return year
  return `${MONTHS[m - 1]} ${year}`
}

export function fullName(personal: ResumeData['personal']): string {
  return [personal.firstName, personal.lastName].filter(Boolean).join(' ').trim()
}

export type ContactKind = 'phone' | 'email' | 'location' | 'portfolio' | 'linkedin' | 'leetcode' | 'github'

export interface ContactLink {
  kind: ContactKind
  label: string
  href?: string
}

/**
 * Turn a profile URL into a compact handle suitable for a printed resume.
 * `linkedin.com/in/flaviodenis` → `in/flaviodenis`
 * `github.com/flaviodenis` → `flaviodenis`
 * `leetcode.com/u/flaviodenis` → `flaviodenis`
 * Portfolio: hostname (without leading `www.`)
 * Falls back to the raw value if URL parsing fails.
 */
function extractHandle(
  raw: string,
  kind: 'portfolio' | 'linkedin' | 'github' | 'leetcode',
): string {
  const value = raw.trim()
  if (!value) return ''
  try {
    const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^\/+/, '')}`
    const u = new URL(withScheme)
    const host = u.hostname.replace(/^www\./, '')
    const path = u.pathname.replace(/^\/+|\/+$/g, '')
    switch (kind) {
      case 'portfolio':
        return host
      case 'linkedin':
        // Keep the first two path segments ("in/foo", "pub/john-doe-123").
        return path ? path.split('/').slice(0, 2).join('/') : host
      case 'github':
        return path ? path.split('/')[0] : host
      case 'leetcode':
        // LeetCode profiles are `/u/<handle>`; strip the `u/` prefix.
        return path ? path.replace(/^u\//, '').split('/')[0] : host
    }
  } catch {
    // Unparseable — show the raw trimmed value so users never see empty space.
    return value
  }
}

export function contactLinks(personal: ResumeData['personal']): ContactLink[] {
  const items: ContactLink[] = []

  const pushLink = (
    kind: 'portfolio' | 'linkedin' | 'github' | 'leetcode',
    raw: string | undefined,
  ) => {
    const value = (raw ?? '').trim()
    if (!value) return
    const href = /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^\/+/, '')}`
    items.push({ kind, label: extractHandle(value, kind), href })
  }

  if (personal.phone?.trim()) {
    const phone = personal.phone.trim()
    items.push({ kind: 'phone', label: phone, href: `tel:${phone.replace(/\s+/g, '')}` })
  }
  if (personal.email?.trim()) {
    const email = personal.email.trim()
    items.push({ kind: 'email', label: email, href: `mailto:${email}` })
  }
  if (personal.location?.trim()) {
    items.push({ kind: 'location', label: personal.location.trim() })
  }
  pushLink('portfolio', personal.website)
  pushLink('linkedin', personal.linkedin)
  pushLink('leetcode', personal.leetcode)
  pushLink('github', personal.github)

  return items
}

export function ensureHref(url: string | undefined | null): string | null {
  const trimmed = (url ?? '').trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^mailto:|^tel:/i.test(trimmed)) return trimmed
  return `https://${trimmed.replace(/^\/+/, '')}`
}

export function pdfFileName(personal: ResumeData['personal']): string {
  const base = [personal.firstName, personal.lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join('_')
  return `${base || 'Resume'}_Resume.pdf`
}
