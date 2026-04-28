import type { TemplateId } from '@/resume/templates'

interface Props {
  id: TemplateId
  className?: string
}

// Hand-crafted miniatures meant to evoke the template's voice rather than
// preview real content. Page aspect mirrors US Letter (8.5x11).
export default function TemplateThumbnail({ id, className }: Props) {
  return (
    <svg
      viewBox="0 0 64 82"
      className={className}
      role="img"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <rect width="64" height="82" rx="2" fill="#ffffff" />
      {id === 'classic' && <Classic />}
      {id === 'modern' && <Modern />}
      {id === 'minimal' && <Minimal />}
    </svg>
  )
}

function Classic() {
  const ink = '#111111'
  const muted = '#9a9a9a'
  return (
    <g>
      <rect x="6" y="9" width="32" height="5" rx="0.5" fill={ink} />
      <rect x="6" y="16" width="18" height="2" rx="0.5" fill={muted} />
      <line x1="6" y1="22" x2="58" y2="22" stroke="#d9d9d9" strokeWidth="0.5" />
      <rect x="6" y="26" width="14" height="2.2" rx="0.4" fill={ink} />
      <rect x="6" y="30" width="46" height="1.4" rx="0.4" fill={muted} />
      <rect x="6" y="33" width="42" height="1.4" rx="0.4" fill={muted} />
      <rect x="6" y="36" width="48" height="1.4" rx="0.4" fill={muted} />
      <line x1="6" y1="42" x2="58" y2="42" stroke="#d9d9d9" strokeWidth="0.5" />
      <rect x="6" y="46" width="12" height="2.2" rx="0.4" fill={ink} />
      <rect x="6" y="50" width="44" height="1.4" rx="0.4" fill={muted} />
      <rect x="6" y="53" width="40" height="1.4" rx="0.4" fill={muted} />
      <rect x="6" y="56" width="46" height="1.4" rx="0.4" fill={muted} />
      <line x1="6" y1="62" x2="58" y2="62" stroke="#d9d9d9" strokeWidth="0.5" />
      <rect x="6" y="66" width="10" height="2.2" rx="0.4" fill={ink} />
      <rect x="6" y="70" width="42" height="1.4" rx="0.4" fill={muted} />
      <rect x="6" y="73" width="38" height="1.4" rx="0.4" fill={muted} />
    </g>
  )
}

function Modern() {
  const ink = '#1f2a44'
  const muted = '#9a9a9a'
  return (
    <g>
      <rect x="6" y="9" width="32" height="5.4" rx="0.5" fill={ink} />
      <rect x="6" y="16.5" width="20" height="1.8" rx="0.4" fill={muted} />
      <rect x="6" y="25" width="11" height="1.6" rx="0.4" fill={ink} />
      <rect x="6" y="29.5" width="46" height="1.4" rx="0.4" fill={muted} />
      <rect x="6" y="32.5" width="42" height="1.4" rx="0.4" fill={muted} />
      <rect x="6" y="35.5" width="48" height="1.4" rx="0.4" fill={muted} />
      <rect x="6" y="44" width="13" height="1.6" rx="0.4" fill={ink} />
      <rect x="6" y="48.5" width="44" height="1.4" rx="0.4" fill={muted} />
      <rect x="6" y="51.5" width="40" height="1.4" rx="0.4" fill={muted} />
      <rect x="6" y="54.5" width="46" height="1.4" rx="0.4" fill={muted} />
      <rect x="6" y="63" width="9" height="1.6" rx="0.4" fill={ink} />
      <rect x="6" y="67.5" width="42" height="1.4" rx="0.4" fill={muted} />
      <rect x="6" y="70.5" width="38" height="1.4" rx="0.4" fill={muted} />
    </g>
  )
}

function Minimal() {
  const ink = '#1f1f1f'
  const muted = '#bdbdbd'
  return (
    <g>
      <rect x="9" y="12" width="22" height="3.2" rx="0.4" fill={ink} />
      <rect x="9" y="17.5" width="14" height="1.4" rx="0.3" fill={muted} />
      <rect x="9" y="30" width="9" height="1.5" rx="0.3" fill={muted} />
      <rect x="9" y="34.5" width="40" height="1.2" rx="0.3" fill={muted} />
      <rect x="9" y="37.5" width="36" height="1.2" rx="0.3" fill={muted} />
      <rect x="9" y="40.5" width="42" height="1.2" rx="0.3" fill={muted} />
      <rect x="9" y="52" width="9" height="1.5" rx="0.3" fill={muted} />
      <rect x="9" y="56.5" width="38" height="1.2" rx="0.3" fill={muted} />
      <rect x="9" y="59.5" width="34" height="1.2" rx="0.3" fill={muted} />
      <rect x="9" y="68" width="9" height="1.5" rx="0.3" fill={muted} />
      <rect x="9" y="72.5" width="36" height="1.2" rx="0.3" fill={muted} />
    </g>
  )
}
