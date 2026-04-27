import { Document, Page, View, Text, Link, StyleSheet } from '@react-pdf/renderer'
import type { ResumeData } from '@/types/resume'
import {
  contactLinks,
  ensureHref,
  formatDateRange,
  fullName,
} from '@/lib/resumeFormat'
import { colors, fonts, sizes, spacing, lineHeight } from './tokens'

interface Props {
  data: ResumeData
}

const s = StyleSheet.create({
  page: {
    paddingHorizontal: spacing.pageMarginX,
    paddingVertical: spacing.pageMarginY,
    backgroundColor: colors.page,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: sizes.body,
    lineHeight: lineHeight.body,
  },
  name: {
    fontFamily: fonts.displayBold,
    fontSize: sizes.name,
    color: colors.ink,
    lineHeight: lineHeight.heading,
  },
  title: {
    fontFamily: fonts.bodyOblique,
    fontSize: sizes.title,
    color: colors.muted,
    marginTop: 3,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 9,
    fontSize: sizes.contact,
    color: colors.ink,
  },
  contactItem: {
    marginRight: 12,
    marginTop: 2,
    color: colors.ink,
    textDecoration: 'none',
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
    fontFamily: fonts.displayBold,
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
    fontFamily: fonts.bodyOblique,
    color: colors.muted,
    fontSize: sizes.meta,
  },
  bold: {
    fontFamily: fonts.bodyBold,
  },
  muted: {
    color: colors.muted,
  },
  italicMuted: {
    color: colors.muted,
    fontFamily: fonts.bodyOblique,
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
    fontFamily: fonts.bodyBold,
  },
  bulletText: {
    flex: 1,
  },
  skillRow: {
    marginTop: 1,
  },
})

function stripInlineMarkdown(input: string): string {
  // The on-screen renderer supports **bold**, *italic*, and [text](url).
  // For the PDF v1 we render plain text to keep output ATS-friendly and
  // avoid a parser duplicate. Inline emphasis returns in a follow-up.
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

export default function ResumePdfDocument({ data }: Props) {
  const { personal, summary, experience, education, skills, projects, certifications } = data
  const name = fullName(personal) || 'Your Name'
  const contacts = contactLinks(personal)

  return (
    <Document title={name} author={name}>
      <Page size="LETTER" style={s.page}>
        <View>
          <Text style={s.name}>{name}</Text>
          {personal.title ? <Text style={s.title}>{personal.title}</Text> : null}
          {contacts.length > 0 && (
            <View style={s.contactRow}>
              {contacts.map((c, i) =>
                c.href ? (
                  <Link key={i} src={c.href} style={s.contactItem}>
                    {c.label}
                  </Link>
                ) : (
                  <Text key={i} style={s.contactItem}>
                    {c.label}
                  </Text>
                ),
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
                  <Text>
                    {href ? (
                      <Link src={href} style={s.bold}>
                        {p.name || 'Project'}
                      </Link>
                    ) : (
                      <Text style={s.bold}>{p.name || 'Project'}</Text>
                    )}
                    {p.tech.length > 0 && (
                      <>
                        <Text style={s.muted}> — </Text>
                        <Text style={s.italicMuted}>{p.tech.join(', ')}</Text>
                      </>
                    )}
                  </Text>
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
                    <Text style={s.entryLeft}>
                      {href ? (
                        <Link src={href} style={s.bold}>
                          {c.name || 'Certification'}
                        </Link>
                      ) : (
                        <Text style={s.bold}>{c.name || 'Certification'}</Text>
                      )}
                      {c.issuer && (
                        <>
                          <Text style={s.muted}> — </Text>
                          <Text>{c.issuer}</Text>
                        </>
                      )}
                    </Text>
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
