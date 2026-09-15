import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { navPanel } from '../data/navPanel.js'
import { bgHex, onHex } from '../lib/colors.js'
import { EASE } from '../lib/motion.js'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

/* Navigasi akhir /pesan — satu amplop.
   Hover  → tutup membuka, kertas mengintip.
   Klik   → kertas meluncur keluar, sekitarnya meredup, lalu kertas itu
            MELEBAR memenuhi layar (bahasa yang sama dengan lingkaran coral
            di transisi / → /pesan) sebelum pindah ke /surat. */
const PANEL = navPanel.find((p) => p.id === 'surat')

export default function Tumpukan() {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const [aktif, setAktif] = useState(false)
  const [muai, setMuai] = useState(null)
  const kertasRef = useRef(null)
  const t1 = useRef(0)
  const t2 = useRef(0)

  useEffect(
    () => () => {
      clearTimeout(t1.current)
      clearTimeout(t2.current)
    },
    []
  )

  const hex = bgHex(PANEL.warna)

  const bukaSurat = () => {
    if (aktif) return
    if (reduced) {
      navigate(PANEL.ke)
      return
    }

    setAktif(true)

    /* setelah kertas selesai meluncur keluar, ukur posisinya lalu muai */
    t1.current = setTimeout(() => {
      const el = kertasRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setMuai({
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
        dx: window.innerWidth / 2 - (r.left + r.width / 2),
        dy: window.innerHeight / 2 - (r.top + r.height / 2),
        s: Math.max(window.innerWidth / r.width, window.innerHeight / r.height) * 1.1,
      })
    }, 700)

    t2.current = setTimeout(() => navigate(PANEL.ke), 1360)
  }

  return (
    <section className="mt-[28vh] grid min-h-dvh place-items-center px-6 py-28">
      <div className="flex flex-col items-center gap-9">
        <button
          type="button"
          onClick={bukaSurat}
          data-buka={aktif ? '' : undefined}
          aria-label={`${PANEL.label} — ${PANEL.cta}`}
          data-kursor-teks="baca!"
          className="amplop"
          style={{
            '--amplop': hex,
            '--amplop-terang': `color-mix(in oklab, ${hex} 88%, #FFFFFF)`,
            '--amplop-tutup': `color-mix(in oklab, ${hex} 95%, #2E2A26)`,
            '--amplop-dalam': `color-mix(in oklab, ${hex} 82%, #2E2A26)`,
            color: onHex(PANEL.warna),
            zIndex: aktif ? 95 : undefined,
          }}
        >
          <span aria-hidden className="amplop-belakang" />

          <span aria-hidden ref={kertasRef} className="amplop-kertas">
            {[86, 72, 80, 58].map((w, i) => (
              <span key={i} className="amplop-baris" style={{ width: `${w}%` }} />
            ))}
            <span className="kertas-kilau" />
          </span>

          <span aria-hidden className="amplop-depan" />

          {/* Tutup digambar SVG, bukan clip-path segitiga — bahunya
              membulat dan ujungnya tumpul, jadi tidak kaku. */}
          <span aria-hidden className="amplop-tutup">
            <svg viewBox="0 0 100 32.5" preserveAspectRatio="none">
              <path
                className="tutup-muka"
                d="M0 0 H100 V3.6 Q100 6.4 97.4 8.4 L53.6 30.5 Q50 32.4 46.4 30.5 L2.6 8.4 Q0 6.4 0 3.6 Z"
              />
              {/* Bayangan lipatan: warnanya TIDAK ditukar (itu bikin lompatan
                  di 90°). Yang berubah cuma opacity, mengalir sepanjang
                  putaran — jadi terbaca sebagai sisi yang meredup, bukan
                  ganti warna mendadak. */}
              <path
                className="tutup-bayang"
                d="M0 0 H100 V3.6 Q100 6.4 97.4 8.4 L53.6 30.5 Q50 32.4 46.4 30.5 L2.6 8.4 Q0 6.4 0 3.6 Z"
              />
            </svg>
            <span className="amplop-lak" />
          </span>
        </button>

        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="h-display text-[clamp(2rem,6vw,3.2rem)] leading-tight">
            {PANEL.label}
          </h2>
          <p className="italic-accent text-lg text-muted">{PANEL.sub}</p>
        </div>
      </div>

      <AnimatePresence>
        {aktif && (
          <motion.div
            key="redup"
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[90] bg-ink"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            transition={{ duration: 0.5, ease: EASE.in }}
          />
        )}

        {muai && (
          <motion.div
            key="muai"
            aria-hidden
            className="pointer-events-none fixed z-[97] bg-bg"
            style={{
              left: muai.left,
              top: muai.top,
              width: muai.width,
              height: muai.height,
              borderRadius: '0.3rem',
            }}
            initial={{ x: 0, y: 0, scale: 1 }}
            animate={{ x: muai.dx, y: muai.dy, scale: muai.s }}
            transition={{ duration: 0.8, ease: EASE.in }}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
