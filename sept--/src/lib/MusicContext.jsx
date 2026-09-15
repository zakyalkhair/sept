import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { musik } from '../data/musik.js'

const MusicContext = createContext(null)

const VOL_NORMAL = 0.55
const VOL_DUCK = 0.12
const FADE_MS = 450

export function MusicProvider({ children }) {
  const audioRef = useRef(null)
  const fadeRef = useRef(0)

  const analyserRef = useRef(null)
  const ctxRef = useRef(null)
  const sourceRef = useRef(null)

  const [main, setMain] = useState(false)
  const [mute, setMute] = useState(false)
  const [siap, setSiap] = useState(false)

  /* Daftar putar. SATU elemen `<audio>` yang `src`-nya diganti, bukan tiga
     elemen — `createMediaElementSource` cuma boleh dipanggil sekali per
     elemen, jadi analyser (garis gelombang di dasar layar) akan mati kalau
     elemennya berganti-ganti. Mengganti `src` pada elemen yang sama aman:
     analyser-nya tetap terpasang. */
  const [lagu, setLagu] = useState(0)
  const laguRef = useRef(0)
  const gantiRef = useRef(0)
  const gagalRef = useRef(0)
  /* `gantiLagu` dipakai oleh `onGagalMuat` yang dideklarasikan lebih dulu;
     lewat ref supaya tidak perlu menyusun ulang urutan atau membuat
     ketergantungan melingkar di antara keduanya. */
  const gantiLaguRef = useRef(null)

  /* Fade volume dengan rAF. Tidak pakai transition CSS —
     volume bukan properti CSS. */
  const fadeKe = useCallback((target) => {
    const el = audioRef.current
    if (!el) return

    cancelAnimationFrame(fadeRef.current)

    const awal = el.volume
    const mulai = performance.now()

    const step = (t) => {
      const p = Math.min(1, (t - mulai) / FADE_MS)
      const e = 1 - Math.pow(1 - p, 3)
      el.volume = awal + (target - awal) * e
      if (p < 1) fadeRef.current = requestAnimationFrame(step)
    }

    fadeRef.current = requestAnimationFrame(step)
  }, [])

  /* Web Audio: dipasang sekali, di dalam gestur pengguna (lewat nyalakan).
     createMediaElementSource hanya boleh dipanggil sekali per elemen. */
  const pasangAnalyser = useCallback(() => {
    const el = audioRef.current
    if (!el || sourceRef.current) return      // sudah dipasang — jangan ulangi

    try {
      const AC = window.AudioContext || window.webkitAudioContext
      const ctx = new AC()
      const source = ctx.createMediaElementSource(el)
      const analyser = ctx.createAnalyser()

      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.82

      source.connect(analyser)
      analyser.connect(ctx.destination)       // WAJIB — tanpa ini tidak ada bunyi

      ctxRef.current = ctx
      sourceRef.current = source
      analyserRef.current = analyser
    } catch {
      /* Browser menolak. Garis jatuh ke mode datar — lagunya tetap jalan. */
      analyserRef.current = null
    }
  }, [])

  /* Menyalakan musik, MENCOBA BERURUTAN sampai ada lagu yang benar-benar
     bisa diputar.

     Bukan kemewahan — ini menutup mode gagal yang sudah pernah terjadi:
     lagu pertama di daftar belum ada berkasnya (404), `play()` ditolak,
     `main` tidak pernah jadi `true`, dan akibatnya SELURUH lapisan musik
     tidak muncul: tombol mute hilang, garis gelombang hilang, chip judul
     hilang. Dari layar itu terbaca seperti fiturnya tidak ada sama sekali,
     padahal cuma satu berkas yang kurang.

     Sekarang lagu yang gagal dilewati, dan yang lain tetap main. */
  const nyalakan = useCallback(async () => {
    const el = audioRef.current
    if (!el) return false
    pasangAnalyser()
    if (ctxRef.current?.state === 'suspended') await ctxRef.current.resume()

    for (let coba = 0; coba < musik.length; coba++) {
      try {
        el.volume = 0
        await el.play()
        setMain(true)
        fadeKe(VOL_NORMAL)
        return true
      } catch {
        /* Bisa dua sebab: berkasnya tidak ada, atau browser memblokir.
           Keduanya ditangani sama — coba lagu berikutnya. Kalau memang
           diblokir, semuanya akan gagal dan situs tetap jalan tanpa musik. */
        const berikut = (laguRef.current + 1) % musik.length
        laguRef.current = berikut
        setLagu(berikut)
        /* `el.src` diset LANGSUNG, tidak menunggu React me-render ulang —
           di dalam loop `await` ini, render berikutnya belum terjadi. */
        el.src = musik[berikut].berkas
      }
    }
    return false
  }, [fadeKe, pasangAnalyser])

  /* Berkas rusak/hilang saat sedang berjalan → lompat ke lagu berikutnya.
     `gagalRef` mencegah putaran tak berujung kalau SEMUA berkas bermasalah;
     dinolkan lagi setiap ada lagu yang berhasil berbunyi. */
  const onGagalMuat = useCallback(() => {
    gagalRef.current += 1
    if (gagalRef.current >= musik.length) return
    gantiLaguRef.current?.(1, false)
  }, [])

  /* Pindah lagu. `arah` +1 / -1; membungkus di ujung daftar.

     Diredam dulu baru diganti — mengganti `src` saat volume masih penuh
     terdengar sebagai potongan mendadak. `onEnded` melewati peredaman ini
     (lagunya memang sudah habis, tidak ada yang perlu diredam). */
  const gantiLagu = useCallback(
    (arah = 1, redam = true) => {
      clearTimeout(gantiRef.current)
      const pindah = () =>
        setLagu((i) => (i + arah + musik.length) % musik.length)

      if (redam && main) {
        fadeKe(0)
        gantiRef.current = setTimeout(pindah, FADE_MS)
      } else {
        pindah()
      }
    },
    [fadeKe, main]
  )

  useEffect(() => {
    gantiLaguRef.current = gantiLagu
  }, [gantiLagu])

  /* Mulai memutar lagu BARU setelah `src`-nya berganti.

     Dijaga `laguRef` supaya efek ini tidak ikut menyala saat mount pertama
     maupun saat `main` berubah — `nyalakan()` sudah mengurus start pertama,
     dan menjalankan keduanya membuat volumenya di-fade dua kali. */
  useEffect(() => {
    if (laguRef.current === lagu) return
    laguRef.current = lagu

    const el = audioRef.current
    if (!el || !main) return
    el.volume = 0
    el.play().catch(() => {})
    fadeKe(VOL_NORMAL)
  }, [lagu, main, fadeKe])

  const toggleMute = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    const baru = !mute
    setMute(baru)
    el.muted = baru
  }, [mute])

  /* Dipanggil pemutar video: kecilkan saat video main, kembalikan setelah. */
  const duck = useCallback((aktif) => {
    if (!main) return
    fadeKe(aktif ? VOL_DUCK : VOL_NORMAL)
  }, [main, fadeKe])

  useEffect(() => () => cancelAnimationFrame(fadeRef.current), [])
  useEffect(() => () => { ctxRef.current?.close() }, [])
  useEffect(() => () => clearTimeout(gantiRef.current), [])

  return (
    <MusicContext.Provider
      value={{
        main,
        mute,
        siap,
        nyalakan,
        toggleMute,
        duck,
        audioRef,
        analyserRef,
        lagu: musik[lagu],
        gantiLagu,
      }}
    >
      {/* TANPA `loop`. Perulangannya ada di daftar putar (`onEnded` →
          lagu berikutnya, membungkus di ujung); `loop` di sini akan membuat
          lagu pertama mengulang selamanya dan dua lagu lain tidak pernah
          kebagian. */}
      <audio
        ref={audioRef}
        src={musik[lagu].berkas}
        preload="auto"
        onCanPlayThrough={() => {
          setSiap(true)
          gagalRef.current = 0
        }}
        onError={onGagalMuat}
        onEnded={() => gantiLagu(1, false)}
      />
      {children}
    </MusicContext.Provider>
  )
}

export const useMusic = () => {
  const c = useContext(MusicContext)
  if (!c) throw new Error('useMusic harus di dalam MusicProvider')
  return c
}
