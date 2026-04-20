import type { ReactNode } from 'react'

/**
 * Tiny markdown renderer for the inline subset we support in resume copy:
 *   ***bold+italic***   **bold**   *italic*
 * Deliberately minimal — no links, code, headings, or arbitrary nesting.
 * Plain text between tokens is preserved verbatim, including line breaks
 * (consumers honor those via CSS `white-space: pre-wrap`).
 *
 * Order matters: the three-asterisk case is checked first, then two, then
 * one. Otherwise the parser would greedily consume the outer pair of a
 * `***word***` run as plain bold and mis-render the inner asterisks.
 */
export function renderInlineMarkdown(text: string): ReactNode[] {
  const out: ReactNode[] = []
  if (!text) return out

  let i = 0
  let k = 0

  while (i < text.length) {
    // Bold + italic: ***...***
    if (text.slice(i, i + 3) === '***') {
      const end = text.indexOf('***', i + 3)
      if (end !== -1) {
        out.push(
          <strong key={`bi-${k++}`}>
            <em>{text.slice(i + 3, end)}</em>
          </strong>,
        )
        i = end + 3
        continue
      }
    }
    // Bold: **...**
    if (text[i] === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2)
      if (end !== -1) {
        out.push(<strong key={`b-${k++}`}>{text.slice(i + 2, end)}</strong>)
        i = end + 2
        continue
      }
    }
    // Italic: *...* (single asterisk, already past the bold checks)
    if (text[i] === '*') {
      const end = text.indexOf('*', i + 1)
      if (end !== -1 && end !== i + 1) {
        out.push(<em key={`i-${k++}`}>{text.slice(i + 1, end)}</em>)
        i = end + 1
        continue
      }
    }
    // Plain run: consume characters until the next potential token.
    let run = ''
    while (i < text.length && text[i] !== '*') {
      run += text[i]
      i++
    }
    if (run) out.push(run)
  }

  return out
}
