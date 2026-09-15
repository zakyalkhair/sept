import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './useReducedMotion.js'

const GLYPH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

/* HANYA huruf yang diacak. Angka, tanda baca, dan spasi langsung tampil
   sebagai dirinya sendiri sejak awal.

   Dua alasan. Pertama teknis: `GLYPH` isinya huruf semua, jadi mengacak "2"
   berarti menggantinya dengan huruf — kategorinya salah. Kedua, dan lebih
   penting: **angka yang teracak terbaca sebagai galat**, bukan sebagai
   tulisan yang sedang terbentuk. Prinsip ini sudah dipakai di /penutup
   (angka "21" sengaja dikecualikan dari scramble); sekarang berlaku di
   semua tempat, jadi judul seperti "21 wishes for 21st birthday" aman. */
const bisaDiacak = (c) => /[A-Za-z]/.test(c)

export function useScramble(teks, { jalan = true, durasi = 1900, tickMs = 45 } = {}) {
  const reduced = useReducedMotion()
  const [tampil, setTampil] = useState('')
  const timer = useRef(0)

  useEffect(() => {
    if (!jalan) return

    if (reduced) {
      setTampil(teks)
      return
    }

    const huruf = [...teks]
    /* Waktu mengendap per karakter: mengikuti arah baca, dengan sedikit
       ketidakteraturan supaya tidak terlihat seperti garis lurus. */
    const endap = huruf.map((c, i) => {
      if (!bisaDiacak(c)) return 0
      const dasar = (i / huruf.length) * durasi * 0.72
      const acak = ((i * 2654435761) >>> 0) / 4294967296
      return dasar + acak * durasi * 0.28
    })

    const mulai = performance.now()

    const tick = () => {
      const t = performance.now() - mulai

      setTampil(
        huruf
          .map((c, i) => {
            if (!bisaDiacak(c)) return c
            if (t >= endap[i]) return c
            return GLYPH[(Math.random() * GLYPH.length) | 0]
          })
          .join('')
      )

      if (t < durasi) {
        timer.current = setTimeout(tick, tickMs)
      } else {
        setTampil(teks)
      }
    }

    tick()

    return () => clearTimeout(timer.current)
  }, [teks, jalan, reduced, durasi, tickMs])

  return tampil
}
