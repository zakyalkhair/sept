import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from './useReducedMotion.js'

gsap.registerPlugin(ScrollTrigger)

/* Surat menghitam KATA DEMI KATA saat discroll.

   Versi pertama memakai `background-clip: text` + `background-size` yang
   di-scrub dari 0% ke 100%: satu pita tegak menyapu seluruh paragraf dari
   kiri ke kanan. Mesinnya rapi, tapi salah satuan — mata membaca per kata,
   bukan per pita, jadi hasilnya terbaca seperti PROGRESS BAR yang melintasi
   teks, bukan seperti sedang dibaca. Efek sampingnya ikut hilang: bug
   repaint `-webkit-background-clip: text` di Safari tidak lagi relevan.

   Sekarang tiap kata elemennya sendiri (`.surat-kata`, dipecah di JSX bukan
   di DOM) dan yang dianimasikan cuma `opacity`.

   SATU ScrollTrigger PER PARAGRAF, bukan per kata. Satu tween ber-stagger
   menggerakkan seluruh kata di paragraf itu; 4 trigger, bukan ±100. */
export function useTextScrub() {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const root = ref.current
    if (!root) return

    const paras = root.querySelectorAll('[data-scrub-teks]')

    if (reduced) {
      root.querySelectorAll('.surat-kata').forEach((k) => {
        k.style.opacity = '1'
      })
      return
    }

    const ctx = gsap.context(() => {
      paras.forEach((p) => {
        const kata = p.querySelectorAll('.surat-kata')
        if (kata.length === 0) return

        gsap.to(kata, {
          opacity: 1,
          ease: 'none',
          duration: 0.3,
          /* `amount`, bukan `each`: total jeda dibagi rata berapa pun jumlah
             katanya, jadi paragraf panjang dan pendek selesai dalam rentang
             scroll yang sama. Dengan `each`, paragraf panjang akan jauh
             tertinggal. */
          stagger: { amount: 1 },
          scrollTrigger: {
            trigger: p,
            start: 'top 82%',
            end: 'bottom 58%',
            scrub: 1.1,
          },
        })
      })
    }, root)

    return () => ctx.revert()
  }, [reduced])

  return ref
}
