import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { bgHex, onHex } from '../lib/colors.js'
import { DUR, EASE, tapPress } from '../lib/motion.js'
import { useMusic } from '../lib/MusicContext.jsx'
import { useKunciScroll } from '../hooks/useKunciScroll.js'
import Tombol from './Tombol.jsx'

export default function Pemutar({ pesan, onTutup, onLanjut, onMundur, onLewati }) {
  const [muaiSelesai, setMuaiSelesai] = useState(false)
  const [berjalan, setBerjalan] = useState(false)
  const videoRef = useRef(null)
  const isiRef = useRef(null)
  const rafRef = useRef(0)
  const sentuhX = useRef(0)
  const { duck } = useMusic()

  useEffect(() => {
    duck(true)
    return () => duck(false)
  }, [duck])

  useKunciScroll()

  /* Layar penuh diminta dari elemen VIDEO-nya, bukan dari overlay: di
     iPhone, Fullscreen API tidak berlaku untuk elemen biasa — hanya
     `webkitEnterFullscreen` milik <video> yang jalan. */
  const layarPenuh = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (document.fullscreenElement) document.exitFullscreen()
    else if (v.requestFullscreen) v.requestFullscreen().catch(() => {})
    else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen()
  }, [])

  const putarJeda = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play()
    else v.pause()
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onTutup()
      if (e.key === 'ArrowRight') onLanjut()
      if (e.key === 'ArrowLeft') onMundur()
      /* Spasi = putar/jeda, kebiasaan universal pemutar video. `preventDefault`
         supaya halaman di belakangnya tidak ikut ter-scroll. */
      if (e.key === ' ') {
        e.preventDefault()
        putarJeda()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onTutup, onLanjut, onMundur, putarJeda])

  /* Progres ditulis LANGSUNG ke DOM lewat rAF, bukan lewat state React.

     Ini pelajaran yang sama dengan scramble (05-pembuka §5.6.5): apa pun
     yang berubah tiap frame tidak boleh lewat `setState`, karena yang
     dibayar bukan efeknya sendiri melainkan seluruh pohon yang ikut
     ter-render. Di sini pohonnya termasuk `<video>` — me-render ulang
     elemen video tiap frame adalah hal terakhir yang kita mau.

     rAF, bukan event `timeupdate`: `timeupdate` cuma menyala ~4×/detik,
     dan garis yang melompat 4 kali sedetik terbaca patah. */
  useEffect(() => {
    if (!berjalan) return

    const jalan = () => {
      const v = videoRef.current
      const isi = isiRef.current
      if (v && isi && v.duration) {
        isi.style.transform = `scaleX(${v.currentTime / v.duration})`
      }
      rafRef.current = requestAnimationFrame(jalan)
    }
    rafRef.current = requestAnimationFrame(jalan)

    return () => cancelAnimationFrame(rafRef.current)
  }, [berjalan])

  /* Klik di garis progres = lompat ke posisi itu. Wajib ada begitu kontrol
     bawaan browser dilepas — tanpa ini video tidak bisa diulang atau
     dilewati sebagiannya sama sekali. */
  const lompat = (e) => {
    const v = videoRef.current
    if (!v || !v.duration) return
    const r = e.currentTarget.getBoundingClientRect()
    const rasio = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1)
    v.currentTime = rasio * v.duration
    if (isiRef.current) isiRef.current.style.transform = `scaleX(${rasio})`
  }

  return (
    <motion.div
      layoutId={`kartu-${pesan.id}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Pesan dari ${pesan.nama}`}
      initial={false}
      animate={{ backgroundColor: bgHex(pesan.warna) }}
      exit={{ opacity: 0, transition: { duration: DUR.exit, ease: EASE.out } }}
      transition={{ duration: DUR.page, ease: EASE.in }}
      onLayoutAnimationComplete={() => setMuaiSelesai(true)}
      onTouchStart={(e) => { sentuhX.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        const d = e.changedTouches[0].clientX - sentuhX.current
        /* Arah geser mengikuti arah deretnya: ke kiri = video berikutnya,
           ke kanan = video sebelumnya. Dulu geser ke kanan menutup pemutar —
           itu menghukum gerakan yang paling wajar dipakai untuk mundur. */
        if (d < -60) onLanjut()
        if (d > 60) onMundur()
      }}
      /* `pb` besar: bar musik (`z-60`) duduk di atas overlay ini supaya
         mute tetap bisa ditekan saat video main — justru saat paling
         dibutuhkan. Tanpa ruang ini, bar itu menutupi "lewati semua" dan
         petunjuk geser di dasar overlay. */
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 overflow-y-auto p-5 pt-8 pb-[7rem] landscape:gap-2 landscape:pt-3 landscape:pb-[4.5rem]"
      style={{ color: onHex(pesan.warna) }}
    >
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={muaiSelesai ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: DUR.enter, ease: EASE.in, delay: 0.05 }}
        className="italic-accent text-[clamp(1.75rem,5vw,3rem)] leading-tight landscape:text-[clamp(1.1rem,3.2vh,1.75rem)]"
      >
        {pesan.nama}
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={muaiSelesai ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: DUR.enter, ease: EASE.in, delay: 0.12 }}
        className="pemutar-bingkai w-full max-w-[min(46rem,92vw,calc((100dvh-19rem)*16/9))] landscape:max-w-[min(46rem,94vw,calc((100dvh-9.5rem)*16/9))]"
      >
        {muaiSelesai && pesan.video && (
          <>
            <video
              ref={videoRef}
              src={pesan.video}
              playsInline
              preload="none"
              autoPlay
              onClick={putarJeda}
              onPlay={() => setBerjalan(true)}
              onPause={() => setBerjalan(false)}
              onEnded={onLanjut}
              className="aspect-video w-full cursor-pointer rounded-xl bg-black/10"
              data-kursor-teks={berjalan ? 'jeda' : 'putar'}
            />

            {/* Tombol putar besar hanya saat jeda. Sengaja TIDAK ada saat
                video berjalan — menutupi wajah orang yang sedang bicara. */}
            <motion.button
              type="button"
              onClick={putarJeda}
              aria-label={berjalan ? 'Jeda' : 'Putar'}
              data-kursor-teks="putar"
              className="pemutar-putar"
              initial={false}
              animate={{ opacity: berjalan ? 0 : 1, scale: berjalan ? 0.8 : 1 }}
              transition={{ duration: 0.22, ease: EASE.out }}
              style={{ pointerEvents: berjalan ? 'none' : 'auto' }}
            >
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M8 5.2 L19 12 L8 18.8 Z" fill="currentColor" />
              </svg>
            </motion.button>

            <button
              type="button"
              onClick={layarPenuh}
              aria-label="Layar penuh"
              data-kursor-teks="layar penuh"
              className="absolute right-3 top-3 rounded-full bg-black/45 p-2 text-white backdrop-blur transition-colors hover:bg-black/65"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
              </svg>
            </button>

            {/* Wadahnya jauh lebih tinggi dari garisnya sendiri — target
                klik yang cuma setinggi 2px praktis mustahil dikenai. */}
            <div
              className="pemutar-progres"
              onClick={lompat}
              role="presentation"
              data-kursor-teks="lompat"
            >
              <span className="pemutar-lintasan">
                <span ref={isiRef} className="pemutar-isi" />
              </span>
            </div>
          </>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={muaiSelesai ? { opacity: 1 } : {}}
        transition={{ duration: DUR.enter, ease: EASE.in, delay: 0.2 }}
        className="flex items-center gap-4"
      >
        {/* Krim SOLID, bukan putih transparan — di atas warna kartu yang
            pekat, putih 32% terbaca sebagai tombol mati (lihat 02-pesan
            §2.7). Warna teksnya sudah gelap otomatis dari `onHex`. */}
        <Tombol
          onClick={onLanjut}
          aria-label="Pesan berikutnya"
          data-kursor-teks="berikutnya"
          className="px-5 font-medium"
          style={{ background: 'var(--color-bg)' }}
        >
          berikutnya
        </Tombol>

        <motion.button
          {...tapPress}
          onClick={onTutup}
          aria-label="Tutup"
          data-kursor-teks="tutup"
          className="tap link-garis text-sm"
        >
          tutup
        </motion.button>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={muaiSelesai ? { opacity: 1 } : {}}
        transition={{ duration: DUR.enter, ease: EASE.in, delay: 0.26 }}
        {...tapPress}
        onClick={onLewati}
        aria-label="Lewati semua video, langsung ke surat"
        className="tap link-garis text-sm opacity-70"
      >
        lewati semua
      </motion.button>

      <p className="text-sm opacity-60 md:hidden">geser ke kiri untuk lanjut</p>
    </motion.div>
  )
}
