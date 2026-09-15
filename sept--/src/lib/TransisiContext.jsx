import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { EASE } from './motion.js'
import { ACCENTS, bgHex } from './colors.js'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

const TransisiContext = createContext(null)

const JUMLAH_KONFETI = 34

/* Serpih konfeti dibuat sekali per klik. Acak beneran (bukan hash
   deterministik seperti sebaran kartu) — ini visual sekali-pakai yang tidak
   pernah perlu sama dua kali, dan justru lebih hidup kalau berbeda terus. */
function buatKonfeti() {
  return Array.from({ length: JUMLAH_KONFETI }, (_, i) => {
    /* Sudut dicondongkan ke ATAS (−160°..−20°). Ledakan yang merata ke
       segala arah terbaca seperti partikel; kertas yang dilempar ke atas
       lalu jatuh terbaca seperti perayaan. */
    const sudut = (-160 + Math.random() * 140) * (Math.PI / 180)
    const jarak = 180 + Math.random() * 420

    return {
      i,
      dx: Math.cos(sudut) * jarak,
      naik: 120 + Math.random() * 240,
      jatuh: window.innerHeight * (0.7 + Math.random() * 0.6),
      putar: (Math.random() < 0.5 ? -1 : 1) * (240 + Math.random() * 620),
      lebar: 7 + Math.random() * 9,
      tinggi: 9 + Math.random() * 7,
      warna: bgHex(ACCENTS[i % ACCENTS.length]),
      lama: 1.6 + Math.random() * 0.6,
      tunda: Math.random() * 0.1,
    }
  })
}

/* Transisi "warna membludak": lingkaran warna coral tumbuh dari satu titik
   (mis. tombol "masuk"), menutup layar, lalu larut mengungkap route baru.
   Ekonya: teknik "kartu melebar jadi halaman" (§2.7). */
export function TransisiProvider({ children }) {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const [bloom, setBloom] = useState(null)
  const [pesta, setPesta] = useState(null)
  const tujuanRef = useRef(null)
  const pindahRef = useRef(false)

  const mulai = useCallback(
    (tujuan, x, y) => {
      if (reduced) {
        navigate(tujuan)
        return
      }
      tujuanRef.current = tujuan
      pindahRef.current = false
      const r = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      )
      setBloom({ x, y, d: r * 2.3 })
    },
    [reduced, navigate]
  )

  /* Transisi kedua: surat → penutup. Konfeti KERTAS (bukan bulatan) yang
     dilempar dari tombolnya, sementara tirai krem naik menutupi pertukaran
     route di belakangnya. Tirainya sewarna latar kedua halaman, jadi
     potongannya tidak terlihat sama sekali. */
  const mulaiPesta = useCallback(
    (tujuan, x, y) => {
      if (reduced) {
        navigate(tujuan)
        return
      }
      tujuanRef.current = tujuan
      pindahRef.current = false
      setPesta({ x, y, serpih: buatKonfeti() })
    },
    [reduced, navigate]
  )

  return (
    <TransisiContext.Provider value={{ mulai, mulaiPesta }}>
      {children}

      <AnimatePresence>
        {bloom && (
          <motion.div
            key="bloom"
            aria-hidden
            className="pointer-events-none fixed z-[100] rounded-full bg-coral"
            style={{
              left: bloom.x,
              top: bloom.y,
              width: bloom.d,
              height: bloom.d,
              x: '-50%',
              y: '-50%',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{
              opacity: [1, 1, 0],
              transition: { duration: 0.9, times: [0, 0.45, 1], ease: EASE.out },
            }}
            transition={{ scale: { duration: 0.5, ease: EASE.in } }}
            onAnimationComplete={() => {
              if (pindahRef.current) return
              pindahRef.current = true
              navigate(tujuanRef.current)
              setBloom(null)
            }}
          />
        )}

        {pesta && (
          /* Pembungkusnya yang keluar, bukan tiap serpih: saat tirai lepas,
             konfetinya masih terbang dan ikut memudar di atas /penutup —
             perayaannya melimpah ke halaman berikutnya, tidak terpotong.

             `exit` MENAHAN opacity penuh dulu (`[1, 1, 0]` dengan `times`),
             persis seperti lingkaran coral di atas. Ini bukan hiasan:
             `AnimatePresence mode="wait"` di App.jsx membuat /surat baru
             memainkan animasi keluarnya SETELAH navigate — 0,48 detik
             (`DUR.page * 0.6`) — dan /penutup baru masuk sesudah itu. Kalau
             tirai ini langsung memudar, suratnya masih terlihat menembusnya.
             Tahanan 0,55 detik menutupi seluruh pergantian itu. */
          <motion.div
            key="pesta"
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[100]"
            exit={{
              opacity: [1, 1, 0],
              transition: { duration: 1.15, times: [0, 0.48, 1], ease: EASE.out },
            }}
          >
            <motion.div
              className="absolute inset-0 bg-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.46, ease: EASE.in }}
              onAnimationComplete={() => {
                if (pindahRef.current) return
                pindahRef.current = true
                navigate(tujuanRef.current)
                setPesta(null)
              }}
            />

            {pesta.serpih.map((s) => (
              <motion.span
                key={s.i}
                className="absolute rounded-[1px]"
                style={{
                  left: pesta.x,
                  top: pesta.y,
                  width: s.lebar,
                  height: s.tinggi,
                  background: s.warna,
                }}
                initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                animate={{
                  x: s.dx,
                  /* Tiga titik: naik dulu, baru jatuh. Satu tarikan lurus
                     ke tujuan akan terbaca sebagai partikel yang ditembak,
                     bukan kertas yang dilempar. */
                  y: [0, -s.naik, s.jatuh],
                  rotate: s.putar,
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: s.lama,
                  delay: s.tunda,
                  x: { ease: 'easeOut' },
                  y: { times: [0, 0.32, 1], ease: ['easeOut', 'easeIn'] },
                  rotate: { ease: 'linear' },
                  opacity: { times: [0, 0.78, 1], ease: 'linear' },
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </TransisiContext.Provider>
  )
}

export const useTransisi = () =>
  useContext(TransisiContext) ?? { mulai: () => {}, mulaiPesta: () => {} }
