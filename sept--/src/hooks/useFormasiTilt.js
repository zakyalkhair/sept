import { useEffect, useRef } from 'react'
import { useMotionValue, useSpring } from 'motion/react'
import { usePointerFine } from './usePointerFine.js'
import { useReducedMotion } from './useReducedMotion.js'

const SPRING = { stiffness: 90, damping: 18, mass: 0.8 }
const MAKS = 7 // derajat kemiringan maksimum

/* Satu listener pointermove untuk seluruh formasi (bukan per-kartu),
   di-gerbang pointer:fine + reduced-motion + IntersectionObserver. */
export function useFormasiTilt(aktif) {
  const ref = useRef(null)
  const fine = usePointerFine()
  const reduced = useReducedMotion()
  const jalan = aktif && fine && !reduced

  const rxRaw = useMotionValue(0)
  const ryRaw = useMotionValue(0)
  const rotateX = useSpring(rxRaw, SPRING)
  const rotateY = useSpring(ryRaw, SPRING)

  useEffect(() => {
    const el = ref.current
    if (!el || !jalan) return

    let terlihat = true

    const onMove = (e) => {
      if (!terlihat) return
      const p = (e.clientX / window.innerWidth - 0.5) * 2
      const q = (e.clientY / window.innerHeight - 0.5) * 2
      ryRaw.set(p * MAKS)
      rxRaw.set(-q * MAKS)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        terlihat = entry.isIntersecting
        if (!terlihat) {
          rxRaw.set(0)
          ryRaw.set(0)
        }
      },
      { rootMargin: '0px' }
    )

    io.observe(el)
    window.addEventListener('pointermove', onMove, { passive: true })

    return () => {
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      rxRaw.set(0)
      ryRaw.set(0)
    }
  }, [jalan, rxRaw, ryRaw])

  return {
    ref,
    rotateX: jalan ? rotateX : 0,
    rotateY: jalan ? rotateY : 0,
  }
}
