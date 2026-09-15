import { useEffect, useRef } from 'react'

/* Mengembalikan ref untuk elemen, dan fungsi report(dx) yang dipanggil
   saat elemen bergerak. Elemen membaca --v di CSS-nya sendiri. */
export function useVelocitySkew(enabled = true) {
  const ref = useRef(null)
  const vel = useRef(0)
  const raf = useRef(0)
  const terlihat = useRef(true)

  const loop = () => {
    raf.current = 0
    vel.current *= 0.86

    const el = ref.current
    if (!el) return

    if (Math.abs(vel.current) < 0.05) {
      vel.current = 0
      el.style.setProperty('--v', '0')
      el.style.setProperty('--va', '0')
      return
    }

    const v = Math.max(-1, Math.min(1, vel.current / 40))
    el.style.setProperty('--v', v.toFixed(3))
    el.style.setProperty('--va', Math.abs(v).toFixed(3))

    if (terlihat.current) raf.current = requestAnimationFrame(loop)
  }

  const report = (dx) => {
    vel.current = dx
    if (enabled && terlihat.current && !raf.current) {
      raf.current = requestAnimationFrame(loop)
    }
  }

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return

    const io = new IntersectionObserver(
      ([e]) => {
        terlihat.current = e.isIntersecting
        if (!e.isIntersecting && raf.current) {
          cancelAnimationFrame(raf.current)
          raf.current = 0
          el.style.setProperty('--v', '0')
          el.style.setProperty('--va', '0')
        }
      },
      { rootMargin: '80px' }
    )

    io.observe(el)

    return () => {
      io.disconnect()
      if (raf.current) cancelAnimationFrame(raf.current)
      raf.current = 0
    }
  }, [enabled])

  return { ref, report }
}
