import { useEffect, useRef, useState } from 'react'
import type { ResumeData } from '@/types/resume'
import ResumeDocument from './ResumeDocument'

interface Props {
  data: ResumeData
  /**
   * Overlay dashed page-break indicators and "PAGE N" labels across the
   * scaled document. Useful in the editor to show where content spills
   * onto the next page; suppress on the public/shared view where the
   * admin-tool indicators read as unprofessional to recruiters.
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
const PAGE_WIDTH_PX = 96 * 8.5
const PAGE_HEIGHT_PX = 96 * 11

export default function ResumePreview({
  data,
  showPageBreaks = true,
  showChrome = true,
  onPagesChange,
}: Props) {
  const frameRef = useRef<HTMLDivElement | null>(null)
  const docRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)
  const [docHeight, setDocHeight] = useState<number>(PAGE_HEIGHT_PX)

  // Track available width → compute the scale that fits the 8.5in document.
  useEffect(() => {
    const compute = () => {
      const frame = frameRef.current
      if (!frame) return
      const available = frame.clientWidth
      if (available === 0) return
      setScale(Math.min(1, available / PAGE_WIDTH_PX))
    }
    compute()
    const ro = new ResizeObserver(compute)
    if (frameRef.current) ro.observe(frameRef.current)
    return () => ro.disconnect()
  }, [])

  // Track the document's actual rendered height so the frame grows with content.
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

  // Render dashed dividers at each page boundary. Skipped on the public
  // view (showPageBreaks=false) since admin-style indicators read as
  // unfinished to recruiters opening a shared link.
  const pageBreaks: React.ReactNode[] = []
  if (showPageBreaks) {
    for (let i = 1; i < pages; i++) {
      pageBreaks.push(
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${i * PAGE_HEIGHT_PX * scale}px`,
            height: 0,
            borderTop: '1.5px dashed rgba(0,0,0,0.22)',
            pointerEvents: 'none',
          }}
        />,
      )
      pageBreaks.push(
        <div
          key={`label-${i}`}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 8,
            top: `${i * PAGE_HEIGHT_PX * scale + 4}px`,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '10px',
            letterSpacing: '0.08em',
            color: 'rgba(0,0,0,0.35)',
            background: '#fff',
            padding: '1px 6px',
            borderRadius: 3,
            pointerEvents: 'none',
          }}
        >
          PAGE {i + 1}
        </div>,
      )
    }
  }

  return (
    <div
      className={
        showChrome
          ? 'rounded-xl border border-border bg-background/40 p-4'
          : ''
      }
    >
      {showChrome && (
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-text-muted">
            Live Preview
          </p>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-text-muted">
            {pages} {pages === 1 ? 'page' : 'pages'}
          </p>
        </div>
      )}
      <div
        ref={frameRef}
        className="relative overflow-hidden rounded-md shadow-2xl shadow-black/40"
        style={{
          height: `${framedHeight}px`,
          background: '#fff',
        }}
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
        {pageBreaks}
      </div>
    </div>
  )
}
