import { useEffect, useRef } from 'react'
import { useMotionValue, useSpring } from 'motion/react'
import { usePointerFine } from './usePointerFine.js'
import { useReducedMotion } from './useReducedMotion.js'

const SPRING = { stiffness: 260, damping: 20, mass: 0.6 }

export function useMagnetic({ kuat = 0.32, radius = 90 } = {}) {
  const ref = useRef(null)
  const fine = usePointerFine()
  const reduced = useReducedMotion()
  const aktif = fine && !reduced

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, SPRING)
  const y = useSpring(my, SPRING)

  useEffect(() => {
    const el = ref.current
    if (!el || !aktif) return

    let terlihat = true

    const onMove = (e) => {
      if (!terlihat) return
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const jarak = Math.hypot(dx, dy)
      const jangkauan = Math.max(r.width, r.height) / 2 + radius

      if (jarak > jangkauan) {
        mx.set(0)
        my.set(0)
        return
      }

      /* Tarikan meluruh ke tepi jangkauan — tidak ada lompatan saat
         kursor melewati batas. */
      const luruh = 1 - jarak / jangkauan
      mx.set(dx * kuat * luruh)
      my.set(dy * kuat * luruh)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        terlihat = entry.isIntersecting
        if (!terlihat) {
          mx.set(0)
          my.set(0)
        }
      },
      { rootMargin: '120px' }
    )

    io.observe(el)
    window.addEventListener('pointermove', onMove, { passive: true })

    return () => {
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      mx.set(0)
      my.set(0)
    }
  }, [aktif, kuat, radius, mx, my])

  return { ref, x: aktif ? x : 0, y: aktif ? y : 0, aktif }
}
