import type { ReactNode } from 'react'
import { Svg, Path, Rect, Circle } from '@react-pdf/renderer'
import type { ContactKind } from '@/lib/resumeFormat'

// Three non-obvious gotchas with react-pdf SVG that this file works around:
//
// 1. `<Svg>` doesn't inherit stroke/fill/strokeWidth to children — every
//    shape must carry those attributes itself.
//
// 2. `fill="none"` doesn't disable the fill. react-pdf evaluates fill via
//    `'fill' in props && props.fill`, and "none" is a truthy string, so it
//    triggers a fillAndStroke and silently falls back to solid black. To
//    render an outline glyph, omit the `fill` prop entirely.
//
// 3. `width` / `height` JSX attrs on <Svg> do NOT size the layout. Yoga
//    measures based on `style`, and falls back to the viewBox content
//    box (24×24) if no style is set — making icons render ~2× too large.
//    Pass dimensions through `style={{ width, height }}` instead.
//
// Stroke width is 1.75 (lucide's default is 2 at 24px). At ~9pt print
// size the lighter stroke matches the on-screen icon weight; at 2 the
// lines look chunky on PDF.

interface IconProps {
  size?: number
  color?: string
}

const STROKE = 1.75
const DEFAULT_SIZE = 9

function strokeProps(color: string) {
  return {
    stroke: color,
    strokeWidth: STROKE,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
}

function IconShell({
  size = DEFAULT_SIZE,
  children,
}: {
  size?: number
  children: ReactNode
}) {
  return (
    <Svg style={{ width: size, height: size }} viewBox="0 0 24 24">
      {children}
    </Svg>
  )
}

function PhoneIcon({ size, color = 'currentColor' }: IconProps) {
  const p = strokeProps(color)
  return (
    <IconShell size={size}>
      <Path
        {...p}
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      />
    </IconShell>
  )
}

function MailIcon({ size, color = 'currentColor' }: IconProps) {
  const p = strokeProps(color)
  return (
    <IconShell size={size}>
      <Rect {...p} x="2" y="4" width="20" height="16" rx="2" />
      <Path {...p} d="M22 7l-10 7L2 7" />
    </IconShell>
  )
}

function MapPinIcon({ size, color = 'currentColor' }: IconProps) {
  const p = strokeProps(color)
  return (
    <IconShell size={size}>
      <Path
        {...p}
        d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0z"
      />
      <Circle {...p} cx="12" cy="10" r="3" />
    </IconShell>
  )
}

function LinkedinIcon({ size, color = 'currentColor' }: IconProps) {
  const p = strokeProps(color)
  return (
    <IconShell size={size}>
      <Path
        {...p}
        d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"
      />
      <Rect {...p} x="2" y="9" width="4" height="12" />
      <Circle {...p} cx="4" cy="4" r="2" />
    </IconShell>
  )
}

function GithubIcon({ size, color = 'currentColor' }: IconProps) {
  const p = strokeProps(color)
  return (
    <IconShell size={size}>
      <Path
        {...p}
        d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
      />
      <Path {...p} d="M9 18c-4.51 2-5-2-7-2" />
    </IconShell>
  )
}

export function ExternalLinkIcon({ size, color = 'currentColor' }: IconProps) {
  const p = strokeProps(color)
  return (
    <IconShell size={size}>
      <Path {...p} d="M15 3h6v6" />
      <Path {...p} d="M10 14L21 3" />
      <Path {...p} d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
    </IconShell>
  )
}

// LeetCode is a fill-based brand glyph (no stroke). Matches BrandIcons.tsx
// exactly so the PDF and the on-screen contact rail render the same shape.
function LeetCodeIcon({ size, color = 'currentColor' }: IconProps) {
  return (
    <IconShell size={size}>
      <Path
        fill={color}
        d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"
      />
    </IconShell>
  )
}

export function ContactIcon({ kind, size, color }: { kind: ContactKind } & IconProps) {
  switch (kind) {
    case 'phone':
      return <PhoneIcon size={size} color={color} />
    case 'email':
      return <MailIcon size={size} color={color} />
    case 'location':
      return <MapPinIcon size={size} color={color} />
    case 'linkedin':
      return <LinkedinIcon size={size} color={color} />
    case 'github':
      return <GithubIcon size={size} color={color} />
    case 'leetcode':
      return <LeetCodeIcon size={size} color={color} />
    case 'portfolio':
      return <ExternalLinkIcon size={size} color={color} />
  }
}
