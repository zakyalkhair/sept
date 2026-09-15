import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react'
import { usePointerFine } from '../hooks/usePointerFine.js'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

/* Posisi: sangat responsif, lag tipis saja. Regangan: lebih kenyal. */
const POS = { stiffness: 1100, damping: 44, mass: 0.35 }
const KENYAL = { stiffness: 320, damping: 20, mass: 0.5 }
const MATA = { stiffness: 220, damping: 18, mass: 0.4 }
const POP = { type: 'spring', stiffness: 480, damping: 28 }

/* Regangan maksimum. Lebih dari ini bolanya jadi garis, bukan agar-agar. */
const REGANG_MAKS = 0.42

/* Simpangan maksimum manik mata dari tengah (px). */
const BIJI_MAKS = 2.1

/* Kursor kustom kontekstual — hanya di pointer:fine, mati di reduced-motion.
   Dipasang sekali di Layout, jadi tidak ikut mati/hidup tiap ganti route.

   Bentuk default: bola agar-agar. Yang bikin lucu bukan bolanya, tapi tiga
   hal kecil di sekelilingnya —
     1. memanjang searah gerak & memipih tegak lurus (squash-stretch),
     2. menciut saat tombol ditekan lalu memantul balik,
     3. satu kilat krem di kiri-atas supaya terbaca mengilap, bukan datar.

   Urutan penentuan mode (di `elementFromPoint`, 1×/frame):
     1. `[data-kursor]` eksplisit  → "judul" = kaca pembesar
     2. `a` / `button` mana pun    → label stiker, teksnya dari
                                     `data-kursor-teks` (default "klik!")
     3. selain itu                 → bola (atau titik tinta di /penutup)

   `/penutup` dapat bentuk default yang lebih RINGAN — titik tinta polos,
   bukan makhluk bermata. Bukan cuma soal selera: makhluknya menghitung
   sudut/regangan/lirikan mata tiap `pointermove` DAN menjalankan animasi
   CSS berkedip tanpa henti. Di halaman yang sudah menumpuk `LatarLebur`
   (5 lapis wash warna) + transisi lipat/konfeti dari /surat, itu satu lapis
   kerja lagi yang tidak perlu — titik tinta cukup posisi + tekan-lepas. */
