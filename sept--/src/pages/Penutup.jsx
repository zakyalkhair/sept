import { useState } from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell.jsx'
import LatarLebur from '../components/LatarLebur.jsx'
import Konfeti from '../components/Konfeti.jsx'
import TeksAcak from '../components/TeksAcak.jsx'
import { messages } from '../data/messages.js'
import { useProgress } from '../hooks/useProgress.js'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { bgHex } from '../lib/colors.js'
import { DUR, EASE } from '../lib/motion.js'

/* Halaman terakhir sebagai KARTU UCAPAN TERCETAK.

   Versi sebelumnya memakai `Formasi21` yang sama dengan `/`, cuma dibalik
   urutannya dan dipudarkan yang sudah dibuka. Maknanya bagus di atas kertas,
   tapi di layar terbaca sebagai halaman yang sama — bedanya cuma terlihat
   kalau diperhatikan, dan orang tidak memperhatikan di halaman terakhir.

   Gantinya: 21 nama sungguhan, dicetak. Yang videonya sudah ditonton
   BERTINTA; sisanya di-emboss buta — tertekan ke kertas, terbaca hanya dari
   bayangannya. Itu teknik cetak undangan sungguhan, dan kebetulan artinya
   pas: yang sudah didengar punya tinta. */
export default function Penutup() {
  const { dibuka } = useProgress()
  const reduced = useReducedMotion()
  const [masuk, setMasuk] = useState(false)

  return (
    <PageShell className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-[8vh]">
      <LatarLebur />

      {/* Mode `tenang`: halaman ini TIDAK men-scroll, jadi tidak ada yang
          bisa mengaduk kepingannya. Dipasang dengan pengaturan yang sama
          seperti /surat, dia cuma akan jadi versi lemah dari efek yang di
          sana — jatuh terus dengan kerapatan tetap, tanpa sebab-akibat.
          Maka di sini perannya sengaja dibedakan: sedikit, lambat, dan DI
          BELAKANG kartu (z-[1], kartunya z-10) supaya kartu ucapannya
          tetap yang dibaca duluan. */}
      <Konfeti tenang className="z-[1]" />

      <motion.article
        initial={reduced ? false : { opacity: 0, y: 26, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: DUR.page, ease: EASE.in }}
        onAnimationComplete={() => setMasuk(true)}
        className="kartu-penutup relative z-10 w-[min(36rem,94vw)] px-[clamp(1.6rem,7vw,3.4rem)] py-[clamp(2.4rem,7vw,3.6rem)]"
      >
        <p className="mb-[clamp(2rem,6vw,3rem)] text-center text-xs tracking-[0.42em] text-muted">
          20 · 09
        </p>

        <h1 className="h-display text-center text-[clamp(1.7rem,5.4vw,2.7rem)] leading-[1.25]">
          <span className="flex items-baseline justify-center gap-[0.35em]">
            {/* Angka ditulis "21", bukan dieja — dan sengaja TIDAK ikut
                scramble: angka yang teracak terbaca sebagai galat, bukan
                sebagai tulisan yang sedang terbentuk. Dia dapat masuknya
                sendiri. */}
            <motion.span
              aria-label="21"
              initial={reduced ? false : { opacity: 0, scale: 0.7, y: 8 }}
              animate={masuk ? { opacity: 1, scale: 1, y: 0 } : {}}
              transition={{ type: 'spring', stiffness: 320, damping: 18 }}
              className="angka-besar"
            >
              21
            </motion.span>
            {/* Lewat TeksAcak (komponen daun), BUKAN `useScramble` langsung
                di sini — kalau langsung, tiap tick acak me-render ulang
                seluruh halaman termasuk 21 nama. Lihat TeksAcak.jsx. */}
            <TeksAcak teks="wishes" jalan={masuk} className="scramble" />
          </span>

          {/* Baris kunci di-foil: satu-satunya emas di seluruh situs, jadi
              dia yang menahan bobot halaman ini. */}
          <TeksAcak
            teks="for 21st birthday"
            jalan={masuk}
            durasi={2200}
            className="scramble foil block"
          />
        </h1>

        <div aria-hidden className="pemisah-hias" />

        <ul className="daftar-nama">
          {messages.map((m, i) => {
            const bertinta = dibuka.has(m.id)
            return (
              <motion.li
                key={m.id}
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={masuk ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.45,
                  ease: EASE.in,
                  delay: reduced ? 0 : 0.25 + i * 0.028,
                }}
              >
                {/* Nama dibungkus span sendiri, tidak langsung di <li>.
                    Motion menulis `transform` INLINE ke elemen yang
                    dianimasikannya, dan style inline mengalahkan aturan
                    `:hover` di stylesheet — miring hover-nya tidak akan
                    pernah terpakai kalau keduanya di elemen yang sama. */}
                <span
                  className={`nama-cetak ${bertinta ? 'nama-tinta' : 'nama-emboss'}`}
                  style={bertinta ? { '--tinta': bgHex(m.warna) } : undefined}
                >
                  {m.nama}
                </span>
              </motion.li>
            )
          })}
        </ul>

        {/* Tanpa baris hitungan. Daftar namanya SUDAH mengatakan hal yang
            sama — mana yang bertinta dan mana yang masih tertekan — jadi
            menghitungnya lagi cuma mengulang dengan kata-kata. */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={masuk ? { opacity: 1 } : {}}
          transition={{ duration: DUR.enter, ease: EASE.in, delay: reduced ? 0 : 1 }}
          className="mt-[clamp(2rem,6vw,3rem)] flex justify-center"
        >
          <Link to="/pesan" className="link-garis tap px-2 text-sm text-muted">
            kembali ke pesan
          </Link>
        </motion.div>
      </motion.article>
    </PageShell>
  )
}
