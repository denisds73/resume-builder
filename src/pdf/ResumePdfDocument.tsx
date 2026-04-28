import { Document, Page, View, Text, Link, StyleSheet } from '@react-pdf/renderer'
import type { ResumeData } from '@/types/resume'
import {
  contactLinks,
  ensureHref,
  formatDateRange,
  fullName,
  type ContactKind,
} from '@/lib/resumeFormat'
import { applyAccentOverride, getTemplate, type PdfTokens } from '@/resume/templates'
import { registerPdfFonts } from './fonts'
import { ContactIcon, ExternalLinkIcon } from './icons'

registerPdfFonts()

interface Props {
  data: ResumeData
}

const ESSENTIAL_KINDS: ContactKind[] = ['phone', 'email', 'location']

type Styles = ReturnType<typeof buildStyles>

// Cache styles by template id so we only call StyleSheet.create once per
// template, not per render.
const stylesCache = new Map<string, Styles>()

function getStyles(t: PdfTokens, id: string): Styles {
  const cached = stylesCache.get(id)
  if (cached) return cached
  const built = buildStyles(t)
  stylesCache.set(id, built)
  return built
}

function buildStyles(t: PdfTokens) {
  return StyleSheet.create({
    page: {
      paddingHorizontal: t.pageMarginX,
      paddingVertical: t.pageMarginY,
      backgroundColor: t.colorPage,
      color: t.colorInk,
      fontFamily: t.fontBody,
      fontSize: t.bodySize,
      fontWeight: 400,
      lineHeight: t.lineHeightBody,
    },
    name: {
      fontFamily: t.fontDisplay,
      fontSize: t.nameSize,
      fontWeight: 700,
      color:
        t.accentColor && (t.accentRole === 'name' || t.accentRole === 'both')
          ? t.accentColor
          : t.colorInk,
      lineHeight: t.lineHeightHeading,
      letterSpacing: -0.4,
    },
    title: {
      fontFamily: t.fontBody,
      fontStyle: 'italic',
      fontSize: t.titleSize,
      color: t.colorMuted,
      marginTop: 3,
    },
    contactGroup: {
      marginTop: 9,
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      fontSize: t.contactSize,
      color: t.colorInk,
      marginTop: 4,
    },
    contactRowFirst: {
      marginTop: 0,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      lineHeight: 1,
      marginRight: 12,
      marginTop: 2,
      color: t.colorInk,
      textDecoration: 'none',
    },
    contactIcon: {
      marginRight: 4,
      marginTop: -0.5,
    },
    sectionWrap: {
      marginTop: t.sectionTop,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: t.sectionHeadingBottom,
    },
    sectionTitle: {
      fontFamily: t.fontDisplay,
      fontWeight: 700,
      fontSize: t.sectionHeadingSize,
      color:
        t.accentColor && (t.accentRole === 'sectionHeaders' || t.accentRole === 'both')
          ? t.accentColor
          : t.colorInk,
      marginRight: 10,
      textTransform: t.sectionHeaderCase === 'upper' ? 'uppercase' : 'none',
    },
    rule: {
      flex: 1,
      height: 0.6,
      backgroundColor: t.colorRule,
    },
    entry: {
      marginTop: t.entryGap,
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
      color: t.colorMuted,
      fontSize: t.metaSize,
    },
    bold: {
      fontWeight: 600,
    },
    muted: {
      color: t.colorMuted,
    },
    italicMuted: {
      color: t.colorMuted,
      fontStyle: 'italic',
    },
    locationLine: {
      fontSize: t.metaSize - 0.5,
      color: t.colorMuted,
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
      width: t.bulletIndent,
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
      color: t.colorMuted,
      textDecoration: 'none',
    },
  })
}

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

function SectionHeader({ title, s, showRule }: { title: string; s: Styles; showRule: boolean }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {showRule && <View style={s.rule} />}
    </View>
  )
}

function Bullets({ items, s, glyph }: { items: string[]; s: Styles; glyph: string }) {
  if (items.length === 0) return null
  return (
    <View style={s.bulletList}>
      {items.map((b, i) => (
        <View key={i} style={s.bulletRow} wrap={false}>
          <Text style={s.bulletGlyph}>{glyph}</Text>
          <Text style={s.bulletText}>{stripInlineMarkdown(b)}</Text>
        </View>
      ))}
    </View>
  )
}

function ContactRow({
  items,
  first,
  s,
  mutedColor,
}: {
  items: ReturnType<typeof contactLinks>
  first?: boolean
  s: Styles
  mutedColor: string
}) {
  return (
    <View style={first ? [s.contactRow, s.contactRowFirst] : s.contactRow}>
      {items.map((c, i) => {
        const inner = (
          <>
            <View style={s.contactIcon}>
              <ContactIcon kind={c.kind} size={9} color={mutedColor} />
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
  const template = getTemplate(data.templateId)
  const composed = applyAccentOverride(template, data.accentColor)
  const t = composed.pdfTokens
  // Cache key includes the accent override so a custom color produces
  // (and stores) its own StyleSheet — different overrides must not
  // clobber each other in the module-level cache.
  const cacheKey = `${template.id}:${data.accentColor ?? 'default'}`
  const s = getStyles(t, cacheKey)
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
                <ContactRow items={essentialContacts} first s={s} mutedColor={t.colorMuted} />
              )}
              {linkContacts.length > 0 && (
                <ContactRow
                  items={linkContacts}
                  first={essentialContacts.length === 0}
                  s={s}
                  mutedColor={t.colorMuted}
                />
              )}
            </View>
          )}
        </View>

        {summary.trim() && (
          <View style={s.sectionWrap}>
            <SectionHeader title="Summary" s={s} showRule={t.showSectionRule} />
            <Text>{stripInlineMarkdown(summary.trim())}</Text>
          </View>
        )}

        {skills.length > 0 && skills.some((g) => g.skills.length > 0) && (
          <View style={s.sectionWrap}>
            <SectionHeader title="Skills" s={s} showRule={t.showSectionRule} />
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
            <SectionHeader title="Experience" s={s} showRule={t.showSectionRule} />
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
                  <Bullets items={bullets} s={s} glyph={t.bulletGlyph} />
                </View>
              )
            })}
          </View>
        )}

        {projects.length > 0 && (
          <View style={s.sectionWrap}>
            <SectionHeader title="Projects" s={s} showRule={t.showSectionRule} />
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
                        <ExternalLinkIcon size={9} color={t.colorMuted} />
                      </Link>
                    )}
                  </View>
                  <Bullets items={bullets} s={s} glyph={t.bulletGlyph} />
                </View>
              )
            })}
          </View>
        )}

        {education.length > 0 && (
          <View style={s.sectionWrap}>
            <SectionHeader title="Education" s={s} showRule={t.showSectionRule} />
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
                  <Bullets items={bullets} s={s} glyph={t.bulletGlyph} />
                </View>
              )
            })}
          </View>
        )}

        {certifications.length > 0 && (
          <View style={s.sectionWrap}>
            <SectionHeader title="Certifications" s={s} showRule={t.showSectionRule} />
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
                          <ExternalLinkIcon size={9} color={t.colorMuted} />
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
