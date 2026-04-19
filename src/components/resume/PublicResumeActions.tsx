import type { FC } from 'react'
import { Mail, Phone, Linkedin, Github, ExternalLink } from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { contactLinks, fullName } from '@/lib/resumeFormat'
import type { ResumeData } from '@/types/resume'
import { LeetCodeGlyph, WhatsappGlyph } from './BrandIcons'

type ResumePersonal = ResumeData['personal']

interface ActionItem {
  key: string
  href: string
  label: string
  external: boolean
  Icon: FC<{ className?: string }>
}

export interface PublicResumeActionsProps {
  personal: ResumePersonal
}

export default function PublicResumeActions({ personal }: PublicResumeActionsProps) {
  const isMobile = useIsMobile()
  const links = contactLinks(personal)
  const name = fullName(personal) || 'this candidate'
  const byKind = (k: string) => links.find((l) => l.kind === k)

  const items: ActionItem[] = []

  const email = byKind('email')
  if (email?.href) {
    items.push({ key: 'email', href: email.href, label: `Email ${name}`, external: false, Icon: Mail })
  }

  const phone = byKind('phone')
  if (phone?.href && isMobile) {
    items.push({ key: 'phone', href: phone.href, label: `Call ${name}`, external: false, Icon: Phone })
  }

  const digits = (personal.phone ?? '').replace(/\D/g, '')
  if (digits.length >= 7) {
    items.push({
      key: 'whatsapp',
      href: `https://wa.me/${digits}`,
      label: `Message ${name} on WhatsApp`,
      external: true,
      Icon: WhatsappGlyph,
    })
  }

  const linkedin = byKind('linkedin')
  if (linkedin?.href) {
    items.push({ key: 'linkedin', href: linkedin.href, label: `${name} on LinkedIn`, external: true, Icon: Linkedin })
  }

  const github = byKind('github')
  if (github?.href) {
    items.push({ key: 'github', href: github.href, label: `${name} on GitHub`, external: true, Icon: Github })
  }

  const leetcode = byKind('leetcode')
  if (leetcode?.href) {
    items.push({ key: 'leetcode', href: leetcode.href, label: `${name} on LeetCode`, external: true, Icon: LeetCodeGlyph })
  }

  const portfolio = byKind('portfolio')
  if (portfolio?.href) {
    items.push({
      key: 'portfolio',
      href: portfolio.href,
      label: `${name}'s portfolio`,
      external: true,
      Icon: ExternalLink,
    })
  }

  if (items.length === 0) return null

  return (
    <nav aria-label="Contact actions" className="border-b border-border/60 bg-background/40">
      <ul className="mx-auto flex max-w-[820px] flex-wrap items-center justify-center gap-2 px-4 py-3">
        {items.map((it) => (
          <li key={it.key}>
            <a
              href={it.href}
              {...(it.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              aria-label={it.label}
              title={it.label}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary transition-colors hover:border-accent/50 hover:text-accent"
            >
              <it.Icon className="h-4 w-4" />
              <span className="sr-only">{it.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
