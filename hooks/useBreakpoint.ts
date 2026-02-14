import { useState, useEffect } from 'react'

type Breakpoint = 'mobile' | 'tablet' | 'desktop'

const MOBILE_MAX = 640
const TABLET_MAX = 1024

function getBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') return 'desktop'
  const w = window.innerWidth
  if (w < MOBILE_MAX) return 'mobile'
  if (w < TABLET_MAX) return 'tablet'
  return 'desktop'
}

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop')

  useEffect(() => {
    const update = () => setBreakpoint(getBreakpoint())
    update()

    const mqMobile = window.matchMedia(`(max-width: ${MOBILE_MAX - 1}px)`)
    const mqTablet = window.matchMedia(`(max-width: ${TABLET_MAX - 1}px)`)

    const handler = () => update()
    mqMobile.addEventListener('change', handler)
    mqTablet.addEventListener('change', handler)

    return () => {
      mqMobile.removeEventListener('change', handler)
      mqTablet.removeEventListener('change', handler)
    }
  }, [])

  return breakpoint
}
