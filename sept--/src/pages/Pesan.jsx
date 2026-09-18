import { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useInView } from 'motion/react'
import PageShell from '../components/PageShell.jsx'
import Kartu from '../components/Kartu.jsx'
import Pemutar from '../components/Pemutar.jsx'
import Sorot from '../components/Sorot.jsx'
import Tumpukan from '../components/Tumpukan.jsx'
import Vignette from '../components/Vignette.jsx'
import { messages } from '../data/messages.js'
import { scatterOf, sibakOf, tiltOf } from '../lib/scatter.js'
import { EASE } from '../lib/motion.js'
import { useIsDesktop } from '../hooks/useIsDesktop.js'
import { useProgress } from '../hooks/useProgress.js'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

const ADA_VIDEO = messages.filter((m) => m.video !== null).map((m) => m.id)

/* Kartu asal disembunyikan/dimunculkan lagi saat panel sorot naik & pulang.

   KHUSUS DESKTOP. Di HP opacity tidak pernah dianimasikan sama sekali —
   lihat catatan di `BarisKartu` di bawah.

   Dua arahnya TIDAK simetris, dan itu inti kerapiannya:

   Menyembunyikan (panel naik) — seketika, `duration: 0`. Panelnya berangkat
   dari kotak yang persis sama, jadi tidak ada yang perlu ditutupi. Kalau
   diberi durasi sedikit saja, selama itu kartu masih tergambar di petaknya
   sementara panelnya sudah melayang pergi: itulah kembaran yang terlihat
   saat mengklik.

   Memunculkan (panel pulang) — ditahan ~1 frame lalu naik cepat. Motion
   memasang proyeksi layout kartu di efek layout commit yang sama; tanpa
   jeda itu ada peluang kartu tergambar sekejap di petak asalnya sebelum
   proyeksinya terpasang. Jedanya menutup peluang itu tanpa menyisakan lubang
   yang terasa. */
const opasitasKartu = (sembunyi) =>
  sembunyi ? { duration: 0 } : { duration: 0.1, delay: 0.03, ease: EASE.out }

