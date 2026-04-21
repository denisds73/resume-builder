import { Routes, Route } from 'react-router-dom'
import ResumeBuilder from './pages/ResumeBuilder'
import PublicResume from './pages/PublicResume'
import MobileBlock from './components/MobileBlock'
import { useIsMobile } from './hooks/useIsMobile'

function EditorGate() {
  // The editor is a two-pane workspace that doesn't fit small screens.
  // Public resume URLs (/@handle/slug) are unaffected — recruiters often
  // open shared links on their phones, so those routes must always render.
  const isMobile = useIsMobile()
  return isMobile ? <MobileBlock /> : <ResumeBuilder />
}

const PROD_HOST = 'resumef.vercel.app'

function StagingBanner() {
  if (typeof window === 'undefined') return null
  const host = window.location.hostname
  if (host === PROD_HOST || host === 'localhost') return null
  return (
    <div className="fixed top-0 inset-x-0 z-[9999] bg-slate-800/95 backdrop-blur text-slate-100 text-center text-xs font-medium py-1.5 print:hidden flex items-center justify-center gap-2 tracking-wide">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
      </span>
      STAGING — not visible to real users
    </div>
  )
}

export default function App() {
  return (
    <>
      <StagingBanner />
      <Routes>
        <Route path="/:handleSegment/:slug" element={<PublicResume />} />
        <Route path="/" element={<EditorGate />} />
      </Routes>
    </>
  )
}
