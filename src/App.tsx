import { Routes, Route } from 'react-router-dom'
import ResumeBuilder from './pages/ResumeBuilder'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ResumeBuilder />} />
    </Routes>
  )
}
