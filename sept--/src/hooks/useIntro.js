import { useEffect } from 'react'

/* Lagu pembuka halaman depan. Tanpa kontrol apa pun: menyala sendiri,
   berhenti sendiri begitu halaman ini ditinggalkan (tombol "masuk"),
   lalu daftar putar utama yang mengambil alih.

   Browser MELARANG audio berbunyi sebelum ada sentuhan — `play()` yang
   ditolak bukan error, itu perilaku normal. Karena itu kalau ditolak,
   sentuhan/ketikan/scroll PERTAMA di halaman dipakai sebagai pemicu. */
const BERKAS = '/musik/Intro.mp3'
const VOLUME = 0.55
const REDUP_MS = 600

export function useIntro() {
  useEffect(() => {
    const el = new Audio(BERKAS)
    el.loop = true
    el.volume = VOLUME
    el.preload = 'auto'

    const peristiwa = ['pointerdown', 'keydown', 'touchstart', 'wheel']
    const coba = () => el.play().then(lepas).catch(() => {})
    const lepas = () => peristiwa.forEach((p) => window.removeEventListener(p, coba))

    coba()
    peristiwa.forEach((p) => window.addEventListener(p, coba, { passive: true }))

    return () => {
      lepas()
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
}
