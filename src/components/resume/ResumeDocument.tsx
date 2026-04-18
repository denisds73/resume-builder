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

interface Props {
  data: ResumeData
}

// Typography system — editorial serif display + clean sans body.
const FONT_DISPLAY = '"Source Serif 4", "Source Serif Pro", Georgia, "Times New Roman", serif'
const FONT_BODY = '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif'

// Restrained near-black with a warm tint — avoids harsh pure black.
const COLOR_INK = '#111111'
const COLOR_MUTED = '#5e5e5e'
const COLOR_RULE = '#d9d9d9'

// The document has no intrinsic width or height. The ResumePreview wrapper
// sizes it for on-screen display; in print, it fills the @page content area
// (Letter minus @page margins). This avoids the inline-style vs print-css
// specificity fight that would otherwise cause horizontal overflow.
const baseStyle: CSSProperties = {
  paddingInline: '0.6in',
  paddingBlock: '0.55in',
  background: '#ffffff',
  color: COLOR_INK,
  fontFamily: FONT_BODY,
  fontSize: '10.5pt',
  lineHeight: 1.5,
  boxSizing: 'border-box',
  // Minor OpenType niceties
  fontFeatureSettings: '"kern", "liga", "onum"',
  WebkitFontSmoothing: 'antialiased',
}

// Icon style for use inside inline-flex rows (align-items: center + line-height: 1
// in the parent). display: block removes the baseline phantom space SVGs get by
// default; color flows through currentColor. No vertical-align — it's ignored
// inside flex layout anyway.
const INLINE_ICON_STYLE: CSSProperties = {
  display: 'block',
  flexShrink: 0,
  color: COLOR_MUTED,
}

function LeetCodeGlyph({ size = 11 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      role="img"
      style={INLINE_ICON_STYLE}
    >
      <title>LeetCode</title>
      <path
        fill="currentColor"
        d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"
      />
    </svg>
  )
}

function ContactIcon({ kind }: { kind: ContactKind }) {
  const props = {
    size: 11,
    strokeWidth: 1.75,
    style: INLINE_ICON_STYLE,
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
      return <LeetCodeGlyph size={11} />
    case 'portfolio':
      return <ExternalLink {...props} />
  }
}

function SectionHeader({ title }: { title: string }) {
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
          fontFamily: FONT_DISPLAY,
          fontSize: '14pt',
          fontWeight: 700,
          letterSpacing: '-0.1px',
          margin: 0,
          whiteSpace: 'nowrap',
          color: COLOR_INK,
        }}
      >
        {title}
      </h2>
      <div style={{ flex: 1, height: 1, background: COLOR_RULE }} />
    </div>
  )
}

// Bullet is rendered as the Unicode "•" character (U+2022) inside the text
// flow — not as a CSS list-marker and not as a styled DOM shape. Reasoning:
//   1. browser-drawn ::marker / list-style-type: disc can render clipped in
//      print contexts near the page margin (left halves cut off),
//   2. tiny styled spans (e.g. width/height: 3.5px border-radius: 50%) get
//      pixel-snapped unevenly by the PDF renderer and display as vertical
//      slivers / ellipses,
//   3. a real glyph is scaled by the font engine at any DPI with no
//      sub-pixel artifacts and aligns naturally with the text baseline.
// role="list" preserves semantics for screen readers and ATS.
function Bullets({ items }: { items: string[] }) {
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
              color: COLOR_INK,
              // Font glyph, renders in-flow with the text. Slightly bolder
              // than body weight so the dot reads at body size.
              fontWeight: 700,
              lineHeight: 'inherit',
              // Width just wide enough for the glyph — keeps the hanging
              // indent consistent across bullets.
              width: '0.7em',
            }}
          >
            •
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>{b}</span>
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
}: {
  left: ReactNode
  right?: ReactNode
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
            color: COLOR_MUTED,
            whiteSpace: 'nowrap',
            fontSize: '10pt',
          }}
        >
          {right}
        </div>
      )}
    </div>
  )
}

function RoleLine({ role, company }: { role: string; company: string }) {
  if (role && company) {
    return (
      <>
        <strong style={{ fontWeight: 600 }}>{role}</strong>
        <span style={{ color: COLOR_MUTED }}> — </span>
        <span>{company}</span>
      </>
    )
  }
  return <strong style={{ fontWeight: 600 }}>{role || company || 'Role'}</strong>
}

