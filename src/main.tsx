import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// Keep the boot loader visible for at least one full draw cycle, then fade.
// The loop is 2.1s; ~900ms gets the first draw of all three lines and keeps
// the transition from feeling abrupt without noticeably delaying real content.
const BOOT_MIN_MS = 900
const bootEl = document.getElementById('bl-boot')
if (bootEl) {
  const start = (window as unknown as { __blBootStart?: number }).__blBootStart ?? Date.now()
  const wait = Math.max(0, BOOT_MIN_MS - (Date.now() - start))
  window.setTimeout(() => {
    bootEl.classList.add('bl-boot-leave')
    bootEl.addEventListener('transitionend', () => bootEl.remove(), { once: true })
  }, wait)
}