export default function Pesan() {
  const desktop = useIsDesktop()
  const reduced = useReducedMotion()
  const navigate = useNavigate()
  const { dibuka, tandai, tandaiSemua, jumlah } = useProgress()
  /* Dua tahap terpisah: `sorot` = kartu terangkat + cuplikan, `aktif` =
     video diputar penuh. Keduanya berbagi layoutId kartu, jadi hanya boleh
     ada satu yang terpasang pada satu waktu. */
  const [sorot, setSorot] = useState(null)
  const [aktif, setAktif] = useState(null)
  /* Sekali kartu terakhir mendarat, transisi kartu berganti dari "masuk"
     (berdurasi + berjeda tangga) ke pegas sibakan. Tanpa penanda ini, kartu
     kembali ke posisinya dengan jeda sampai 0,9 detik saat sorot ditutup. */
  const [sudahMasuk, setSudahMasuk] = useState(reduced)

  /* Titik jatuh tiap kartu setelah diseret, dalam px relatif petak asalnya.
     Disimpan di SINI, bukan di kartunya: elemen kartu memegang `layoutId`
     dan proyeksi layout Motion menulis transform ke elemen itu, jadi
     transform kedua di sana akan bertumpuk (lihat Kartu.jsx). Pembungkusnya
     bebas dari layoutId, jadi aman menampung simpangan. */
  const [geser, setGeser] = useState({})

  /* Ditambahkan, bukan diganti — seret kedua menumpuk di atas yang pertama. */
  const catatGeser = useCallback((id, x, y) => {
    setGeser((g) => ({
      ...g,
      [id]: { x: (g[id]?.x ?? 0) + x, y: (g[id]?.y ?? 0) + y },
    }))
  }, [])

  const putar = (pesan) => {
    /* Satu render untuk dua state — Motion butuh Sorot lepas dan Pemutar
       terpasang di commit yang sama supaya layoutId-nya berpindah mulus. */
    setSorot(null)
    setAktif(pesan)
    tandai(pesan.id)
  }

  const lanjut = () => {
    const i = messages.findIndex((m) => m.id === aktif.id)
    const berikut = messages.slice(i + 1).find((m) => m.video !== null)
    if (berikut) putar(berikut)
    else setAktif(null)
  }

  /* Pasangan `lanjut`: video ber-video terdekat SEBELUM yang sedang main.
     Kalau ini yang pertama, tidak terjadi apa-apa — menutup pemutar di sini
     akan terasa seperti hukuman atas geseran yang meleset. */
  const mundur = () => {
    const i = messages.findIndex((m) => m.id === aktif.id)
    const sebelum = messages
      .slice(0, i)
      .reverse()
      .find((m) => m.video !== null)
    if (sebelum) putar(sebelum)
  }

  const lewati = () => {
    tandaiSemua(ADA_VIDEO)
    setSorot(null)
    setAktif(null)
    navigate('/surat')
  }

  /* Pusat sibakan = TENGAH MEJA, bukan posisi kartu yang diklik. Panelnya
     mendarat di tengah layar, jadi ruang yang perlu dikosongkan ada di
     tengah. Waktu pusatnya masih di posisi kartu asal, kartu yang menyibak
     berada jauh dari yang sedang dilihat — terbaca seperti kartu acak
     bergerak sendiri, bukan seperti memberi jalan.

     Angkanya di ruang koordinat sebar (lihat scatterOf: x 5–82, y 5–80,
     dan itu sudut kiri-atas kartu, bukan tengahnya). */
  const pusat = sorot ? { x: 42, y: 38 } : null

  /* Kartu yang sedang "diangkat" — panel sorot atau pemutar sedang memegang
     rupanya, jadi yang di meja harus disembunyikan. */
  const disembunyikan = (id) => sorot?.id === id || aktif?.id === id

  return (
    <PageShell tanpaGeser className="relative">
      <Vignette />

      <header className="pointer-events-none sticky top-0 z-20 flex items-baseline justify-between gap-4 p-5">
        {/* Judulnya jauh lebih panjang dari "21 pesan" yang dulu, sementara
            counter di kanan tidak boleh terdorong keluar layar. `clamp`
            mengecilkan judul di layar sempit, `shrink-0` di sisi kanan
            memastikan yang mengalah selalu judulnya. */}
        {/* Judulnya sekaligus jalan pulang ke `/`. `pointer-events-auto`
            hanya di tautannya, bukan di `header`-nya: header sengaja
            `pointer-events-none` supaya tidak menghalangi seret kartu di
            belakangnya. */}
        <h1 className="h-display text-[clamp(0.95rem,3.6vw,1.5rem)] leading-tight">
          <Link
            to="/"
            data-kursor-teks="awal"
            className="link-garis pointer-events-auto"
          >
            21 wishes for 21st birthday
          </Link>
        </h1>
        {/* Tanpa tombol "lewati" di header. Jalan ke /surat tetap ada dua:
            amplop di ujung meja, dan "lewati semua" di dalam pemutar video. */}
        <p className="shrink-0 text-sm tabular-nums text-muted">
          {jumlah} / {messages.length} dibuka
        </p>
      </header>

      {desktop ? (
        /* `z-0` (bukan sekadar `relative`) membuat konteks penumpukan
           sendiri. Tanpa itu, zIndex kartu dari scatterOf (1–21) berebut
           di skala yang sama dengan overlay `fixed` aplikasi — kartu
           bernilai 80 menutupi tombol mute (60) dan dulu juga kursor. */
        <div className="meja-pesan relative z-0 h-[calc(100dvh-5rem)] w-full">
          {messages.map((m, i) => {
            const s = scatterOf(m.id)
            /* Yang disorot tidak ikut disibak — dia yang jadi pusatnya. */
            const sibak =
              pusat && sorot.id !== m.id && !reduced
                ? sibakOf(pusat, s, m.id)
                : { x: 0, y: 0 }
            const g = geser[m.id]
            return (
              <motion.div
                key={m.id}
                className="absolute"
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  zIndex: s.z,
                  rotate: `${s.rot}deg`,
                }}
                initial={reduced ? false : { opacity: 0, y: -50, scale: 0.86 }}
                /* Kartu asal disembunyikan selama panelnya terangkat.
                   `layoutId` TIDAK menyembunyikannya sendiri — panel dan
                   kartu dua elemen berbeda yang keduanya tetap terpasang,
                   jadi tanpa ini kartunya terlihat masih tergeletak di
                   tumpukan padahal "sudah diangkat".

                   Lewat `opacity` di `animate`, BUKAN `visibility: hidden`
                   di `style`. Dengan visibility, saat sorot ditutup kartunya
                   berubah terlihat di commit yang sama dengan lepasnya
                   panel — ada satu frame ia tergambar penuh di petak asalnya
                   sebelum proyeksi layout Motion sempat memindahkannya ke
                   posisi panel. Itulah kilasan "bayangan" yang muncul
                   sesekali (tergantung timing frame, makanya tidak selalu).
                   Dengan opacity mulai dari 0, frame itu tak tergambar. */
                animate={{
                  opacity: disembunyikan(m.id) ? 0 : 1,
                  x: sibak.x + (g?.x ?? 0),
                  y: sibak.y + (g?.y ?? 0),
                  scale: 1,
                }}
                transition={
                  sudahMasuk
                    ? {
                        /* Sibakan pakai pegas, bukan durasi: kartu terdorong
                           menepi dan mengendap, bukan meluncur seragam. */
                        type: 'spring',
                        stiffness: 200,
                        damping: 26,
                        mass: 0.7,
                        opacity: opasitasKartu(disembunyikan(m.id)),
                      }
                    : {
                        duration: 0.5,
                        ease: EASE.overshoot,
                        delay: reduced ? 0 : i * 0.045,
                      }
                }
                onAnimationComplete={
                  i === messages.length - 1 ? () => setSudahMasuk(true) : undefined
                }
              >
                <Kartu
                  pesan={m}
                  sudahDibuka={dibuka.has(m.id)}
                  bisaDiseret
                  terangkat={disembunyikan(m.id)}
                  onBuka={setSorot}
                  onGeser={catatGeser}
                />
              </motion.div>
            )
          })}
        </div>
      ) : (
        /* `gap-9` (36px), bukan `gap-5` (20px). Kartu dimiringkan ±7°
           (tiltOf) — rotasi CSS tidak mengubah kotak tata letaknya, jadi
           sudut kartu yang miring bisa menonjol keluar kotaknya sendiri
           sampai ~10px (setengah lebar kartu × sin 7°). Kalau dua kartu
           bertetangga kebetulan miring saling berhadapan, keduanya bisa
           menonjol berlawanan arah dan tabrakan — itu yang membuat satu
           kartu tampak menimpa kartu di bawahnya. 36px menyisakan margin
           aman di atas skenario terburuknya (~20px). */
        <div className="meja-pesan flex flex-col items-center gap-9 px-5 pb-24">
          {messages.map((m) => (
            <BarisKartu
              key={m.id}
              pesan={m}
              sudahDibuka={dibuka.has(m.id)}
              tersembunyi={disembunyikan(m.id)}
              reduced={reduced}
              onBuka={setSorot}
            />
          ))}
        </div>
      )}

      <Tumpukan />

      {/* Peredup berdiri sendiri, TIDAK di dalam Sorot: kalau ia punya
          `exit` dan tinggal di sana, AnimatePresence menahan seluruh Sorot
          selama peredupnya memudar — dan panel ber-layoutId itu ikut
          tertahan menimpa kartu yang sedang terbang balik. Solid tanpa blur;
          di atas taplak kotak-kotak, lapisan buram terbaca kotor. */}
      <AnimatePresence>
        {sorot && (
          <motion.div
            key="redup"
            aria-hidden
            onClick={() => setSorot(null)}
            className="fixed inset-0 z-[45] bg-ink"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.62 }}
            exit={{ opacity: 0, transition: { duration: 0.32, ease: EASE.out } }}
            transition={{ duration: 0.45, ease: EASE.in }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sorot && (
          <Sorot
            key="sorot"
            pesan={sorot}
            onTutup={() => setSorot(null)}
            onPutar={() => putar(sorot)}
          />
        )}

        {aktif && (
          <Pemutar
            key="pemutar"
            pesan={aktif}
            onTutup={() => setAktif(null)}
            onLanjut={lanjut}
            onMundur={mundur}
            onLewati={lewati}
          />
        )}
      </AnimatePresence>
    </PageShell>
  )
}

