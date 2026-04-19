import type { ReactNode } from 'react'

/**
 * Tiny markdown renderer for the inline subset we support in resume copy:
 *   **bold**  *italic*
 * Deliberately minimal — no links, code, headings, nested emphasis. Plain
 * text between tokens is preserved verbatim (including line breaks, which
 * consumers can decide to honor via CSS `white-space: pre-wrap`).
 *
 * Returns a flat array of ReactNodes ready for rendering inside any block.
 */
export function renderInlineMarkdown(text: string): ReactNode[] {
  const out: ReactNode[] = []
  if (!text) return out

  let i = 0
  let keyCounter = 0
  const push = (node: ReactNode) => out.push(node)

  while (i < text.length) {
    // Bold: **...**
    if (text[i] === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2)
      if (end !== -1) {
        push(<strong key={`b-${keyCounter++}`}>{text.slice(i + 2, end)}</strong>)
        i = end + 2
        continue
      }
    }
    // Italic: *...* (single asterisk; we already handled the bold case above)
    if (text[i] === '*') {
      const end = text.indexOf('*', i + 1)
      if (end !== -1 && end !== i + 1) {
        push(<em key={`i-${keyCounter++}`}>{text.slice(i + 1, end)}</em>)
        i = end + 1
        continue
      }
    }
    // Plain run until the next potential token
    let run = ''
    while (i < text.length && text[i] !== '*') {
      run += text[i]
      i++
    }
    if (run) push(run)
  }

  return out
}
