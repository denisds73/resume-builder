import type { CSSProperties, ReactNode } from 'react'
import { Phone, Mail, MapPin, Linkedin, Github, ExternalLink } from 'lucide-react'
import type { ResumeData } from '@/types/resume'
import {
  contactLinks,
  ensureHref,
  formatDateRange,
  fullName,
  type ContactKind,
} from '@/lib/resumeFormat'
import { LeetCodeGlyph } from './BrandIcons'
import { renderInlineMarkdown } from '@/lib/markdown'
import { applyAccentOverride, getTemplate, type HtmlTokens } from '@/resume/templates'

interface Props {
  data: ResumeData
}

// Document has no intrinsic width or height. ResumePreview sizes it on screen;
// in print it fills the @page content area.
function buildBaseStyle(t: HtmlTokens): CSSProperties {
  return {
    paddingInline: '0.6in',
    paddingBlock: '0.55in',
    background: t.colorPage,
    color: t.colorInk,
    fontFamily: t.fontBody,
    fontSize: `${t.bodySizePt}pt`,
    lineHeight: t.baseLineHeight,
    boxSizing: 'border-box',
    fontFeatureSettings: '"kern", "liga", "onum"',
    WebkitFontSmoothing: 'antialiased',
  }
}

function inlineIconStyle(t: HtmlTokens): CSSProperties {
  return {
    display: 'block',
    flexShrink: 0,
    color: t.colorMuted,
  }
}

function ContactIcon({ kind, t }: { kind: ContactKind; t: HtmlTokens }) {
  const props = {
    size: 11,
    strokeWidth: 1.75,
    style: inlineIconStyle(t),
  }
  switch (kind) {
    case 'phone':
      return <Phone {...props} />
    case 'email':
      return <Mail {...props} />
    case 'location':
      return <MapPin {...props} />
    case 'linkedin':
      return <Linkedin {...props} />
    case 'github':
      return <Github {...props} />
    case 'leetcode':
      return <LeetCodeGlyph size={11} style={inlineIconStyle(t)} />
    case 'portfolio':
      return <ExternalLink {...props} />
  }
}

function SectionHeader({ title, t }: { title: string; t: HtmlTokens }) {
  const accentOnHeaders = t.accentColor && (t.accentRole === 'sectionHeaders' || t.accentRole === 'both')
  return (
    <div
      data-resume-section-header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginTop: 22,
        marginBottom: 8,
      }}
    >
      <h2
        style={{
          fontFamily: t.fontDisplay,
          fontSize: `${t.sectionHeadingSizePt}pt`,
          fontWeight: 700,
          letterSpacing: '-0.1px',
          margin: 0,
          whiteSpace: 'nowrap',
          color: accentOnHeaders ? (t.accentColor as string) : t.colorInk,
          textTransform: t.sectionHeaderCase === 'upper' ? 'uppercase' : 'none',
        }}
      >
        {title}
      </h2>
      {t.showSectionRule && (
        <div style={{ flex: 1, height: 1, background: t.colorRule }} />
      )}
    </div>
  )
}

// Bullet is rendered as a Unicode glyph in-flow rather than as a CSS
// list-marker or styled span so it scales cleanly in print and PDF.
// role="list" preserves screen-reader and ATS semantics.
function Bullets({ items, t }: { items: string[]; t: HtmlTokens }) {
  if (items.length === 0) return null
  return (
    <ul
      role="list"
      style={{
        margin: '4px 0 0',
        padding: 0,
        listStyle: 'none',
      }}
    >
      {items.map((b, i) => (
        <li
          key={i}
          style={{
            display: 'flex',
            gap: 8,
            marginTop: i === 0 ? 0 : 2,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              flexShrink: 0,
              color: t.colorInk,
              fontWeight: 700,
              lineHeight: 'inherit',
              width: '0.7em',
            }}
          >
            {t.bulletGlyph}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>{renderInlineMarkdown(b)}</span>
        </li>
      ))}
    </ul>
  )
}

function bulletsFromLines(lines: string[]): string[] {
  return lines
    .flatMap((l) => l.split(/\r?\n/))
    .map((l) => l.replace(/^\s*[•\-*]\s*/, '').trim())
    .filter(Boolean)
}

function bulletsFromText(text: string | undefined | null): string[] {
  if (!text) return []
  return bulletsFromLines([text])
}

