import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import type { ResumeData } from '@/types/resume'
import Tooltip from '@/components/Tooltip'
import { useDismiss } from '@/lib/useDismiss'
import { MOTION } from '@/lib/motion'
import ResumeDocument from './ResumeDocument'

interface Props {
  data: ResumeData
  /**
   * Overlay page-break indicators and run the content-aware page-snap
   * algorithm that pushes any entry straddling a page boundary to the
   * top of the next page. Useful in the editor so the author sees where
   * content will break in the PDF and can budget per-page. Suppress on
   * the public/shared view — that context renders as a continuous
   * reading surface without paper affordances.
   */
  showPageBreaks?: boolean
  /**
   * Hide the "Live Preview · N pages" chrome strip above the document.
   * The public page renders the resume as a finished artifact and carries
   * its own chrome in the sticky header.
   */
  showChrome?: boolean
  /**
   * Notify the caller whenever the computed page count changes. Lets the
   * public view expose page count in its own top bar without duplicating
   * the height-measurement logic.
   */
  onPagesChange?: (pages: number) => void
}

// CSS pixel values for a US Letter page at 96dpi.
//
// The PDF uses 0.55in top/bottom page margins (see src/pdf/tokens.ts), so
// the per-page usable content area is 11in − 2×0.55in = 9.9in. The on-screen
// document supplies its own 0.55in top+bottom padding to match. To mirror
// the PDF's pagination in the live preview we reason in three numbers:
//
//   PAGE_HEIGHT_PX   — total page stride (full 11in sheet)
//   PAGE_MARGIN_PX   — per-page top/bottom margin (0.55in)
//   PAGE_CONTENT_PX  — usable content area per page (9.9in)
//
// Page N (0-indexed) occupies the document y-range
//   [PAGE_MARGIN_PX + N * PAGE_HEIGHT_PX,
//    PAGE_MARGIN_PX + N * PAGE_HEIGHT_PX + PAGE_CONTENT_PX]
// with a 2×PAGE_MARGIN_PX gap of "white space" between consecutive pages.
// The content-aware snap algorithm uses PAGE_CONTENT_PX (not the stride)
// to decide whether an entry straddles — that's the fix for a preview
// that claims "2 pages" while the PDF actually paginates to 3.
const PAGE_WIDTH_PX = 96 * 8.5
const PAGE_HEIGHT_PX = 96 * 11
const PAGE_MARGIN_PX = 96 * 0.55
const PAGE_CONTENT_PX = PAGE_HEIGHT_PX - 2 * PAGE_MARGIN_PX

type ZoomMode = 'fit' | 1 | 1.25 | 1.5

