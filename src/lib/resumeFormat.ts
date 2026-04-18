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

export function contactLinks(personal: ResumeData['personal']): ContactLink[] {
  const items: ContactLink[] = []
  const add = (kind: ContactKind, raw: string | undefined, label: string, schemePrefix?: string) => {
    const value = (raw ?? '').trim()
    if (!value) return
    const href = schemePrefix
      ? value
      : /^https?:\/\//i.test(value)
        ? value
        : `https://${value.replace(/^\/+/, '')}`
    items.push({
      kind,
      label,
      href: schemePrefix ? `${schemePrefix}${value}` : href,
    })
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
  add('portfolio', personal.website, 'Portfolio')
  add('linkedin', personal.linkedin, 'LinkedIn')
  add('leetcode', personal.leetcode, 'LeetCode')
  add('github', personal.github, 'GitHub')

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
