import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'
import { messages } from '../data/messages.js'
import { bgClass } from '../lib/colors.js'
import { selOf, masukOf, KOLOM, BARIS } from '../lib/formasi.js'
import { EASE, DUR } from '../lib/motion.js'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { usePointerFine } from '../hooks/usePointerFine.js'
import { useFormasiTilt } from '../hooks/useFormasiTilt.js'

/* Stagger mengecil: jeda antar kartu makin rapat.
   21 x 80ms linier = 1,7 detik dan terasa lamban.
   Kurva kuadrat selesai dalam ~0,95 detik tapi tetap terbaca satu per satu. */
const jeda = (n, total = 0.95) => total * Math.pow(n / 20, 2)

/* Senggol kursor: dorong kartu menjauh dari kursor, spring balik. */
const NUDGE_SPRING = { stiffness: 250, damping: 20, mass: 0.5 }
const NUDGE_R = 110
const NUDGE_MAKS = 22

function KartuFormasi({ i, m, col, row, awal, n, terakhir, reduced, sudah, senggol, daftar, onLastLanded }) {
  const nx = useMotionValue(0)
  const ny = useMotionValue(0)
  const sx = useSpring(nx, NUDGE_SPRING)
  const sy = useSpring(ny, NUDGE_SPRING)

  const setRef = useCallback(
    (el) => { daftar(i, el ? { nx, ny, el } : null) },
    [i, nx, ny, daftar]
  )

  return (
    <motion.span
      ref={setRef}
      className="block h-full w-full"
      style={{
        gridColumn: col,
        gridRow: row,
        ...(senggol ? { x: sx, y: sy } : null),
      }}
    >
      <motion.span
        initial={
          reduced
            ? false
            : { x: awal.x, y: awal.y, rotate: awal.rot, opacity: 0 }
        }
        animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
        transition={{
          duration: DUR.page,
          ease: EASE.in,
          delay: reduced ? 0 : jeda(n),
        }}
        onAnimationComplete={() => { if (terakhir) onLastLanded() }}
        className={[
          'block h-full w-full rounded-[0.3rem]',
          bgClass(m.warna),
          sudah ? 'saturate-[0.5] opacity-75' : '',
        ].join(' ')}
      />
    </motion.span>
  )
}

export default function Formasi21({ varian = 'masuk', dibuka, onSelesai, hidup = false, senggol = false }) {
  const reduced = useReducedMotion()
  const fine = usePointerFine()
  const sudahLapor = useRef(false)
  const [nafas, setNafas] = useState(false)
  const [rakitSelesai, setRakitSelesai] = useState(false)

  const { ref: tiltRef, rotateX, rotateY } = useFormasiTilt(hidup && nafas)

  const senggolOn = senggol && fine && !reduced
  const nudgesRef = useRef([])
  const gridRef = useRef(null)

  const daftar = useCallback((i, entry) => {
    nudgesRef.current[i] = entry
  }, [])

  /* Ref, bukan state. Fungsi yang dioper ke setState WAJIB murni — React
     StrictMode memanggilnya dua kali di development, jadi onSelesai() di
     dalam updater akan terpanggil dua kali dan scramble restart. */
  const lapor = useCallback(() => {
    if (sudahLapor.current) return
    sudahLapor.current = true
    onSelesai?.()
  }, [onSelesai])

  useEffect(() => {
    if (reduced) lapor()
  }, [reduced, lapor])

  useEffect(() => {
    const grid = gridRef.current
    if (!grid || !senggolOn || !rakitSelesai) return

    const nudges = nudgesRef.current
    let raf = 0
    let px = -9999
    let py = -9999
    let pusat = []

    const ukur = () => {
      pusat = nudges.map((it) => {
        if (!it?.el) return null
        const r = it.el.getBoundingClientRect()
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      })
    }

    const terap = () => {
      raf = 0
      for (let i = 0; i < nudges.length; i++) {
        const it = nudges[i]
        const c = pusat[i]
        if (!it || !c) continue
        const dx = c.x - px
        const dy = c.y - py
        const d = Math.hypot(dx, dy)
        if (d < NUDGE_R && d > 0.01) {
          const f = (1 - d / NUDGE_R) * NUDGE_MAKS
          it.nx.set((dx / d) * f)
          it.ny.set((dy / d) * f)
        } else {
          it.nx.set(0)
          it.ny.set(0)
        }
      }
    }

    const jadwal = () => { if (!raf) raf = requestAnimationFrame(terap) }
    const onMove = (e) => { px = e.clientX; py = e.clientY; jadwal() }
    const onLeave = () => { px = -9999; py = -9999; jadwal() }

    ukur()
    const ro = new ResizeObserver(ukur)
    ro.observe(grid)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)

    return () => {
      ro.disconnect()
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
      nudges.forEach((it) => { it?.nx.set(0); it?.ny.set(0) })
    }
  }, [senggolOn, rakitSelesai])

  const nafasHidup = hidup && nafas && !reduced

  return (
    <motion.div
      ref={tiltRef}
      className="mx-auto w-[min(78vw,44rem)]"
      style={{ rotateX, rotateY, transformPerspective: 900 }}
    >
      <motion.div
        ref={gridRef}
        aria-hidden
        className="pointer-events-none relative grid aspect-[8/7] gap-[0.6%]"
        style={{
          gridTemplateColumns: `repeat(${KOLOM}, 1fr)`,
          gridTemplateRows: `repeat(${BARIS}, 1fr)`,
        }}
        animate={nafasHidup ? { scale: [1, 1.014, 1] } : { scale: 1 }}
        transition={
          nafasHidup
            ? { duration: 6.5, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0 }
        }
      >
        {messages.map((m, i) => {
          const { col, row } = selOf(i)
          const n = varian === 'pulang' ? 20 - i : i
          return (
            <KartuFormasi
              key={m.id}
              i={i}
              m={m}
              col={col}
              row={row}
              awal={masukOf(i)}
              n={n}
              terakhir={n === 20}
              reduced={reduced}
              sudah={dibuka?.has(m.id)}
              senggol={senggolOn}
              daftar={daftar}
              onLastLanded={() => {
                lapor()
                setRakitSelesai(true)
                if (hidup && !reduced) setNafas(true)
              }}
            />
          )
        })}
      </motion.div>
    </motion.div>
  )
}
