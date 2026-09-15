import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { bgHex, onHex } from '../lib/colors.js'
import { KARTU_REKAM, UPLOAD_PRESET, urlFoto } from '../data/video.js'
import { segarkanVideo } from '../data/messages.js'
import { DUR, EASE, tapPress } from '../lib/motion.js'
import { useKunciScroll } from '../hooks/useKunciScroll.js'
import Tombol from './Tombol.jsx'
import Perekam from './Perekam.jsx'

/* Tahap antara kartu dan pemutar.

   Klik kartu tidak langsung membuka video. Kartunya keluar dulu dari
   tumpukan, terangkat ke tengah, sekelilingnya meredup, lalu memperkenalkan
   diri: siapa pengirimnya + cuplikan videonya (bisu, berulang, tanpa
   kontrol). Baru dari sini videonya betulan diputar.

   `layoutId` yang sama dengan kartunya — jadi kartu itu sendiri yang
   terbang naik, bukan panel baru yang muncul menimpanya. */
export default function Sorot({ pesan, onTutup, onPutar }) {
  const [muaiSelesai, setMuaiSelesai] = useState(false)
  const [merekam, setMerekam] = useState(false)
  const bisaRekam = pesan.id === KARTU_REKAM && Boolean(UPLOAD_PRESET)

  /* Rekaman baru terkirim: "putar" langsung memutar hasil yang baru. */
  const terkirim = () => {
    segarkanVideo(pesan.id)
    setMerekam(false)
  }

  /* Panel ini ~350px CSS, jadi 760px cukup untuk layar 2× — hampir dua kali
     lebar berkas yang dipakai kartunya. Sengaja diminta terpisah. */
  const foto = urlFoto(pesan.id, { lebar: 760, rasio: '4:3' })

  useKunciScroll()

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onTutup()
      if (e.key === 'Enter' && pesan.video) onPutar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onTutup, onPutar, pesan.video])

  /* Isi baru dimunculkan setelah animasi layout selesai. Kalau ikut dari
     awal, teks & bingkainya teregang mengikuti kartu yang sedang membesar. */
  const munculkan = (delay) => ({
    initial: { opacity: 0, y: 10 },
    animate: muaiSelesai ? { opacity: 1, y: 0 } : {},
    transition: { duration: DUR.enter, ease: EASE.in, delay },
  })

  return (
    <div className="pointer-events-none fixed inset-0 z-[50] grid place-items-center p-5">
      <motion.div
        layoutId={`kartu-${pesan.id}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Pesan dari ${pesan.nama}`}
        initial={false}
        animate={{ backgroundColor: bgHex(pesan.warna) }}
        /* SENGAJA tanpa `exit`. Kartu di meja masih terpasang dan memegang
           layoutId yang sama; begitu panel ini lepas seketika, kartu itu yang
           mengambil alih dan terbang balik ke tumpukan. Kalau diberi exit,
           panel ini bertahan beberapa ratus ms dan untuk sesaat ADA DUA
           elemen ber-layoutId sama — Motion menganimasikan keduanya dan
           hasilnya berbayang. Alasan yang sama kenapa peredupnya ditaruh di
           Pesan.jsx: kalau ia punya exit dan tinggal di sini, seluruh
           komponen ini ikut tertahan. */
        transition={{ duration: DUR.page, ease: EASE.in }}
        onLayoutAnimationComplete={() => setMuaiSelesai(true)}
        /* Bayangannya sengaja tidak sebesar sebelumnya (dulu blur 80px).
           Motion mengoreksi skala `box-shadow` selama animasi layout, tapi
           koreksinya tidak sempurna untuk blur sebesar itu: sepanjang
           penerbangan bayangannya melar dan terbaca seperti noda gelap yang
           mengekor kartunya. */
        className="pointer-events-auto w-[min(24rem,88vw)] overflow-hidden rounded-2xl p-4 shadow-[0_24px_50px_-16px_rgba(46,42,38,0.5)]"
        style={{ color: onHex(pesan.warna) }}
      >
        <motion.div
          {...munculkan(0.04)}
          className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black/10"
        >
          {pesan.video ? (
            /* Cuplikan: bisu + berulang + tanpa kontrol. Autoplay hanya
               diizinkan browser kalau `muted` — jangan dilepas. */
            <video
              src={pesan.video}
              muted
              loop
              autoPlay
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              {/* Rasio 4:3 di sini, beda dengan 3:4 di kartu — sumbernya
                  foto yang sama, potongannya yang menyesuaikan. */}
              {foto && (
                <img
                  src={foto}
                  alt=""
                  className="h-full w-full object-cover opacity-70"
                />
              )}
              <span className="absolute inset-0 grid place-items-center bg-ink/25 text-sm text-bg">
                videonya menyusul
              </span>
            </>
          )}
        </motion.div>

        <motion.div {...munculkan(0.1)} className="flex items-baseline gap-2 pt-4">
          <span className="text-xs tabular-nums opacity-60">
            {String(pesan.id).padStart(2, '0')}
          </span>
          <span className="text-sm opacity-70">pesan dari</span>
        </motion.div>

        <motion.h2
          {...munculkan(0.14)}
          className="italic-accent text-[clamp(1.7rem,7vw,2.4rem)] leading-tight"
        >
          {pesan.nama}
        </motion.h2>

        <motion.div {...munculkan(0.2)} className="flex items-center gap-3 pt-4">
          {/* Hanya kartu yang videonya sudah ada yang punya tombol ini.
              Kartu lain tetap boleh dibuka — nama pengirimnya tetap ada. */}
          {pesan.video && (
            /* Latarnya KRIM SOLID, bukan putih tembus pandang.

               Dulu `rgba(255,255,255,0.32)` — idenya satu nilai yang
               menyesuaikan diri ke kelima warna kartu tanpa lima varian.
               Tapi putih 32% di atas warna kartu yang pekat tidak terbaca
               sebagai tombol, melainkan sebagai tombol yang PUDAR/mati.
               Krim solid tetap satu nilai untuk kelima warna, dan teksnya
               sudah gelap otomatis karena panel ini mengoper
               `color: onHex(warna)` yang diwarisi tombolnya. */
            <Tombol
              onClick={onPutar}
              data-kursor-teks="putar!"
              aria-label={`Putar video dari ${pesan.nama}`}
              className="px-5 font-medium"
              style={{ background: 'var(--color-bg)' }}
            >
              putar
            </Tombol>
          )}

          {bisaRekam && (
            <Tombol
              onClick={() => setMerekam(true)}
              data-kursor-teks="rekam!"
              className="px-5 font-medium"
              style={pesan.video ? undefined : { background: 'var(--color-bg)' }}
            >
              {pesan.video ? 'rekam ulang' : 'rekam video'}
            </Tombol>
          )}

          <motion.button
            {...tapPress}
            onClick={onTutup}
            aria-label="Kembali ke meja pesan"
            className="tap link-garis text-sm opacity-75"
          >
            kembali
          </motion.button>
        </motion.div>
      </motion.div>
      {merekam && <Perekam onTutup={() => setMerekam(false)} onTerkirim={terkirim} />}
    </div>
  )
}
