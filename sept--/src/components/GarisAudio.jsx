import { useEffect, useRef } from 'react'
import { useMusic } from '../lib/MusicContext.jsx'

const TITIK = 56
const TINGGI = 40

/* Gelombang suara di dalam bar musik.

   Bukan lagi garis rambut gelap melintasi layar — sekarang kurva coral
   dengan isian yang memudar ke bawah. Dua `path` dari data yang sama:
   satu untuk garisnya, satu lagi kurva yang sama tapi ditutup ke dasar
   untuk isiannya. Isian itulah yang membuatnya terbaca sebagai suara,
   bukan sebagai garis pembatas.

   Ukurannya mengikuti wadah (`absolute inset-0`), jadi komponen ini tidak
   tahu-menahu soal posisi bar-nya. */
export default function GarisAudio() {
  const { main, mute, analyserRef } = useMusic()
  const svgRef = useRef(null)
  const garisRef = useRef(null)
  const isiRef = useRef(null)
  const rafRef = useRef(0)

  const tampil = main && !mute

  useEffect(() => {
    if (!tampil) return

    const analyser = analyserRef.current
    const svg = svgRef.current
    const garis = garisRef.current
    const isi = isiRef.current
    if (!svg || !garis || !isi) return

    /* Analyser bisa gagal dipasang (browser menolak Web Audio). Kasus itu
       TIDAK boleh jatuh ke "gambar garis lurus" — garis lurus melintasi
       layar bukan visualisasi, cuma coretan. Disembunyikan lewat DOM
       langsung, bukan `setState`, supaya tidak memicu render tambahan. */
    if (!analyser) {
      svg.style.display = 'none'
      return
    }
    svg.style.display = ''

    const buf = new Uint8Array(analyser.frequencyBinCount)
    const halus = new Float32Array(TITIK)

    const gambar = () => {
      analyser.getByteFrequencyData(buf)

      let d = ''
      const per = Math.floor(buf.length / TITIK)

      for (let i = 0; i < TITIK; i++) {
        let jml = 0
        for (let j = 0; j < per; j++) jml += buf[i * per + j]
        const rata = jml / per / 255

        /* Redam ujung kiri-kanan supaya gelombang menyatu dengan tepi bar,
           tidak terpotong tegak lurus. */
        const tepi = Math.sin((i / (TITIK - 1)) * Math.PI)
        halus[i] += (rata * tepi - halus[i]) * 0.25

        const x = (i / (TITIK - 1)) * 1000
        const y = TINGGI - halus[i] * TINGGI * 0.86
        d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `
      }

      garis.setAttribute('d', d)
      /* Kurva yang sama, ditutup ke dasar — itu saja bedanya. */
      isi.setAttribute('d', `${d} L 1000 ${TINGGI} L 0 ${TINGGI} Z`)

      rafRef.current = requestAnimationFrame(gambar)
    }

    rafRef.current = requestAnimationFrame(gambar)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tampil, analyserRef])

  if (!tampil) return null

  return (
    <svg
      ref={svgRef}
      aria-hidden
      viewBox={`0 0 1000 ${TINGGI}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        <linearGradient id="garis-audio-isi" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-coral)" stopOpacity="0.34" />
          <stop offset="100%" stopColor="var(--color-coral)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path ref={isiRef} d="" fill="url(#garis-audio-isi)" />
      <path
        ref={garisRef}
        d=""
        fill="none"
        stroke="var(--color-coral)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        /* Tanpa ini, `preserveAspectRatio="none"` ikut meregangkan tebal
           garisnya — jadi tipis di layar lebar, tebal di layar sempit. */
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
