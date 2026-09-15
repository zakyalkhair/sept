import { Fragment, useState } from 'react'
import { motion } from 'motion/react'
import PageShell from '../components/PageShell.jsx'
import Konfeti from '../components/Konfeti.jsx'
import TombolLanjut from '../components/TombolLanjut.jsx'
import { surat, suratAkhir, suratFoto, suratKop } from '../data/surat.js'
import { urlFotoSurat } from '../data/video.js'
import { useTextScrub } from '../hooks/useTextScrub.js'
import { useKertasSurat } from '../hooks/useKertasSurat.js'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { EASE } from '../lib/motion.js'

/* Kalimat pamungkas datang huruf per huruf — tapi dikelompokkan PER KATA.

   Dua hal yang wajib begini, keduanya pernah salah:

   1. Kalau tiap huruf jadi `inline-block` yang berdiri sendiri di satu
      induk, browser boleh memutus baris DI ANTARA HURUF MANA PUN — hasilnya
      "Selamatulangta / hun." Tiap kata dibungkus satu elemen sendiri, jadi
      titik putus baris cuma ada di antara kata.
   2. Spasi antar kata ditulis sebagai TEXT NODE biasa di antara pembungkus
      kata, bukan sebagai `inline-block` berisi spasi. Spasi sendirian di
      dalam `inline-block` diruntuhkan browser dan hilang — itu yang bikin
      kalimatnya sempat menempel jadi "Selamatulangtahun."

   Indeksnya diratakan lintas kata supaya jeda huruf tetap berurutan dari
   awal kalimat sampai akhir, tidak mengulang tiap kata. */
const KATA = (() => {
  let n = 0
  return suratAkhir.split(' ').map((kata) => [...kata].map((c) => ({ c, i: n++ })))
})()

/* Fungsi, bukan objek — tiap huruf butuh jeda sendiri lewat `custom`.
   Dulu jedanya dari `staggerChildren` di induk, tapi itu cuma menjangkau
   anak LANGSUNG; begitu huruf-hurufnya dibungkus per kata, rantai itu
   putus dan semua huruf datang bersamaan. */
const HURUF_VARIAN = {
  diam: { opacity: 0, y: '0.32em' },
  datang: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE.in, delay: i * 0.045 },
  }),
}