/* Satu kartu di daftar vertikal HP.

   Versi sebelumnya menganimasikan semua 21 kartu sekaligus saat mount
   dengan jeda tangga. Masalahnya: 15 kartu di bawah lipatan layar sudah
   SELESAI animasinya sebelum jempol sempat menggulir ke sana — jadi
   scroll-nya sunyi, tidak ada apa pun yang terjadi. Sekarang tiap kartu
   menunggu gilirannya sendiri: mendarat saat benar-benar masuk layar.

   `once: true` — sekali mendarat, dia diam. Kalau dianimasikan bolak-balik
   tiap keluar-masuk layar, menggulir balik ke atas terasa gelisah, dan di
   daftar sepanjang ini itu cepat melelahkan.

   OPACITY TIDAK PERNAH DIANIMASIKAN DI SINI — sengaja, khusus HP.
   Nilainya tetap dipakai (0 saat kartunya diangkat panel sorot), tapi
   transisinya `duration: 0` alias berpindah seketika. Memudarkan opacity
   di daftar sepanjang ini terbukti rawan: nilainya gampang tersangkut di
   tengah saat animasi masuk, sembunyi-untuk-sorot, dan kemunculan kembali
   saling memotong — hasilnya kartu setengah transparan yang tidak pulih.
   Gerak masuknya sudah dibawa geser + rotasi + skala, jadi tidak ada yang
   hilang dengan mematikannya. Desktop tetap memakai `opasitasKartu`. */
