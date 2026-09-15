import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from './useReducedMotion.js'

gsap.registerPlugin(ScrollTrigger)

/* Perabot kertas surat yang bergerak mengikuti scroll. Ketiganya digabung di
   satu hook karena trigger-nya sama — lembar suratnya sendiri.

   1. Bekas lipatan memudar — kertasnya "melemas" setelah keluar dari amplop.
   2. Garis margin tumbuh ke bawah mengikuti progres baca.
   3. Kop (tanggal + sapaan) naik pelan & memudar saat dilewati.

   Semua yang dianimasikan properti komposit murni (`opacity`, `transform`),
   sesuai aturan performa 05-pembuka §5.6.5. */
export function useKertasSurat() {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const root = ref.current
    if (!root) return

    const lipatan = root.querySelectorAll('[data-lipatan]')
    const margin = root.querySelector('[data-margin]')
    const kop = root.querySelectorAll('[data-kop]')

    if (reduced) {
      lipatan.forEach((el) => { el.style.opacity = '0' })
      if (margin) margin.style.transform = 'scaleY(1)'
      return
    }

    const ctx = gsap.context(() => {
      /* `end` HARUS fungsi, bukan '+=75%'. Persen di `end` dihitung dari
         tinggi trigger, dan trigger di sini selembar surat yang sangat
         panjang — lipatannya tidak akan pernah selesai memudar.
         ScrollTrigger juga tidak mengerti satuan vh. */
      const satuLayar = () => '+=' + window.innerHeight * 0.75

      if (lipatan.length > 0) {
        gsap.to(lipatan, {
          opacity: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            start: 'top 72%',
            end: satuLayar,
            scrub: 1.1,
          },
        })
      }

      /* Garis margin ditarik ke bawah sepanjang surat. Ini satu-satunya gerak
         yang menemani sepanjang halaman, jadi sengaja pelan dan sunyi:
         yang dibaca teksnya, bukan garisnya. */
      if (margin) {
        gsap.fromTo(
          margin,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: root,
              start: 'top 78%',
              end: 'bottom bottom',
              scrub: 0.6,
            },
          }
        )
      }

      if (kop.length > 0) {
        gsap.to(kop, {
          y: -34,
          opacity: 0.25,
          ease: 'none',
          stagger: 0.08,
          scrollTrigger: {
            trigger: root,
            start: 'top 60%',
            end: satuLayar,
            scrub: 1.1,
          },
        })
      }
    }, root)

    return () => ctx.revert()
  }, [reduced])

  return ref
}
