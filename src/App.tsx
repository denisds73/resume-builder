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

export default function App() {
  return (
    <Routes>
      <Route path="/:handleSegment/:slug" element={<PublicResume />} />
      <Route path="/" element={<EditorGate />} />
    </Routes>
  )
}