export default function ResumePreview({
  data,
  showPageBreaks = true,
  showChrome = true,
  onPagesChange,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const docRef = useRef<HTMLDivElement | null>(null)
  const [fitScale, setFitScale] = useState(1)
  const [zoom, setZoom] = useState<ZoomMode>('fit')
  const [docHeight, setDocHeight] = useState<number>(PAGE_HEIGHT_PX)
  const [activePage, setActivePage] = useState(1)

  // Track available width → compute the scale that fits the 8.5in document.
  useEffect(() => {
    const compute = () => {
      const wrap = wrapRef.current
      if (!wrap) return
      const available = wrap.clientWidth
      if (available === 0) return
      setFitScale(Math.min(1, available / PAGE_WIDTH_PX))
    }
    compute()
    const ro = new ResizeObserver(compute)
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  const scale = zoom === 'fit' ? fitScale : zoom

  // Content-aware page snap. Walk each [data-resume-entry] in document
  // order; if it straddles a page boundary, inject paddingTop that pushes
  // it to the start of the next page. Runs before the browser paints so
  // the user never sees a mid-entry cut. Skipped on the public view —
  // continuous scrolling there has no paper metaphor to respect.
  useLayoutEffect(() => {
    const doc = docRef.current
    if (!doc) return
    // Collect both section headers and entries in DOM order. Section
    // headers participate in the snap so that "keep-with-next" holds:
    // a header must never be the last thing on its page while its first
    // entry sits on the next one. Mirrors the print-CSS rule
    // [data-resume-section-header] { break-after: avoid } so the
    // preview and the PDF paginate identically.
    const blocks = Array.from(
      doc.querySelectorAll<HTMLElement>(
        '[data-resume-section-header], [data-resume-entry]',
      ),
    ).map((el) => ({
      el,
      kind: el.hasAttribute('data-resume-section-header')
        ? ('header' as const)
        : ('entry' as const),
    }))
    // Always reset: when showPageBreaks flips off (or between renders)
    // we must not leave stale paddings behind.
    blocks.forEach(({ el }) => {
      el.style.paddingTop = ''
    })
    if (!showPageBreaks || scale <= 0) {
      // Still update measured height after reset.
      setDocHeight(doc.scrollHeight)
      return
    }
    // Force reflow after reset so subsequent rect reads are accurate.
    void doc.offsetHeight

    // Iterate sequentially: each injected spacer shifts downstream
    // blocks, so we must re-measure per iteration rather than batch.
    for (let i = 0; i < blocks.length; i++) {
      const { el, kind } = blocks[i]
      const rect = el.getBoundingClientRect()
      const docRect = doc.getBoundingClientRect()
      const topDoc = (rect.top - docRect.top) / scale
      const heightDoc = rect.height / scale

      // For a section header, the "effective bottom" extends to include
      // the following entry — that's how we enforce keep-with-next.
      // When the combined header+entry would straddle, we pad the header
      // itself (instead of just the entry) so they travel together.
      // Oversize combinations fall back to the header's own geometry so
      // we don't insert an unreasonably large spacer.
      let effectiveBottom = topDoc + heightDoc
      if (kind === 'header') {
        const next = blocks[i + 1]
        if (next && next.kind === 'entry') {
          const nextRect = next.el.getBoundingClientRect()
          const nextBottom = (nextRect.bottom - docRect.top) / scale
          if (nextBottom - topDoc < PAGE_CONTENT_PX) {
            effectiveBottom = nextBottom
          }
        }
      } else if (heightDoc >= PAGE_CONTENT_PX) {
        continue
      }

      const relTop = topDoc - PAGE_MARGIN_PX
      if (relTop < 0) continue
      const pageIdx = Math.floor(relTop / PAGE_HEIGHT_PX)
      const pageContentStart = PAGE_MARGIN_PX + pageIdx * PAGE_HEIGHT_PX
      const pageContentEnd = pageContentStart + PAGE_CONTENT_PX
      if (effectiveBottom <= pageContentEnd) continue

      // Straddles — snap to the next page's content start. The spacer
      // absorbs the current page's bottom margin and the next page's
      // top margin. For a header, this drags its first entry along.
      const nextStart = pageContentStart + PAGE_HEIGHT_PX
      const spacer = nextStart - topDoc
      if (spacer > 0 && spacer < PAGE_HEIGHT_PX) {
        el.style.paddingTop = `${spacer}px`
        void doc.offsetHeight
      }
    }
    setDocHeight(doc.scrollHeight)
  }, [data, scale, showPageBreaks])

  // Track the document's actual rendered height so the frame grows with
  // content. Complements the layout effect above for changes that don't
  // go through React (e.g. font load, dynamic image).
  useEffect(() => {
    const doc = docRef.current
    if (!doc) return
    const update = () => setDocHeight(doc.scrollHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(doc)
    return () => ro.disconnect()
  }, [])

  const pages = Math.max(1, Math.ceil(docHeight / PAGE_HEIGHT_PX))
  const framedHeight = Math.max(PAGE_HEIGHT_PX, docHeight) * scale

  // Emit page-count changes so callers (e.g. the public view's top bar)
  // can show a "2 pages" chip without remeasuring.
  useEffect(() => {
    onPagesChange?.(pages)
  }, [pages, onPagesChange])

  // Render a refined page seam at each boundary: a thin rule + a small
  // page-number chip pinned to the right margin. Replaces the earlier
  // dashed-line-plus-"PAGE N" treatment which read as an admin overlay.
  const pageBreaks: React.ReactNode[] = []
  if (showPageBreaks) {
    for (let i = 1; i < pages; i++) {
      const y = i * PAGE_HEIGHT_PX * scale
      pageBreaks.push(
        <div
          key={`rule-${i}`}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${y - 1}px`,
            height: 2,
            pointerEvents: 'none',
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.14) 50%, rgba(0,0,0,0) 100%)',
          }}
        />,
      )
      pageBreaks.push(
        <div
          key={`chip-${i}`}
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: 10,
            top: `${y + 8}px`,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '9px',
            letterSpacing: '0.22em',
            color: 'rgba(0,0,0,0.34)',
            background: 'rgba(255,255,255,0.9)',
            padding: '2px 7px',
            borderRadius: 999,
            pointerEvents: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          {String(i + 1).padStart(2, '0')}
        </div>,
      )
    }
  }

  // Anchors at each page boundary so the page stepper can scroll the
  // browser viewport (or whatever scroll container holds the preview)
  // straight to "page N" without remeasuring outside this component.
  const pageAnchors = useMemo(() => {
    const items: React.ReactNode[] = []
    for (let i = 0; i < pages; i++) {
      const y = i === 0 ? 0 : i * PAGE_HEIGHT_PX * scale - 60
      items.push(
        <span
          key={`anchor-${i}`}
          id={`resume-page-${i + 1}`}
          aria-hidden
          style={{ position: 'absolute', left: 0, top: `${Math.max(0, y)}px`, width: 1, height: 1 }}
        />,
      )
    }
    return items
  }, [pages, scale])

  function gotoPage(n: number) {
    const clamped = Math.max(1, Math.min(pages, n))
    setActivePage(clamped)
    document
      .getElementById(`resume-page-${clamped}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const frameWidth = zoom === 'fit' ? '100%' : `${PAGE_WIDTH_PX * scale}px`
  const wrapOverflowCls = zoom === 'fit' ? '' : 'overflow-x-auto'

  if (!showChrome) {
    return (
      <div ref={wrapRef} className={`${wrapOverflowCls}`}>
        <div
          ref={frameRef}
          className="relative overflow-hidden rounded-md shadow-2xl shadow-black/40"
          style={{ height: `${framedHeight}px`, width: frameWidth, background: '#fff' }}
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: `${PAGE_WIDTH_PX}px`,
            }}
          >
            <div
              ref={docRef}
              style={{
                width: `${PAGE_WIDTH_PX}px`,
                minHeight: `${PAGE_HEIGHT_PX}px`,
              }}
            >
              <ResumeDocument data={data} />
            </div>
          </div>
          {pageAnchors}
          {pageBreaks}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-background/40">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-t-xl border-b border-border bg-background/85 px-4 py-2 backdrop-blur">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-text-muted">
          Live Preview
        </p>
        <div className="flex items-center gap-1.5">
          {pages > 1 && (
            <PageStepper
              page={activePage}
              total={pages}
              onChange={gotoPage}
            />
          )}
          <ZoomControl value={zoom} onChange={setZoom} />
        </div>
      </div>
      <div ref={wrapRef} className={`p-4 ${wrapOverflowCls}`}>
        <div
          ref={frameRef}
          className="relative overflow-hidden rounded-md shadow-2xl shadow-black/40"
          style={{ height: `${framedHeight}px`, width: frameWidth, background: '#fff' }}
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: `${PAGE_WIDTH_PX}px`,
            }}
          >
            <div
              ref={docRef}
              style={{
                width: `${PAGE_WIDTH_PX}px`,
                minHeight: `${PAGE_HEIGHT_PX}px`,
              }}
            >
              <ResumeDocument data={data} />
            </div>
          </div>
          {pageAnchors}
          {pageBreaks}
        </div>
      </div>
    </div>
  )
}

const ZOOM_LABELS: Record<string, string> = {
  fit: 'Fit',
  '1': '100%',
  '1.25': '125%',
  '1.5': '150%',
}

function ZoomControl({
  value,
  onChange,
}: {
  value: ZoomMode
  onChange: (z: ZoomMode) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  useDismiss(open, () => setOpen(false), ref)

  const label = value === 'fit' ? 'Fit' : ZOOM_LABELS[String(value)]
  const options: ZoomMode[] = ['fit', 1, 1.25, 1.5]

  return (
    <div ref={ref} className="relative">
      <Tooltip content="Zoom">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Zoom"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-surface px-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          <ZoomIn className="h-3 w-3" />
          {label}
        </button>
      </Tooltip>
      <AnimatePresence>
      {open && (
        <motion.div
          role="menu"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: MOTION.fast }}
          className="absolute right-0 top-full z-40 mt-2 w-32 overflow-hidden rounded-lg border border-border bg-bg-card shadow-lg shadow-black/40"
        >
          {options.map((opt) => {
            const optLabel = opt === 'fit' ? 'Fit' : ZOOM_LABELS[String(opt)]
            const selected = opt === value
            return (
              <button
                key={String(opt)}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  onChange(opt)
                  setOpen(false)
                }}
                className={`block w-full px-3 py-1.5 text-left text-xs transition-colors ${
                  selected
                    ? 'bg-accent/15 text-accent'
                    : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                }`}
              >
                {optLabel}
              </button>
            )
          })}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}

function PageStepper({
  page,
  total,
  onChange,
}: {
  page: number
  total: number
  onChange: (n: number) => void
}) {
  return (
    <div className="inline-flex items-stretch overflow-hidden rounded-md border border-border bg-surface text-text-secondary">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="inline-flex h-7 w-6 items-center justify-center transition-colors hover:bg-accent/10 hover:text-accent disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-text-secondary"
      >
        <ChevronLeft className="h-3 w-3" />
      </button>
      <span aria-hidden className="w-px bg-border" />
      <span className="inline-flex h-7 items-center px-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-text-secondary">
        {page} / {total}
      </span>
      <span aria-hidden className="w-px bg-border" />
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= total}
        aria-label="Next page"
        className="inline-flex h-7 w-6 items-center justify-center transition-colors hover:bg-accent/10 hover:text-accent disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-text-secondary"
      >
        <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  )
}
