import { useEffect, useState } from 'react'

export function useIsDesktop() {
  const [desktop, setDesktop] = useState(
    () => window.matchMedia('(min-width: 768px)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const on = (e) => setDesktop(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  return desktop
}
