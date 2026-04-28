import { Font } from '@react-pdf/renderer'

// Match the on-screen typography (Inter for body, Source Serif 4 for the
// editorial display headings). Fonts are pulled from the fontsource CDN as
// WOFF — fontkit (used internally by react-pdf) decodes WOFF natively, and
// fontsource doesn't ship TTF. Loading is async; the first PDF render after
// page load incurs a one-time ~150KB fetch. jsdelivr serves with permissive
// CORS so this works in-browser.
//
// Versions are pinned so a future fontsource layout change can't silently
// break PDF generation. Bump deliberately when refreshing.

const FONTSOURCE = 'https://cdn.jsdelivr.net/npm'

let registered = false

export function registerPdfFonts(): void {
  if (registered) return
  registered = true

  Font.register({
    family: 'Inter',
    fonts: [
      { src: `${FONTSOURCE}/@fontsource/inter@5.0.16/files/inter-latin-400-normal.woff`, fontWeight: 400 },
      { src: `${FONTSOURCE}/@fontsource/inter@5.0.16/files/inter-latin-600-normal.woff`, fontWeight: 600 },
      { src: `${FONTSOURCE}/@fontsource/inter@5.0.16/files/inter-latin-700-normal.woff`, fontWeight: 700 },
      // Inter italic isn't published by fontsource v5, so it's bundled
      // locally from the rsms/inter v4.1 release (extras/ttf). Lives in
      // public/fonts and is fetched lazily when the PDF is generated.
      { src: '/fonts/Inter-Italic.ttf', fontWeight: 400, fontStyle: 'italic' },
    ],
  })

  Font.register({
    family: 'Source Serif 4',
    fonts: [
      { src: `${FONTSOURCE}/@fontsource/source-serif-4@5.0.20/files/source-serif-4-latin-400-normal.woff`, fontWeight: 400 },
      { src: `${FONTSOURCE}/@fontsource/source-serif-4@5.0.20/files/source-serif-4-latin-700-normal.woff`, fontWeight: 700 },
    ],
  })

  // Disable react-pdf's default word-break hyphenation — for resumes we
  // prefer overflow over arbitrary word splits like "manage-ment".
  Font.registerHyphenationCallback((word) => [word])
}
