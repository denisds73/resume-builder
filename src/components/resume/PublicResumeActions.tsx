import type { FC } from 'react'
import { motion } from 'framer-motion'
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

function Pill({ item }: { item: ActionItem }) {
  return (
    <a
      href={item.href}
      {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      aria-label={item.label}
      title={item.label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary transition-colors hover:border-accent/50 hover:text-accent"
    >
      <item.Icon className="h-4 w-4" />
      <span className="sr-only">{item.label}</span>
    </a>
  )
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

  // WhatsApp number resolution:
  //   1. If the candidate set an explicit `whatsapp` field AND opted out of
  //      phone-as-whatsapp (phoneIsWhatsapp === false), use it.
  //   2. Otherwise, if phone-as-whatsapp is still implicitly/explicitly true,
  //      fall back to `phone`.
  // Either source must start with `+` and have >= 7 digits — wa.me rejects
  // numbers without a country code, so we hide the button instead of
  // producing a dead link.
  const phoneIsWhatsapp = personal.phoneIsWhatsapp !== false
  const rawPhone = (personal.phone ?? '').trim()
  const rawWhatsapp = (personal.whatsapp ?? '').trim()
  const waSource = !phoneIsWhatsapp && rawWhatsapp ? rawWhatsapp : phoneIsWhatsapp ? rawPhone : ''
  const waDigits = waSource.replace(/\D/g, '')
  if (waSource.startsWith('+') && waDigits.length >= 7) {
    items.push({
      key: 'whatsapp',
      href: `https://wa.me/${waDigits}`,
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
    <>
      {/*
        Mobile / narrow-desktop (< 1024px): fixed bottom bar. Stays in the
        thumb zone, doesn't compete with the sticky top header for vertical
        real estate, and persists regardless of scroll depth. Semi-transparent
        with backdrop-blur so the final page of the resume remains partially
        visible underneath.
      */}
      <nav
        aria-label="Contact actions"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto flex max-w-[820px] flex-wrap items-center justify-center gap-2 px-4 py-3">
          {items.map((it) => (
            <li key={it.key}>
              <Pill item={it} />
            </li>
          ))}
        </ul>
      </nav>

      {/*
        Desktop (≥ 1024px): fixed rail anchored ~56px to the left of the
        820px preview (not the viewport edge), so the pills stay visually
        tethered to the candidate's document rather than floating in open
        space on ultrawide monitors. `max(24px, …)` guarantees a minimum
        24px viewport gutter at the lg breakpoint itself.

        Math: preview is 820px centered via mx-auto. Its left edge sits at
        (50vw - 410px). We want the rail's right edge 16px before that,
        and the pill is 40px wide, so:
          rail left = 50vw - 410 - 16 - 40 = 50vw - 466
      */}
      <motion.nav
        aria-label="Contact actions"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { delayChildren: 0.15, staggerChildren: 0.05 } } }}
        style={{ left: 'max(24px, calc(50vw - 466px))' }}
        className="fixed top-1/2 z-30 hidden -translate-y-1/2 lg:block"
      >
        <motion.ul className="flex flex-col gap-2" role="list">
          {items.map((it) => (
            <motion.li
              key={it.key}
              variants={{
                hidden: { opacity: 0, x: -12 },
                show: { opacity: 1, x: 0 },
              }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <Pill item={it} />
            </motion.li>
          ))}
        </motion.ul>
      </motion.nav>
    </>
  )
}