function LinkGlyph({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{
        color: COLOR_MUTED,
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

export default function ResumeDocument({ data }: Props) {
  const { personal, summary, experience, education, skills, projects, certifications } = data
  const name = fullName(personal)
  const contacts = contactLinks(personal)

  return (
    <div style={baseStyle} data-resume-document>
      <header data-resume-entry>
        <h1
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: '30pt',
            fontWeight: 700,
            letterSpacing: '-0.5px',
            lineHeight: 1.05,
            margin: 0,
            color: COLOR_INK,
          }}
        >
          {name || 'Your Name'}
        </h1>
        {personal.title && (
          <p
            style={{
              fontSize: '12pt',
              margin: '4px 0 0',
              color: COLOR_MUTED,
              fontStyle: 'italic',
              letterSpacing: '0.1px',
            }}
          >
            {personal.title}
          </p>
        )}
        {contacts.length > 0 && (
          <div
            style={{
              marginTop: 12,
              fontSize: '9pt',
              color: COLOR_INK,
              display: 'flex',
              flexWrap: 'wrap',
              columnGap: 14,
              rowGap: 6,
            }}
          >
            {contacts.map((c, i) => {
              // Each item is its own inline-flex row. With line-height: 1 and
              // align-items: center the icon's geometric center lines up with
              // the text's optical center — the small residual asymmetry from
              // Inter's ascent/descent is absorbed by the centering.
              const itemStyle: CSSProperties = {
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                lineHeight: 1,
                whiteSpace: 'nowrap',
                color: COLOR_INK,
                textDecoration: 'none',
              }
              const content = (
                <>
                  <ContactIcon kind={c.kind} />
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
        )}
      </header>

      {summary.trim() && (
        <section data-resume-section>
          <SectionHeader title="Summary" />
          <p style={{ margin: 0, color: COLOR_INK }}>{summary.trim()}</p>
        </section>
      )}

      {skills.length > 0 && skills.some((g) => g.skills.length > 0) && (
        <section data-resume-section>
          <SectionHeader title="Skills" />
          <div data-resume-entry>
            {skills.map((g) => (
              <p key={g.id} style={{ margin: '2px 0' }}>
                <strong style={{ fontWeight: 600 }}>{g.category || 'Category'}</strong>
                <span style={{ color: COLOR_MUTED }}>  ·  </span>
                <span>{g.skills.join(', ')}</span>
              </p>
            ))}
          </div>
        </section>
      )}

      {experience.length > 0 && (
        <section data-resume-section>
          <SectionHeader title="Experience" />
          {experience.map((e, i) => {
            const bullets = bulletsFromLines(e.bullets)
            return (
              <div
                key={e.id}
                data-resume-entry
                style={{ marginTop: i === 0 ? 0 : 12 }}
              >
                <EntryHeader
                  left={<RoleLine role={e.role} company={e.company} />}
                  right={formatDateRange(e.startDate, e.endDate)}
                />
                {e.location?.trim() && (
                  <div style={{ fontSize: '9.5pt', color: COLOR_MUTED, marginTop: 1 }}>
                    {e.location}
                  </div>
                )}
                <Bullets items={bullets} />
              </div>
            )
          })}
        </section>
      )}

      {projects.length > 0 && (
        <section data-resume-section>
          <SectionHeader title="Projects" />
          {projects.map((p, i) => {
            const bullets = bulletsFromText(p.description)
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
                      <span style={{ color: COLOR_MUTED }}> — </span>
                      <em style={{ color: COLOR_MUTED }}>{p.tech.join(', ')}</em>
                    </>
                  )}
                  {href && <LinkGlyph href={href} label={`${p.name} link`} />}
                </div>
                <Bullets items={bullets} />
              </div>
            )
          })}
        </section>
      )}

      {education.length > 0 && (
        <section data-resume-section>
          <SectionHeader title="Education" />
          {education.map((e, i) => {
            const degreeLine = [e.degree, e.field].filter(Boolean).join(', ')
            const bullets = bulletsFromText(e.notes)
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
                          <span style={{ color: COLOR_MUTED }}> — </span>
                          <span>{degreeLine}</span>
                        </>
                      )}
                    </span>
                  }
                  right={formatDateRange(e.startDate, e.endDate)}
                />
                <Bullets items={bullets} />
              </div>
            )
          })}
        </section>
      )}

      {certifications.length > 0 && (
        <section data-resume-section>
          <SectionHeader title="Certifications" />
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
                          <span style={{ color: COLOR_MUTED }}> — </span>
                          <span>{c.issuer}</span>
                        </>
                      )}
                      {href && <LinkGlyph href={href} label={`${c.name} link`} />}
                    </span>
                  }
                  right={c.date}
                />
              </div>
            )
          })}
        </section>
      )}

    </div>
  )
}
