// Shared design tokens for PDF templates. Mirrors the on-screen
// ResumeDocument.tsx so the screen preview and the exported PDF stay
// visually aligned. New templates should compose from these tokens
// instead of hardcoding values.

export const colors = {
  ink: '#111111',
  muted: '#5e5e5e',
  rule: '#d9d9d9',
  page: '#ffffff',
} as const

export const fonts = {
  // Built-in PDF fonts. Custom fonts (Inter, Source Serif) require
  // Font.register and TTF files — deferred to a follow-up PR.
  display: 'Times-Roman',
  displayBold: 'Times-Bold',
  body: 'Helvetica',
  bodyBold: 'Helvetica-Bold',
  bodyOblique: 'Helvetica-Oblique',
} as const

// Font sizes in pt — match the on-screen ResumeDocument scale.
export const sizes = {
  name: 26,
  title: 12,
  sectionHeading: 13,
  body: 10.5,
  meta: 10,
  contact: 9,
} as const

// Spacing in pt. Page margins follow the 0.6in / 0.55in pattern from
// the print stylesheet (1in = 72pt → 43.2 / 39.6).
export const spacing = {
  pageMarginX: 43.2,
  pageMarginY: 39.6,
  sectionTop: 16,
  sectionHeadingBottom: 6,
  entryGap: 9,
  bulletIndent: 8,
} as const

export const lineHeight = {
  body: 1.4,
  heading: 1.1,
} as const
