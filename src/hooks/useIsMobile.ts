import { useEffect, useState } from 'react'

const MIN_DESKTOP_WIDTH = 900

function detect(): boolean {
  if (typeof window === 'undefined') return false

  const coarse = window.matchMedia('(pointer: coarse)').matches
  const noHover = window.matchMedia('(hover: none)').matches
  const touch =
    navigator.maxTouchPoints > 1 || 'ontouchstart' in window

  const uaData = (navigator as Navigator & {
    userAgentData?: { mobile?: boolean }
  }).userAgentData
  const uaMobileHint = uaData?.mobile === true
  const uaMobileRegex = /Android|iPhone|iPad|iPod|Mobile|Silk|BlackBerry|Opera Mini|IEMobile/i.test(
    navigator.userAgent,
  )

  const smallViewport = Math.min(window.innerWidth, window.innerHeight) < MIN_DESKTOP_WIDTH
  const smallScreen = Math.min(screen.width, screen.height) < MIN_DESKTOP_WIDTH

  if (uaMobileHint) return true
  if (uaMobileRegex) return true
  if (coarse && noHover && touch) return true
  if (touch && smallScreen) return true
  if (smallViewport && touch) return true

  return false
}

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => detect())

  useEffect(() => {
    const update = () => setIsMobile(detect())
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    const mql = window.matchMedia('(pointer: coarse)')
    mql.addEventListener?.('change', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      mql.removeEventListener?.('change', update)
    }
  }, [])

  return isMobile
}
