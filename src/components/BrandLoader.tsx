type Size = 'sm' | 'md' | 'lg'

const DIM: Record<Size, number> = { sm: 14, md: 20, lg: 48 }

interface Props {
  size?: Size
  label?: string
  className?: string
}

// A branded loader that redraws the favicon's three document lines in a
// continuous "drafting" loop. Keyframes live inside <style> so the component
// is fully self-contained — import and drop in anywhere.
export default function BrandLoader({
  size = 'md',
  label = 'Loading',
  className,
}: Props) {
  const px = DIM[size]
  return (
    <span
      role="status"
      aria-label={label}
      className={className}
      style={{ display: 'inline-flex', lineHeight: 0 }}
    >
      <style>{KEYFRAMES}</style>
      <svg
        width={px}
        height={px}
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ filter: 'drop-shadow(0 0 6px rgba(255,90,54,0.0))' }}
        className="bl-svg"
      >
        <rect
          x="0.75"
          y="0.75"
          width="30.5"
          height="30.5"
          rx="6.5"
          fill="none"
          stroke="rgba(240,237,230,0.08)"
        />
        <path
          d="M9 7 h9.5 l4.5 4.5 v13 a1.25 1.25 0 0 1 -1.25 1.25 h-12.75 a1.25 1.25 0 0 1 -1.25 -1.25 v-16.25 a1.25 1.25 0 0 1 1.25 -1.25 z"
          fill="none"
          stroke="var(--color-accent, #FF5A36)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M18.5 7 v4.5 h4.5"
          fill="none"
          stroke="var(--color-accent, #FF5A36)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="bl-fold"
        />
        <line
          className="bl-line bl-line-1"
          x1="11.5" y1="15" x2="20.5" y2="15"
          stroke="var(--color-text-primary, #F0EDE6)"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <line
          className="bl-line bl-line-2"
          x1="11.5" y1="18.5" x2="18.25" y2="18.5"
          stroke="var(--color-text-primary, #F0EDE6)"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <line
          className="bl-line bl-line-3"
          x1="11.5" y1="22" x2="20.5" y2="22"
          stroke="var(--color-text-primary, #F0EDE6)"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
      <span
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {label}
      </span>
    </span>
  )
}

const KEYFRAMES = `
@keyframes bl-draw {
  0%   { stroke-dashoffset: var(--len); opacity: 0; }
  12%  { opacity: 1; }
  45%  { stroke-dashoffset: 0; opacity: 1; }
  75%  { stroke-dashoffset: 0; opacity: var(--rest, 0.9); }
  100% { stroke-dashoffset: 0; opacity: var(--rest, 0.9); }
}
@keyframes bl-glow {
  0%, 100% { filter: drop-shadow(0 0 6px rgba(255,90,54,0.0)); }
  50%      { filter: drop-shadow(0 0 8px rgba(255,90,54,0.35)); }
}
@keyframes bl-fold-shimmer {
  0%, 92%, 100% { stroke: var(--color-accent, #FF5A36); }
  96%           { stroke: #FFB199; }
}
.bl-svg {
  animation: bl-glow 2.1s ease-in-out infinite;
}
.bl-fold {
  animation: bl-fold-shimmer 2.1s linear infinite;
}
.bl-line {
  --len: 10;
  stroke-dasharray: var(--len);
  stroke-dashoffset: var(--len);
  animation: bl-draw 2.1s cubic-bezier(0.65, 0, 0.35, 1) infinite;
  transform-box: fill-box;
}
.bl-line-1 { --len: 9;    --rest: 0.95; animation-delay: 0s; }
.bl-line-2 { --len: 6.75; --rest: 0.55; animation-delay: 0.18s; }
.bl-line-3 { --len: 9;    --rest: 0.55; animation-delay: 0.36s; }

@media (prefers-reduced-motion: reduce) {
  .bl-svg, .bl-fold { animation: none; }
  .bl-line {
    stroke-dasharray: none;
    stroke-dashoffset: 0;
    animation: bl-fade 1.6s ease-in-out infinite;
  }
  .bl-line-1 { opacity: 0.95; }
  .bl-line-2, .bl-line-3 { opacity: 0.55; }
  @keyframes bl-fade {
    0%, 100% { opacity: var(--rest, 0.9); }
    50%      { opacity: 0.3; }
  }
}
`
