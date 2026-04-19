/**
 * Compute the visual position (relative to the textarea) of a given
 * character offset inside a <textarea>. Uses the classic mirror-div
 * technique: clone the textarea's layout-relevant styles onto a hidden
 * absolutely-positioned div, pour in the text up to `position`, append
 * a zero-width marker span, and read back its offsets.
 *
 * Adapted from the public-domain `textarea-caret-position` library by
 * Jonathan Ong. Returns offsets relative to the textarea's padding box,
 * so callers should add the textarea's client rect for viewport coords.
 */

const MIRRORED_PROPERTIES = [
  'direction',
  'boxSizing',
  'width',
  'height',
  'overflowX',
  'overflowY',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',
  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
] as const

export interface CaretCoordinates {
  top: number
  left: number
  height: number
}

export function getCaretCoordinates(
  element: HTMLTextAreaElement,
  position: number,
): CaretCoordinates {
  const div = document.createElement('div')
  document.body.appendChild(div)

  const style = div.style
  const computed = window.getComputedStyle(element)

  style.whiteSpace = 'pre-wrap'
  style.wordWrap = 'break-word'
  style.position = 'absolute'
  style.visibility = 'hidden'

  for (const prop of MIRRORED_PROPERTIES) {
    style[prop] = computed[prop]
  }

  div.textContent = element.value.substring(0, position)
  const span = document.createElement('span')
  // A real glyph (not just an empty marker) so line-breaks at the end
  // register. Period is arbitrary — its width is irrelevant; we use
  // offsetLeft/offsetTop which measure the span's position, not its size.
  span.textContent = element.value.substring(position) || '.'
  div.appendChild(span)

  const coords: CaretCoordinates = {
    top: span.offsetTop + parseInt(computed.borderTopWidth),
    left: span.offsetLeft + parseInt(computed.borderLeftWidth),
    height: parseInt(computed.lineHeight) || parseInt(computed.fontSize) * 1.2,
  }

  document.body.removeChild(div)
  return coords
}
