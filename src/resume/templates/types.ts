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
}

export interface ResumeTemplate {
  id: TemplateId
  name: string
  description: string
  htmlTokens: HtmlTokens
  pdfTokens: PdfTokens
}