export default function Surat() {
  const scrub = useTextScrub()
  const kertas = useKertasSurat()
  const reduced = useReducedMotion()

  return (
    <PageShell className="relative px-5 pb-32 pt-[12vh]">
      {/* Meja di belakang kertas. Tanpa ini kertasnya tidak terbaca sebagai
          benda — warnanya nyaris sama dengan latar halaman. */}
      <div aria-hidden className="latar-surat" />

      {/* DI ATAS kertas, bukan di belakangnya — kepingannya lewat di depan
          surat seperti benda yang tertiup di antara kita dan meja. Ditaruh
          di belakang, dia tertutup total dan efeknya hilang.

          z-30: di atas kertas, tapi di bawah bar musik (z-60) dan kursor
          (z-999). `pointer-events` sudah mati dari class-nya, jadi teks
          surat tetap bisa diseleksi. */}
      <Konfeti className="konfeti-tetap z-30" />

      <article
        ref={kertas}
        className="kertas-surat relative mx-auto max-w-[38rem] pb-[18vh] pt-[12vh]"
      >
        {/* Garis margin buku tulis, ditarik ke bawah mengikuti progres baca. */}
        <span aria-hidden data-margin className="margin-garis" />

        {/* Bekas lipatan amplop. Ditaruh di layar pertama — di situlah
            kertasnya baru saja keluar dari amplop di /pesan. */}
        <span aria-hidden data-lipatan className="lipatan" style={{ top: '34vh' }} />
        <span aria-hidden data-lipatan className="lipatan" style={{ top: '68vh' }} />

        <div className="kertas-isi">
          {/* Tanggal saja di kiri. Sisi kanan (dulu "ditulis lebih awal")
              dihapus — `justify-between` ikut dilepas, kalau tidak
              tanggalnya akan terlempar sendirian ke kiri dengan sisa ruang
              kosong yang aneh di sebelahnya. */}
          <header
            data-kop
            className="border-b border-line pb-4 text-sm tabular-nums text-muted"
          >
            {suratKop.tanggal}
          </header>

          <p
            data-kop
            className="italic-accent mb-[14vh] mt-[7vh] text-[clamp(1.7rem,5.5vw,2.6rem)] leading-none"
          >
            {suratKop.kepada}
          </p>

          <div ref={scrub} className="flex flex-col gap-[18vh]">
            {surat.map((p, i) => (
              <Fragment key={i}>
                <p
                  data-scrub-teks
                  className="surat-teks text-[clamp(1.35rem,4.6vw,2rem)] leading-[1.55]"
                >
                  {/* Dipecah di JSX, bukan lewat DOM: React tetap pemilik
                      tunggal isi elemen ini. */}
                  {p.split(' ').map((kata, j) => (
                    <span key={j}>
                      <span className="surat-kata">{kata}</span>{' '}
                    </span>
                  ))}
                </p>

                {/* Foto yang diselipkan setelah paragraf ini. Sengaja di
                    DALAM wadah scrub tapi tanpa `data-scrub-teks`, jadi
                    hook scrub-nya melewatinya begitu saja. */}
                {suratFoto
                  .filter((f) => f.setelah === i)
                  .map((f) => (
                    <FotoSurat key={f.n} foto={f} reduced={reduced} />
                  ))}
              </Fragment>
            ))}
          </div>

          {/* Jeda napas sebelum kalimat terakhir. Panjangnya disengaja:
              inilah satu-satunya bagian halaman yang boleh kosong. */}
          <div className="relative mt-[52vh]">
            {/* Rembesan tinta di belakang kalimatnya — mekar sekali saja,
                sangat samar. Yang membuatnya terasa "momen", bukan sekadar
                paragraf besar. */}
            <motion.span
              aria-hidden
              className="rembesan"
              initial={reduced ? false : { opacity: 0, scale: 0.72 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1.6, ease: EASE.smooth }}
            />

            <motion.h2
              aria-label={suratAkhir}
              initial={reduced ? false : 'diam'}
              whileInView="datang"
              viewport={{ once: true, amount: 0.55 }}
              className="h-display relative text-[clamp(2.4rem,10vw,5rem)] leading-[1.06]"
            >
              {KATA.map((kata, ki) => (
                <Fragment key={ki}>
                  {/* Spasi sebagai teks biasa DI LUAR pembungkus kata —
                      di sinilah satu-satunya tempat baris boleh terputus. */}
                  {ki > 0 && ' '}
                  {/* Pembungkus kata harus `motion.span`, bukan `span` biasa:
                      Motion meneruskan label varian ("diam"/"datang") hanya
                      lewat rantai komponen motion. Satu `span` polos di
                      tengah memutus rantainya dan huruf-hurufnya tidak akan
                      pernah dianimasikan. */}
                  <motion.span className="inline-block">
                    {kata.map(({ c, i }) => (
                      <motion.span
                        key={i}
                        aria-hidden
                        custom={i}
                        className="inline-block"
                        variants={HURUF_VARIAN}
                      >
                        {c}
                      </motion.span>
                    ))}
                  </motion.span>
                </Fragment>
              ))}
            </motion.h2>
          </div>

          <div className="mt-[14vh]">
            <TombolLanjut />
          </div>
        </div>
      </article>
    </PageShell>
  )
}

/* Satu foto yang ditempel di badan surat.

   Bingkai putih tebal + miring sedikit = foto cetak yang ditempel tangan,
   bukan gambar yang disisipkan ke dokumen. Kemiringannya kecil (±3°);
   lebih dari itu terbaca sebagai stiker.

   Masuknya `whileInView` sekali (`once`), searah dengan kemiringannya —
   sama seperti kartu di /pesan versi HP: datang dari sisi yang dituju
   miringnya, bukan melawannya. */
function FotoSurat({ foto, reduced }) {
  /* Kertas suratnya `max-w-38rem` dikurangi padding → ~500px CSS. 1000px
     cukup untuk layar 2×, dan foto surat memang yang paling besar dipakai
     di situs ini. Tanpa `rasio`: biar potongan aslinya yang menentukan,
     karena foto bersama sering lanskap maupun potret. */
  const [gagal, setGagal] = useState(false)
  const src = urlFotoSurat(foto.n, { lebar: 1000 })
  if (!src || gagal) return null

  const miring = foto.miring ?? -1.8

  return (
    <motion.figure
      className="foto-surat"
      style={{ '--miring': `${miring}deg` }}
      initial={reduced ? false : { opacity: 0, y: 26, rotate: miring * 2.2 }}
      whileInView={{ opacity: 1, y: 0, rotate: miring }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ type: 'spring', stiffness: 210, damping: 24, mass: 0.9 }}
    >
      <img src={src} alt={foto.teks || ''} loading="lazy" decoding="async" onError={() => setGagal(true)} />
      {foto.teks && <figcaption>{foto.teks}</figcaption>}
    </motion.figure>
  )
}
