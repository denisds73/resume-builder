import { Document, Page, View, Text, Link, StyleSheet } from '@react-pdf/renderer'
import type { ResumeData } from '@/types/resume'
import {
  contactLinks,
  ensureHref,
  formatDateRange,
  fullName,
  type ContactKind,
} from '@/lib/resumeFormat'
import { colors, fonts, sizes, spacing, lineHeight } from './tokens'
import { registerPdfFonts } from './fonts'
import { ContactIcon, ExternalLinkIcon } from './icons'

registerPdfFonts()

interface Props {
  data: ResumeData
}

const ESSENTIAL_KINDS: ContactKind[] = ['phone', 'email', 'location']

const s = StyleSheet.create({
  page: {
    paddingHorizontal: spacing.pageMarginX,
    paddingVertical: spacing.pageMarginY,
    backgroundColor: colors.page,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: sizes.body,
    fontWeight: 400,
    lineHeight: lineHeight.body,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: sizes.name,
    fontWeight: 700,
    color: colors.ink,
    lineHeight: lineHeight.heading,
    letterSpacing: -0.4,
  },
  title: {
    fontFamily: fonts.body,
    fontStyle: 'italic',
    fontSize: sizes.title,
    color: colors.muted,
    marginTop: 3,
  },
  contactGroup: {
    marginTop: 9,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    fontSize: sizes.contact,
    color: colors.ink,
    marginTop: 4,
  },
  contactRowFirst: {
    marginTop: 0,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    // Tight line-height collapses the leading react-pdf adds around Text
    // so a flex-centered icon ends up optically aligned with the cap
    // height of the label rather than dropping below the visual baseline.
    lineHeight: 1,
    marginRight: 12,
    marginTop: 2,
    color: colors.ink,
    textDecoration: 'none',
  },
  contactIcon: {
    marginRight: 4,
    // Lift the icon ~0.5pt above the geometric center to sit on the
    // optical baseline of the lowercase x-height (where lucide icons
    // were designed to feel anchored).
    marginTop: -0.5,
  },
  sectionWrap: {
    marginTop: spacing.sectionTop,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sectionHeadingBottom,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontWeight: 700,
    fontSize: sizes.sectionHeading,
    color: colors.ink,
    marginRight: 10,
  },
  rule: {
    flex: 1,
    height: 0.6,
    backgroundColor: colors.rule,
  },
  entry: {
    marginTop: spacing.entryGap,
  },
  entryFirst: {
    marginTop: 0,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  entryLeft: {
    flex: 1,
    paddingRight: 12,
  },
  entryRight: {
    fontStyle: 'italic',
    color: colors.muted,
    fontSize: sizes.meta,
  },
  bold: {
    fontWeight: 600,
  },
  muted: {
    color: colors.muted,
  },
  italicMuted: {
    color: colors.muted,
    fontStyle: 'italic',
  },
  locationLine: {
    fontSize: sizes.meta - 0.5,
    color: colors.muted,
    marginTop: 1,
  },
  bulletList: {
    marginTop: 3,
  },
  bulletRow: {
    flexDirection: 'row',
    marginTop: 1,
  },
  bulletGlyph: {
    width: spacing.bulletIndent,
    fontWeight: 700,
  },
  bulletText: {
    flex: 1,
  },
  skillRow: {
    marginTop: 1,
  },
  titleWithLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkGlyph: {
    marginLeft: 5,
    color: colors.muted,
    textDecoration: 'none',
  },
})

function stripInlineMarkdown(input: string): string {
  return input
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
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

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.rule} />
    </View>
  )
}

function Bullets({ items }: { items: string[] }) {
  if (items.length === 0) return null
  return (
    <View style={s.bulletList}>
      {items.map((b, i) => (
        <View key={i} style={s.bulletRow} wrap={false}>
          <Text style={s.bulletGlyph}>•</Text>
          <Text style={s.bulletText}>{stripInlineMarkdown(b)}</Text>
        </View>
      ))}
    </View>
  )
}

function ContactRow({
  items,
  first,
}: {
  items: ReturnType<typeof contactLinks>
  first?: boolean
}) {
  return (
    <View style={first ? [s.contactRow, s.contactRowFirst] : s.contactRow}>
      {items.map((c, i) => {
        const inner = (
          <>
            <View style={s.contactIcon}>
              <ContactIcon kind={c.kind} size={9} color={colors.muted} />
            </View>
            <Text>{c.label}</Text>
          </>
        )
        return c.href ? (
          <Link key={i} src={c.href} style={s.contactItem}>
            {inner}
          </Link>
        ) : (
          <View key={i} style={s.contactItem}>
            {inner}
          </View>
        )
      })}
    </View>
  )
}

