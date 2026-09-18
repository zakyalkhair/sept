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

    return () => hentikan(el)
  }, [])

  const mulai = useCallback(() => {
    ref.current?.play().catch(() => {})
  }, [])

  const stop = useCallback(() => hentikan(ref.current), [])

  return { mulai, stop }
}

/* Diredupkan dulu, bukan dipotong: lagu daftar putar menyala di detik
   yang sama. Jumlah langkah DIHITUNG, bukan menunggu volume = 0 —
   di iOS `volume` hanya-baca, volumenya tidak pernah turun, dan dulu
   lagunya jadi tidak pernah berhenti. */
function hentikan(el) {
  if (!el || el.dataset.berhenti) return
  el.dataset.berhenti = '1'
  const langkah = REDUP_MS / 50
  const awal = el.volume
  let n = 0
  const t = setInterval(() => {
    n += 1
    el.volume = Math.max(0, awal * (1 - n / langkah))
    if (n >= langkah) {
      clearInterval(t)
      el.pause()
      el.src = ''
    }
  }, 50)
}
