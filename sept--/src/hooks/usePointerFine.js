import { useEffect, useState } from 'react'

export function usePointerFine() {
  const [fine, setFine] = useState(
    () => window.matchMedia('(pointer: fine)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    const on = (e) => setFine(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  return fine
}