export default function ResumePdfDocument({ data }: Props) {
  const { personal, summary, experience, education, skills, projects, certifications } = data
  const name = fullName(personal) || 'Your Name'
  const contacts = contactLinks(personal)
  const essentialContacts = contacts.filter((c) => ESSENTIAL_KINDS.includes(c.kind))
  const linkContacts = contacts.filter((c) => !ESSENTIAL_KINDS.includes(c.kind))

  return (
    <Document title={name} author={name}>
      <Page size="LETTER" style={s.page}>
        <View>
          <Text style={s.name}>{name}</Text>
          {personal.title ? <Text style={s.title}>{personal.title}</Text> : null}
          {contacts.length > 0 && (
            <View style={s.contactGroup}>
              {essentialContacts.length > 0 && (
                <ContactRow items={essentialContacts} first />
              )}
              {linkContacts.length > 0 && (
                <ContactRow items={linkContacts} first={essentialContacts.length === 0} />
              )}
            </View>
          )}
        </View>

        {summary.trim() && (
          <View style={s.sectionWrap}>
            <SectionHeader title="Summary" />
            <Text>{stripInlineMarkdown(summary.trim())}</Text>
          </View>
        )}

        {skills.length > 0 && skills.some((g) => g.skills.length > 0) && (
          <View style={s.sectionWrap}>
            <SectionHeader title="Skills" />
            <View>
              {skills.map((g) => (
                <Text key={g.id} style={s.skillRow}>
                  <Text style={s.bold}>{g.category || 'Category'}</Text>
                  <Text style={s.muted}>  ·  </Text>
                  <Text>{g.skills.join(', ')}</Text>
                </Text>
              ))}
            </View>
          </View>
        )}

        {experience.length > 0 && (
          <View style={s.sectionWrap}>
            <SectionHeader title="Experience" />
            {experience.map((e, i) => {
              const bullets = bulletsFromLines(e.bullets)
              const right = formatDateRange(e.startDate, e.endDate)
              return (
                <View key={e.id} style={i === 0 ? s.entryFirst : s.entry} wrap={false}>
                  <View style={s.entryHeader}>
                    <Text style={s.entryLeft}>
                      {e.role || e.company ? (
                        <>
                          {e.role && <Text style={s.bold}>{e.role}</Text>}
                          {e.role && e.company && <Text style={s.muted}> — </Text>}
                          {e.company && <Text>{e.company}</Text>}
                        </>
                      ) : (
                        <Text style={s.bold}>Role</Text>
                      )}
                    </Text>
                    {right ? <Text style={s.entryRight}>{right}</Text> : null}
                  </View>
                  {e.location?.trim() ? (
                    <Text style={s.locationLine}>{e.location}</Text>
                  ) : null}
                  <Bullets items={bullets} />
                </View>
              )
            })}
          </View>
        )}

        {projects.length > 0 && (
          <View style={s.sectionWrap}>
            <SectionHeader title="Projects" />
            {projects.map((p, i) => {
              const bullets =
                p.bullets && p.bullets.length > 0
                  ? p.bullets.map((b) => b.trim()).filter(Boolean)
                  : bulletsFromText(p.description)
              const href = ensureHref(p.url)
              return (
                <View key={p.id} style={i === 0 ? s.entryFirst : s.entry} wrap={false}>
                  <View style={s.titleWithLink}>
                    <Text>
                      <Text style={s.bold}>{p.name || 'Project'}</Text>
                      {p.tech.length > 0 && (
                        <>
                          <Text style={s.muted}> — </Text>
                          <Text style={s.italicMuted}>{p.tech.join(', ')}</Text>
                        </>
                      )}
                    </Text>
                    {href && (
                      <Link src={href} style={s.linkGlyph}>
                        <ExternalLinkIcon size={9} color={colors.muted} />
                      </Link>
                    )}
                  </View>
                  <Bullets items={bullets} />
                </View>
              )
            })}
          </View>
        )}

        {education.length > 0 && (
          <View style={s.sectionWrap}>
            <SectionHeader title="Education" />
            {education.map((e, i) => {
              const degreeLine = [e.degree, e.field].filter(Boolean).join(', ')
              const bullets =
                e.bullets && e.bullets.length > 0
                  ? e.bullets.map((b) => b.trim()).filter(Boolean)
                  : bulletsFromText(e.notes)
              const right = formatDateRange(e.startDate, e.endDate)
              return (
                <View key={e.id} style={i === 0 ? s.entryFirst : s.entry} wrap={false}>
                  <View style={s.entryHeader}>
                    <Text style={s.entryLeft}>
                      <Text style={s.bold}>{e.school || 'Institution'}</Text>
                      {degreeLine && (
                        <>
                          <Text style={s.muted}> — </Text>
                          <Text>{degreeLine}</Text>
                        </>
                      )}
                    </Text>
                    {right ? <Text style={s.entryRight}>{right}</Text> : null}
                  </View>
                  <Bullets items={bullets} />
                </View>
              )
            })}
          </View>
        )}

        {certifications.length > 0 && (
          <View style={s.sectionWrap}>
            <SectionHeader title="Certifications" />
            {certifications.map((c, i) => {
              const href = ensureHref(c.url)
              return (
                <View key={c.id} style={i === 0 ? s.entryFirst : s.entry} wrap={false}>
                  <View style={s.entryHeader}>
                    <View style={[s.entryLeft, s.titleWithLink]}>
                      <Text>
                        <Text style={s.bold}>{c.name || 'Certification'}</Text>
                        {c.issuer && (
                          <>
                            <Text style={s.muted}> — </Text>
                            <Text>{c.issuer}</Text>
                          </>
                        )}
                      </Text>
                      {href && (
                        <Link src={href} style={s.linkGlyph}>
                          <ExternalLinkIcon size={9} color={colors.muted} />
                        </Link>
                      )}
                    </View>
                    {c.date ? <Text style={s.entryRight}>{c.date}</Text> : null}
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </Page>
    </Document>
  )
}
