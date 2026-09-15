import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import GarisAudio from './GarisAudio.jsx'
import { useMusic } from '../lib/MusicContext.jsx'
import { DUR, EASE, tapPress } from '../lib/motion.js'

/* Tinggi badan bar. Dipakai dua kali — di CSS untuk tingginya, dan di sini
   sebagai jarak geser saat ditutup. Kalau salah satunya diubah tanpa yang
   lain, bar-nya akan menyisakan celah atau tenggelam terlalu dalam. */
const TINGGI_BADAN = '4.5rem'

export default function BarMusik() {
  const { main, mute, toggleMute, nyalakan, lagu, gantiLagu } = useMusic()
  const { pathname } = useLocation()
  const [terbuka, setTerbuka] = useState(true)

  /* Tampil juga SEBELUM musik menyala — kecuali di `/`.

     `nyalakan()` cuma bisa dipanggil dari sini dan dari tombol "masuk".
     Kalau bar ini digerbangi `main`, me-refresh halaman di `/pesan` bikin
     buntu: musik tidak jalan dan tidak ada kontrol untuk menjalankannya.

     `/` dikecualikan supaya halaman pembuka tetap cuma menawarkan satu
     tindakan — "masuk" memang pintu yang dimaksud di sana. */
  const tampil = main || pathname !== '/'

  /* Satu tombol, dua peran: menyalakan kalau belum jalan, mute/unmute kalau
     sudah. Garis rata di ikonnya berarti "tidak ada bunyi" — entah karena
     belum mulai atau karena di-mute. */
  const diam = mute || !main

  return (
    <AnimatePresence>
      {tampil && (
        <motion.div
          key="bar"
          initial={{ opacity: 0, y: TINGGI_BADAN }}
          animate={{ opacity: 1, y: terbuka ? 0 : TINGGI_BADAN }}
          exit={{ opacity: 0, y: TINGGI_BADAN }}
          transition={{ duration: DUR.enter, ease: EASE.in }}
          className="bar-musik"
        >
          {/* Pegangan ditaruh DI LUAR badan bar (di atasnya) supaya ikut
              tergeser bersama bar — saat bar turun setinggi badannya,
              pegangan ini yang tersisa di tepi layar. Kalau dipasang
              terpisah sebagai elemen `fixed` sendiri, dia akan tertimpa
              bar saat terbuka. */}
          <button
            type="button"
            onClick={() => setTerbuka((t) => !t)}
            aria-expanded={terbuka}
            aria-label={terbuka ? 'Sembunyikan pemutar musik' : 'Tampilkan pemutar musik'}
            data-kursor-teks={terbuka ? 'sembunyikan' : 'musik'}
            className="bar-pegangan"
          >
            {/* Panahnya menunjuk ke ARAH TUJUAN, bukan ke keadaan sekarang:
                saat bar terbuka dia menunjuk KE BAWAH ("tekan untuk
                menurunkan"), saat tersembunyi menunjuk ke atas ("tekan untuk
                menaikkan"). Path dasarnya chevron atas, jadi keadaan
                terbukalah yang diputar 180°. */}
            <motion.svg
              viewBox="0 0 24 24"
              aria-hidden
              className="h-3.5 w-3.5"
              animate={{ rotate: terbuka ? 180 : 0 }}
              transition={{ duration: DUR.micro * 2, ease: EASE.out }}
            >
              <path
                d="M6 14 L12 9 L18 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          </button>

          <div className="bar-badan">
            <GarisAudio />

            <div className="bar-isi">
              {/* Judul lagu TETAP TAMPIL selama musik jalan. Yang berganti
                  cuma isinya: `key={lagu.judul}` membuat teksnya bertukar
                  dengan animasi saat lagu berpindah, jadi perpindahannya
                  terbaca tanpa ada yang perlu disembunyikan. */}
              {main ? (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={lagu.judul}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: DUR.micro * 1.6, ease: EASE.out }}
                    className="bar-judul"
                  >
                    <span className="italic-accent">{lagu.judul}</span>
                    {lagu.oleh && <span className="bar-oleh">{lagu.oleh}</span>}
                  </motion.p>
                </AnimatePresence>
              ) : (
                <p className="bar-judul text-muted">musik belum menyala</p>
              )}

              <div className="flex shrink-0 items-center gap-2">
                {main && (
                  <motion.button
                    onClick={() => gantiLagu(1)}
                    {...tapPress}
                    aria-label="Lagu berikutnya"
                    data-kursor-teks="lagu lain"
                    className="musik-tombol tap"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
                      <path
                        d="M6 5 L15 12 L6 19 Z M17 5 L19 5 L19 19 L17 19 Z"
                        fill="currentColor"
                      />
                    </svg>
                  </motion.button>
                )}

                <motion.button
                  onClick={() => (main ? toggleMute() : nyalakan())}
                  {...tapPress}
                  aria-label={diam ? 'Nyalakan musik' : 'Matikan musik'}
                  aria-pressed={main ? mute : false}
                  data-kursor-teks={diam ? 'nyalakan' : 'diamkan'}
                  className="musik-tombol tap"
                >
                  <Gelombang mati={diam} />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* Tiga garis. Bergoyang saat menyala, rata saat diam.
   Sengaja bukan ikon speaker — motif situs ini garis dan kartu. */
function Gelombang({ mati }) {
  return (
    <span aria-hidden className="flex h-4 items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-[2px] rounded-full bg-ink"
          animate={mati ? { height: 3 } : { height: [5, 14, 7, 12, 5] }}
          transition={
            mati
              ? { duration: DUR.micro, ease: EASE.out }
              : { duration: 1.4 + i * 0.22, repeat: Infinity, ease: 'easeInOut' }
          }
        />
      ))}
    </span>
  )
}