function EntryHeader({
  left,
  right,
  t,
}: {
  left: ReactNode
  right?: ReactNode
  t: HtmlTokens
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 16,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>{left}</div>
      {right && (
        <div
          style={{
            fontStyle: 'italic',
            color: t.colorMuted,
            whiteSpace: 'nowrap',
            fontSize: `${t.metaSizePt}pt`,
          }}
        >
          {right}
        </div>
      )}
    </div>
  )
}

function RoleLine({ role, company, t }: { role: string; company: string; t: HtmlTokens }) {
  if (role && company) {
    return (
      <>
        <strong style={{ fontWeight: 600 }}>{role}</strong>
        <span style={{ color: t.colorMuted }}> — </span>
        <span>{company}</span>
      </>
    )
  }
  return <strong style={{ fontWeight: 600 }}>{role || company || 'Role'}</strong>
}

function LinkGlyph({ href, label, t }: { href: string; label: string; t: HtmlTokens }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{
        color: t.colorMuted,
        marginLeft: 5,
        textDecoration: 'none',
        verticalAlign: 'middle',
        lineHeight: 0,
      }}
    >
      <ExternalLink
        size={11}
        strokeWidth={1.75}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      />
    </a>
  )
}

function ContactRow({
  items,
  t,
}: {
  items: ReturnType<typeof contactLinks>
  t: HtmlTokens
}) {
  return (
    <div
      style={{
        fontSize: `${t.contactSizePt}pt`,
        color: t.colorInk,
        display: 'flex',
        flexWrap: 'wrap',
        columnGap: 14,
        rowGap: 5,
      }}
    >
      {items.map((c, i) => {
        const itemStyle: CSSProperties = {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          color: t.colorInk,
          textDecoration: 'none',
        }
        const content = (
          <>
            <ContactIcon kind={c.kind} t={t} />
            <span>{c.label}</span>
          </>
        )
        return c.href ? (
          <a
            key={i}
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            style={itemStyle}
          >
            {content}
          </a>
        ) : (
          <span key={i} style={itemStyle}>
            {content}
          </span>
        )
      })}
    </div>
  )
}