export default function KursorKustom() {
  const fine = usePointerFine()
  const reduced = useReducedMotion()
  const aktif = fine && !reduced
  const { pathname } = useLocation()
  const ringan = pathname.startsWith('/penutup')

  const [mode, setMode] = useState('default')
  const [teks, setTeks] = useState('klik!')
  const [tampil, setTampil] = useState(false)
  const [ditekan, setDitekan] = useState(false)
  const diamRef = useRef(0)
  const tampilRef = useRef(false)

  /* Dibaca di dalam listener; disimpan di ref supaya listener tidak perlu
     dipasang ulang tiap pindah halaman (pola sama dengan `varianRef` di
     versi kertas/ceri sebelumnya). */
  const ringanRef = useRef(ringan)
  useEffect(() => {
    ringanRef.current = ringan
  }, [ringan])

  const mx = useMotionValue(-100)
  const my = useMotionValue(-100)
  const x = useSpring(mx, POS)
  const y = useSpring(my, POS)

  /* Sudut diset langsung (tanpa spring): pada bola, arah putarnya tak
     terlihat, dan spring pada sudut malah berputar saat melewati ±180°. */
  const sudut = useMotionValue(0)
  const regangMentah = useMotionValue(0)
  const regang = useSpring(regangMentah, KENYAL)
  const tekanMentah = useMotionValue(1)
  const tekan = useSpring(tekanMentah, KENYAL)

  /* Memanjang searah gerak, memipih tegak lurus — volume terasa tetap. */
  const scaleX = useTransform(regang, (r) => 1 + r)
  const scaleY = useTransform(regang, (r) => 1 - r * 0.72)

  /* Manik mata melirik ke arah gerak. Springnya lebih lambat dari badan
     supaya matanya terbaca "menyusul melihat", bukan menempel kaku. */
  const bijiX = useSpring(0, MATA)
  const bijiY = useSpring(0, MATA)

  useEffect(() => {
    if (!aktif) return

    const root = document.documentElement
    root.classList.add('kursor-kustom-aktif')

    let px = 0
    let py = 0
    let lx = 0
    let ly = 0
    let waktu = 0
    /* Sudut diakumulasi, bukan diset mentah: tanpa ini, gerak yang
       melewati ±180° membuat bolanya berputar setengah lingkaran. */
    let akum = 0

    const onMove = (e) => {
      px = e.clientX
      py = e.clientY
      mx.set(px)
      my.set(py)
      /* Lewat ref: `setTampil(true)` mentah memanggil React tiap kali mouse
         bergerak, padahal nilainya hanya berubah sekali. */
      if (!tampilRef.current) {
        tampilRef.current = true
        setTampil(true)
      }

      /* Squash-stretch + lirikan mata dilewati sama sekali di halaman
         ringan (`/penutup`) — bukan cuma tidak dirender, tapi memang tidak
         dihitung. Ini yang membuat "lebih ringan" nyata, bukan kosmetik. */
      if (!ringanRef.current) {
        /* Dibagi selisih waktu supaya rasanya sama di layar 60Hz dan 120Hz. */
        const t = e.timeStamp
        const dt = Math.max(t - waktu, 8)
        if (waktu) {
          const dx = px - lx
          const dy = py - ly
          const laju = Math.hypot(dx, dy) / dt
          regangMentah.set(Math.min(laju * 0.16, REGANG_MAKS))

          /* Di bawah ambang ini arahnya cuma derau — sudut & arah lirikan
             lama dipertahankan supaya matanya tidak berkedut saat mouse
             nyaris diam. */
          if (laju > 0.06) {
            const target = (Math.atan2(dy, dx) * 180) / Math.PI
            akum += (((target - akum) % 360) + 540) % 360 - 180
            sudut.set(akum)

            /* Melirik searah gerak. Jaraknya ikut laju, jadi gerakan pelan
               cuma menggeser sedikit — bukan langsung membelalak. */
            const d = Math.hypot(dx, dy)
            const kuat = Math.min(laju / 0.9, 1) * BIJI_MAKS
            bijiX.set((dx / d) * kuat)
            bijiY.set((dy / d) * kuat)
          }
        }
        waktu = t

        /* Berhenti bergerak → bulat lagi, mata kembali menatap lurus. */
        clearTimeout(diamRef.current)
        diamRef.current = setTimeout(() => {
          regangMentah.set(0)
          bijiX.set(0)
          bijiY.set(0)
        }, 90)
      }
      lx = px
      ly = py
    }

    /* Mode ditentukan dari `pointerover`, BUKAN `elementFromPoint` yang
       di-sampling dari `pointermove`. Versi sampling itu menggerbangi
       pengecekan di belakang jarak minimum + rAF — cepat, tapi ada jeda
       antara pointer benar-benar masuk elemen dan label sempat terpasang.
       Di tumpukan kartu yang rapat, jeda itu kadang cukup untuk membuat
       kursor tetap di bentuk default padahal sudah di atas kartu (nama
       tidak sempat muncul).

       `pointerover` adalah event ASLI browser untuk ini — dia sendiri yang
       melakukan hit-test tepat saat pointer berpindah elemen, tidak perlu
       kita sampling atau beri jarak minimum, dan sekaligus lebih murah:
       cuma terpanggil saat elemen yang dihover benar-benar berganti, bukan
       tiap piksel pointer bergerak. */
    /* Dipakai dua tempat: hit-test normal dari `pointerover`, dan
       hit-test PAKSA setelah drag selesai (lihat `onLepasCapture`
       di bawah) — jadi logikanya satu, bukan disalin dua kali. */
    const aturMode = (el) => {
      const eksplisit = el?.closest?.('[data-kursor]')
      if (eksplisit) {
        setMode(eksplisit.getAttribute('data-kursor'))
        return
      }
      /* aria-disabled, bukan disabled — kartu kosong dimatikan lewat
         ARIA supaya event-nya tetap sampai (lihat Kartu.jsx). */
      const klik = el?.closest?.('a, button, [role="button"]')
      if (klik && klik.getAttribute('aria-disabled') !== 'true') {
        setTeks(klik.getAttribute('data-kursor-teks') || 'klik!')
        setMode('label')
        return
      }
      setMode('default')
    }

    const onOver = (e) => aturMode(e.target)

    /* Selama kartu diseret, Motion memegang pointer capture — dan menurut
       spesifikasi Pointer Events, `pointerover`/`pointerout` MEMANG TIDAK
       dikirim ke elemen mana pun selama capture aktif (bukan bug browser).
       Efeknya: mode kursor nyangkut di label kartu yang sedang diseret,
       dan tidak ada `pointerover` baru sesudahnya yang membetulkannya —
       label itu tertinggal permanen sampai halaman dimuat ulang.

       `lostpointercapture` dipicu TEPAT saat capture dilepas (drag
       selesai), jadi hit-test dipaksa ulang di posisi kursor terakhir. */
    const onLepasCapture = () => {
      aturMode(document.elementFromPoint(lx, ly))
    }

    const onLeave = () => {
      tampilRef.current = false
      setTampil(false)
    }
    /* setState di sini aman — sekali per klik, bukan per frame. */
    const onTekan = () => {
      tekanMentah.set(0.68)
      setDitekan(true)
    }
    const onLepas = () => {
      tekanMentah.set(1)
      setDitekan(false)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    window.addEventListener('pointerdown', onTekan, { passive: true })
    window.addEventListener('pointerup', onLepas, { passive: true })
    window.addEventListener('lostpointercapture', onLepasCapture, { passive: true })
    document.addEventListener('pointerleave', onLeave)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
      window.removeEventListener('pointerdown', onTekan)
      window.removeEventListener('pointerup', onLepas)
      window.removeEventListener('lostpointercapture', onLepasCapture)
      document.removeEventListener('pointerleave', onLeave)
      clearTimeout(diamRef.current)
      root.classList.remove('kursor-kustom-aktif')
    }
    /* `ringan` sengaja TIDAK di daftar dependensi — dibaca lewat
       `ringanRef` supaya listener tidak dipasang ulang tiap pindah
       halaman (lihat komentar `ringanRef` di atas). */
  }, [aktif, mx, my, regangMentah, sudut, tekanMentah, bijiX, bijiY])

  if (!aktif) return null

  return (
    <motion.div
      aria-hidden
      style={{ x, y }}
      /* z tertinggi di seluruh aplikasi, dan itu wajib: kursor asli sedang
         disembunyikan (`cursor: none`), jadi begitu bentuk ini tertutup
         sesuatu, pengguna kehilangan penunjuk sama sekali. */
      className="pointer-events-none fixed left-0 top-0 z-[999]"
      animate={{ opacity: tampil ? 1 : 0 }}
      transition={{ duration: 0.18 }}
    >
      {/* Panggung tidak lagi ikut berputar — sudut arah-gerak dipasang di
          BADAN saja, supaya matanya tetap tegak saat badannya meregang
          miring. Persis cara squash-stretch kartun: badan berubah bentuk,
          wajahnya tidak ikut terbalik. */}
      <div className="kursor-panggung">
        {/* Tanpa mode="wait": bentuk lama & baru menumpuk sesaat di titik
            yang sama, jadi pergantiannya terasa membalik, bukan menunggu. */}
        <AnimatePresence initial={false}>
          {mode === 'label' ? (
            <motion.span
              key="label"
              className="kursor-label italic-accent"
              initial={{ opacity: 0, scale: 0.6, rotateY: -70, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0, rotate: -4 }}
              exit={{ opacity: 0, scale: 0.7, rotateY: 60 }}
              transition={{ type: 'spring', stiffness: 460, damping: 26 }}
            >
              {teks}
            </motion.span>
          ) : mode === 'judul' ? (
            <motion.span
              key="kaca"
              className="kursor-kaca"
              /* Inline: Lightning CSS membuang backdrop-filter tak-berprefix. */
              style={{
                backdropFilter: 'blur(2.5px)',
                WebkitBackdropFilter: 'blur(2.5px)',
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={POP}
            />
          ) : ringan ? (
            /* Titik tinta — bentuk default /penutup. Tanpa squash-stretch,
               tanpa mata, tanpa animasi berulang. Warnanya tinta gelap: di
               atas kartu krem halaman ini, itu yang paling terbaca.

               Dua lapis seperti makhluk: luar untuk masuk/keluar
               (AnimatePresence), dalam untuk tekan-lepas — dua motion value
               `scale` pada elemen yang SAMA saling menimpa, bukan digabung. */
            <motion.span
              key="titik"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={POP}
            >
              <motion.span className="kursor-titik" style={{ scale: tekan }} />
            </motion.span>
          ) : (
            <motion.span
              key="makhluk"
              className="kursor-makhluk"
              data-pejam={ditekan ? '' : undefined}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={POP}
            >
              {/* Badan: berputar ke arah gerak + meregang + menciut saat
                  ditekan. Semua transform yang "fisik" ada di sini. */}
              <motion.span
                className="makhluk-badan"
                style={{ rotate: sudut, scaleX, scaleY, scale: tekan }}
              />

              {/* Wajah: SATU lapis di luar badan, jadi tidak ikut berputar
                  atau memipih. Manik matanya yang bergerak. */}
              <span className="makhluk-wajah">
                <span className="makhluk-mata">
                  <motion.span className="makhluk-biji" style={{ x: bijiX, y: bijiY }} />
                </span>
                <span className="makhluk-mata">
                  <motion.span className="makhluk-biji" style={{ x: bijiX, y: bijiY }} />
                </span>
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
