import { Routes, Route } from 'react-router-dom'
import ResumeBuilder from './pages/ResumeBuilder'
import MobileBlock from './components/MobileBlock'
import { useIsMobile } from './hooks/useIsMobile'

export default function App() {
  const isMobile = useIsMobile()

  if (isMobile) return <MobileBlock />

  return (
    <Routes>
      <Route path="/" element={<ResumeBuilder />} />
    </Routes>
  )
}