function BarisKartu({ pesan, sudahDibuka, tersembunyi, reduced, onBuka }) {
  const ref = useRef(null)
  const tampak = useInView(ref, { once: true, amount: 0.3 })

  const miring = tiltOf(pesan.id)
  /* Masuk dari sisi yang SEARAH miringnya — kartu yang doyong ke kanan
     datang dari kanan. Kalau arahnya dilawan, kemiringannya terbaca sebagai
     kartu yang terpelanting, bukan kartu yang diletakkan. */
  const dariKanan = miring > 0
  const belum = { opacity: 1, x: dariKanan ? 46 : -46, rotate: miring * 2.4, scale: 0.93 }
  const terlihat = { opacity: 1, x: 0, rotate: miring, scale: 1 }

  const tujuan = tersembunyi
    ? /* Sembunyi untuk panel sorot: HANYA opacity yang dinolkan, posisi &
         rotasinya dipertahankan. Kartu ini pemegang layoutId — kalau
         posisinya ikut berubah, panelnya terbang dari tempat yang salah. */
      { ...terlihat, opacity: 0 }
    : tampak
      ? terlihat
      : belum

  return (
    <motion.div
      ref={ref}
      initial={reduced ? false : belum}
      animate={tujuan}
      transition={{
        type: 'spring',
        stiffness: 240,
        damping: 24,
        mass: 0.8,
        /* Seketika, tanpa transisi — lihat catatan di atas komponen. */
        opacity: { duration: 0 },
      }}
    >
      <Kartu
        pesan={pesan}
        sudahDibuka={sudahDibuka}
        bisaDiseret={false}
        terangkat={tersembunyi}
        /* Kilau menyapu dijalankan sekali saat kartunya mendarat. Di HP
           tidak ada hover, jadi tanpa ini `.kartu-kilau` tidak pernah
           jalan sama sekali — CSS-nya dikunci `@media (hover: hover)`. */
        sapu={tampak && !reduced}
        onBuka={onBuka}
      />
    </motion.div>
  )
}

