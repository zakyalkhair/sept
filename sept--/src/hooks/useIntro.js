import { useCallback, useEffect, useRef } from 'react'

/* Lagu pembuka halaman depan. Tanpa kontrol apa pun: dinyalakan oleh
   `mulai()` (dipanggil saat kotak kado diklik), berhenti sendiri begitu
   halaman ini ditinggalkan (tombol "masuk"), lalu daftar putar utama
   yang mengambil alih.

   Browser MELARANG audio berbunyi sebelum ada sentuhan — karena itu
   `mulai()` HARUS dipanggil langsung di dalam handler klik. */
const BERKAS = '/musik/Intro.mp3'
const VOLUME = 0.55
const REDUP_MS = 600

export function useIntro() {
  const ref = useRef(null)

  useEffect(() => {
    const el = new Audio(BERKAS)
    el.loop = true
    el.volume = VOLUME
    el.preload = 'auto'
    ref.current = el

    return () => {
      ref.current = null
      /* Diredupkan dulu, bukan dipotong: lagu daftar putar menyala di
         detik yang sama, dan dua lagu yang bertabrakan keras terdengar
         seperti bug. */
      const awal = el.volume
      const t = setInterval(() => {
        el.volume = Math.max(0, el.volume - awal / (REDUP_MS / 50))
        if (el.volume === 0) {
          clearInterval(t)
          el.pause()
          el.src = ''
        }
      }, 50)
    }
  }, [])

  return useCallback(() => {
    ref.current?.play().catch(() => {})
  }, [])
}
