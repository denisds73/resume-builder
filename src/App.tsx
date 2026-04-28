import { Routes, Route } from 'react-router-dom'
import ResumeBuilder from './pages/ResumeBuilder'
import PublicResume from './pages/PublicResume'
import Settings from './pages/Settings'
import Resumes from './pages/Resumes'
import MobileBlock from './components/MobileBlock'
import Toaster from './components/Toaster'
import KeyboardShortcuts from './components/KeyboardShortcuts'
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
    <div
      className="fixed bottom-4 right-4 z-[9999] pointer-events-none print:hidden select-none flex items-center gap-2 rounded-full border border-[color:var(--color-accent)]/40 bg-[color:var(--color-bg-elevated)]/80 backdrop-blur px-3 py-1.5 text-[11px] font-medium tracking-wide text-[color:var(--color-text-primary)] shadow-lg shadow-black/40"
      aria-label="Staging environment indicator"
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[color:var(--color-accent)] opacity-60 animate-ping" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent)]" />
      </span>
      Staging
    </div>
  )
}

export default function App() {
  return (
    <>
      <StagingBanner />
      <Toaster />
      <KeyboardShortcuts />
      <Routes>
        <Route path="/:handleSegment/:slug" element={<PublicResume />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/resumes" element={<Resumes />} />
        <Route path="/" element={<EditorGate />} />
      </Routes>
    </>
  )
}
