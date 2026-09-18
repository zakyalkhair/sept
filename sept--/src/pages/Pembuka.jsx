import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import KotakKado from '../components/KotakKado.jsx'
import PageShell from '../components/PageShell.jsx'
import Formasi21 from '../components/Formasi21.jsx'
import TombolMasuk from '../components/TombolMasuk.jsx'
import CahayaSapu from '../components/CahayaSapu.jsx'
import Grain from '../components/Grain.jsx'
import TeksAcak from '../components/TeksAcak.jsx'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { useIntro } from '../hooks/useIntro.js'
import VideoPembuka from '../components/VideoPembuka.jsx'
import { DUR, EASE } from '../lib/motion.js'

export default function Pembuka() {
  const reduced = useReducedMotion()
  const mulaiIntro = useIntro()
  const [dibuka, setDibuka] = useState(false)
  const [formasiSelesai, setFormasiSelesai] = useState(false)

  /* Dipanggil LANGSUNG di handler klik kado — lagu harus dinyalakan di
     dalam gestur pengguna, kalau tidak browser menolaknya. */
  const buka = () => {
    mulaiIntro()
    setDibuka(true)
  }

  return (
    <PageShell className="relative grid min-h-dvh place-items-center overflow-hidden p-6">
      <AnimatePresence>
        {!dibuka && <KotakKado key="kado" onBuka={buka} />}
      </AnimatePresence>

      {dibuka && (
      <>
      <CahayaSapu />
      <Grain />

      {/* Formasi mengisi flow dan dipusatkan grid. Saat merakit dia yang
          terlihat (judul masih opacity 0); setelah selesai memudar jadi
          hantu samar + blur supaya tidak mengganggu keterbacaan judul. */}
      <motion.div
        animate={{ opacity: formasiSelesai ? 0.3 : 1 }}
        transition={{ duration: 1.6, ease: EASE.smooth, delay: 0.35 }}
        /* Blur DIPASANG SEKALI, tidak ikut dianimasikan: filter yang
           berubah tiap frame memaksa 21 kartu + lapisan perspective
           digambar ulang terus, dan itu yang bikin halaman ini berat.
           Blur statis cukup dihitung sekali lalu dikomposit. */
        style={{ filter: formasiSelesai ? 'blur(3px)' : 'none' }}
        className="relative z-10 transition-[filter] duration-700"
      >
        {/* `senggol` dimatikan begitu judul tersingkap — kartunya sudah
           jadi latar, tidak perlu lagi mengejar kursor tiap gerakan. */}
        <Formasi21 varian="masuk" senggol={!formasiSelesai} onSelesai={() => setFormasiSelesai(true)} />
      </motion.div>

      {/* Judul di lapisan depan — tersingkap setelah formasi selesai.
          pointer-events-auto + data-kursor supaya kursor kustom tahu saat
          melewati teks (elementFromPoint menembus pointer-events-none). */}
      <motion.h1
        data-kursor="judul"
        initial={{ opacity: 0 }}
        animate={{ opacity: formasiSelesai ? 1 : 0 }}
        transition={{ duration: DUR.enter, ease: EASE.in }}
        className="h-display absolute z-20 -translate-y-[14vh] select-none text-center text-[clamp(2.2rem,9vw,5.5rem)]"
      >
        {/* Lewat TeksAcak (komponen daun), BUKAN `useScramble` langsung di
            sini — kalau langsung, tiap tick acak me-render ulang seluruh
            halaman ini termasuk 21 kartu formasi. Lihat TeksAcak.jsx. */}
        <TeksAcak
          teks="21 wishes"
          jalan={formasiSelesai}
          className="scramble block"
        />
        <TeksAcak
          teks="for Nailah Adlina"
          jalan={formasiSelesai}
          durasi={2200}
          className="scramble italic-accent block text-coral"
        />
      </motion.h1>

      {/* Video kecil di bawah judul — datang setelah kedua baris judul
          selesai terangkai (baris kedua `durasi` 2200ms). */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={formasiSelesai ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: DUR.enter, ease: EASE.in, delay: reduced ? 0 : 2.6 }}
        className="absolute z-20 translate-y-[4vh]"
      >
        <VideoPembuka jalan={formasiSelesai} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={formasiSelesai ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: DUR.enter, ease: EASE.in, delay: reduced ? 0 : 1.4 }}
        className="absolute bottom-[8vh] z-30"
      >
        <TombolMasuk />
      </motion.div>
      </>
      )}
    </PageShell>
  )
}
