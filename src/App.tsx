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
    <div className="fixed top-0 inset-x-0 z-[9999] bg-yellow-400 text-black text-center text-xs font-semibold py-1 print:hidden">
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