export default function ResumeDocument({ data }: Props) {
  const { personal, summary, experience, education, skills, projects, certifications } = data
  const t = applyAccentOverride(getTemplate(data.templateId), data.accentColor).htmlTokens
  const name = fullName(personal)
  const contacts = contactLinks(personal)
  const ESSENTIAL_KINDS: ContactKind[] = ['phone', 'email', 'location']
  const essentialContacts = contacts.filter((c) => ESSENTIAL_KINDS.includes(c.kind))
  const linkContacts = contacts.filter((c) => !ESSENTIAL_KINDS.includes(c.kind))
  const accentOnName = t.accentColor && (t.accentRole === 'name' || t.accentRole === 'both')

  return (
    <div style={buildBaseStyle(t)} data-resume-document>
      <header data-resume-entry>
        <h1
          style={{
            fontFamily: t.fontDisplay,
            fontSize: `${t.nameSizePt}pt`,
            fontWeight: 700,
            letterSpacing: '-0.5px',
            lineHeight: 1.05,
            margin: 0,
            color: accentOnName ? (t.accentColor as string) : t.colorInk,
          }}
        >
          {name || 'Your Name'}
        </h1>
        {personal.title && (
          <p
            style={{
              fontSize: `${t.titleSizePt}pt`,
              margin: '4px 0 0',
              color: t.colorMuted,
              fontStyle: 'italic',
              letterSpacing: '0.1px',
            }}
          >
            {personal.title}
          </p>
        )}
        {contacts.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {essentialContacts.length > 0 && (
              <ContactRow items={essentialContacts} t={t} />
            )}
            {linkContacts.length > 0 && (
              <div style={{ marginTop: essentialContacts.length > 0 ? 5 : 0 }}>
                <ContactRow items={linkContacts} t={t} />
              </div>
            )}
          </div>
        )}
      </header>

      {summary.trim() && (
        <section data-resume-section>
          <SectionHeader title="Summary" t={t} />
          <p style={{ margin: 0, color: t.colorInk, whiteSpace: 'pre-wrap' }}>
            {renderInlineMarkdown(summary.trim())}
          </p>
        </section>
      )}

      {skills.length > 0 && skills.some((g) => g.skills.length > 0) && (
        <section data-resume-section>
          <SectionHeader title="Skills" t={t} />
          <div data-resume-entry>
            {skills.map((g) => (
              <p key={g.id} style={{ margin: '2px 0' }}>
                <strong style={{ fontWeight: 600 }}>{g.category || 'Category'}</strong>
                <span style={{ color: t.colorMuted }}>  ·  </span>
                <span>{g.skills.join(', ')}</span>
              </p>
            ))}
          </div>
        </section>
      )}

      {experience.length > 0 && (
        <section data-resume-section>
          <SectionHeader title="Experience" t={t} />
          {experience.map((e, i) => {
            const bullets = bulletsFromLines(
              e.bullets.map((b, idx) => {
                const tag = e.bulletProjects?.[idx]?.trim()
                return tag ? `**${tag}** — ${b}` : b
              }),
            )
            return (
              <div
                key={e.id}
                data-resume-entry
                style={{ marginTop: i === 0 ? 0 : 12 }}
              >
                <EntryHeader
                  left={<RoleLine role={e.role} company={e.company} t={t} />}
                  right={formatDateRange(e.startDate, e.endDate)}
                  t={t}
                />
                {e.location?.trim() && (
                  <div style={{ fontSize: '9.5pt', color: t.colorMuted, marginTop: 1 }}>
                    {e.location}
                  </div>
                )}
                <Bullets items={bullets} t={t} />
              </div>
            )
          })}
        </section>
      )}

      {projects.length > 0 && (
        <section data-resume-section>
          <SectionHeader title="Projects" t={t} />
          {projects.map((p, i) => {
            const bullets =
              p.bullets && p.bullets.length > 0
                ? p.bullets.map((b) => b.trim()).filter(Boolean)
                : bulletsFromText(p.description)
            const href = ensureHref(p.url)
            return (
              <div
                key={p.id}
                data-resume-entry
                style={{ marginTop: i === 0 ? 0 : 12 }}
              >
                <div>
                  <strong style={{ fontWeight: 600 }}>{p.name || 'Project'}</strong>
                  {p.tech.length > 0 && (
                    <>
                      <span style={{ color: t.colorMuted }}> — </span>
                      <em style={{ color: t.colorMuted }}>{p.tech.join(', ')}</em>
                    </>
                  )}
                  {href && <LinkGlyph href={href} label={`${p.name} link`} t={t} />}
                </div>
                <Bullets items={bullets} t={t} />
              </div>
            )
          })}
        </section>
      )}

      {education.length > 0 && (
        <section data-resume-section>
          <SectionHeader title="Education" t={t} />
          {education.map((e, i) => {
            const degreeLine = [e.degree, e.field].filter(Boolean).join(', ')
            const bullets =
              e.bullets && e.bullets.length > 0
                ? e.bullets.map((b) => b.trim()).filter(Boolean)
                : bulletsFromText(e.notes)
            return (
              <div
                key={e.id}
                data-resume-entry
                style={{ marginTop: i === 0 ? 0 : 10 }}
              >
                <EntryHeader
                  left={
                    <span>
                      <strong style={{ fontWeight: 600 }}>{e.school || 'Institution'}</strong>
                      {degreeLine && (
                        <>
                          <span style={{ color: t.colorMuted }}> — </span>
                          <span>{degreeLine}</span>
                        </>
                      )}
                    </span>
                  }
                  right={formatDateRange(e.startDate, e.endDate)}
                  t={t}
                />
                <Bullets items={bullets} t={t} />
              </div>
            )
          })}
        </section>
      )}

      {certifications.length > 0 && (
        <section data-resume-section>
          <SectionHeader title="Certifications" t={t} />
          {certifications.map((c, i) => {
            const href = ensureHref(c.url)
            return (
              <div
                key={c.id}
                data-resume-entry
                style={{ marginTop: i === 0 ? 0 : 6 }}
              >
                <EntryHeader
                  left={
                    <span>
                      <strong style={{ fontWeight: 600 }}>{c.name || 'Certification'}</strong>
                      {c.issuer && (
                        <>
                          <span style={{ color: t.colorMuted }}> — </span>
                          <span>{c.issuer}</span>
                        </>
                      )}
                      {href && <LinkGlyph href={href} label={`${c.name} link`} t={t} />}
                    </span>
                  }
                  right={c.date}
                  t={t}
                />
              </div>
            )
          })}
        </section>
      )}

    </div>
  )
}
