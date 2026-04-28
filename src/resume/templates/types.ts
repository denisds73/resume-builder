export type TemplateId = 'classic' | 'modern' | 'minimal'

export interface HtmlTokens {
  fontDisplay: string
  fontBody: string
  colorInk: string
  colorMuted: string
  colorRule: string
  colorPage: string
  nameSizePt: number
  titleSizePt: number
  sectionHeadingSizePt: number
  bodySizePt: number
  metaSizePt: number
  contactSizePt: number
  baseLineHeight: number
  bulletGlyph: string
  showSectionRule: boolean
  sectionHeaderCase: 'normal' | 'upper'
  accentColor: string | null
  accentRole: 'none' | 'name' | 'sectionHeaders' | 'both'
  // Display/body weights and tracking — let templates pick a voice without
  // adding layout branches.
  nameWeight: 400 | 500 | 600 | 700
  bodyWeight: 400 | 500 | 600 | 700
  sectionHeadingWeight: 400 | 500 | 600 | 700
  nameLetterSpacingEm: number
  sectionHeadingLetterSpacingEm: number
  // Vertical rhythm in px (HTML preview uses px for layout spacing).
  sectionTopPx: number
  sectionHeadingBottomPx: number
  entryGapPx: number
  pagePaddingXIn: number
  pagePaddingYIn: number
}

export interface PdfTokens {
  fontDisplay: string
  fontBody: string
  colorInk: string
  colorMuted: string
  colorRule: string
  colorPage: string
  nameSize: number
  titleSize: number
  sectionHeadingSize: number
  bodySize: number
  metaSize: number
  contactSize: number
  pageMarginX: number
  pageMarginY: number
  sectionTop: number
  sectionHeadingBottom: number
  entryGap: number
  bulletIndent: number
  lineHeightBody: number
  lineHeightHeading: number
  bulletGlyph: string
  showSectionRule: boolean
  sectionHeaderCase: 'normal' | 'upper'
  accentColor: string | null
  accentRole: 'none' | 'name' | 'sectionHeaders' | 'both'
  nameWeight: 400 | 500 | 600 | 700
  bodyWeight: 400 | 500 | 600 | 700
  sectionHeadingWeight: 400 | 500 | 600 | 700
  nameLetterSpacing: number
  sectionHeadingLetterSpacing: number
}

export interface ResumeTemplate {
  id: TemplateId
  name: string
  description: string
  htmlTokens: HtmlTokens
  pdfTokens: PdfTokens
}
