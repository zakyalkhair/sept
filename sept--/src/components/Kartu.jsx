import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue } from 'motion/react'
import { bgClass, onClass } from '../lib/colors.js'
import { urlFoto } from '../data/video.js'
import { spring, tapPress } from '../lib/motion.js'
import { useVelocitySkew } from '../hooks/useVelocitySkew.js'

/* Geser sejauh ini (px) sudah dihitung sebagai seret, bukan klik. */
const AMBANG_SERET = 6

/* ── Sorot itu MILIK MEJA, bukan milik kartu ────────────────────────────
   Versi pertama menyimpan sorot sepenuhnya di dalam tiap kartu dan
   membersihkannya lewat `onDragStart` kartu itu sendiri. Itu tidak cukup,
   dan alasannya halus:

   Kartu yang nyangkut menyala BUKAN saat diseret — mereka menyala lebih
   dulu, waktu kursor sekadar melintasinya dalam perjalanan menuju kartu
   yang akan diseret. Begitu seret dimulai, `setPointerCapture` mengalihkan
   SEMUA pointer event ke kartu yang diseret, jadi `onHoverEnd` milik kartu
   yang terlewati itu tidak pernah datang. Mereka tertinggal menyala, dan
   `onDragStart` kartu yang diseret tidak tahu apa-apa tentang mereka.

   Jadi pembersihnya harus tahu tentang semua kartu. Sekalian ditegakkan
   invarian yang memang selalu benar di meja ini: hanya SATU kartu boleh
   tersorot pada satu waktu. Dengan invarian itu, sisa sorot menjadi tidak
   mungkin — bukan sekadar dibersihkan setelah terjadi.

   Registry modul, bukan context: tidak ada satu pun nilai di sini yang
   perlu memicu render ulang siapa pun selain kartu yang berubah, dan
   context justru akan me-render seluruh meja tiap kali kursor pindah
   kartu.

   ⚠️ Mekanisme ini SUDAH BENAR dan tidak perlu jaring pengaman tambahan.
   Pernah dicurigai sebagai sumber "highlight nyangkut" lalu ditambahi
   reconciler `elementFromPoint` per frame — ternyata salah sasaran:
   `data-sorot` selalu tepat, cincin yang nyangkut itu sisa INLINE style
   dari `whileDrag`. Lihat komentar di `whileDrag` bawah. Reconciler-nya
   sudah dicabut lagi; jangan ditambahkan kembali tanpa bukti bahwa
   `data-sorot`-lah yang keliru. */
const pendengarSorot = new Set()

/* `kecuali === null` berarti padamkan semuanya. */
function pindahSorot(kecuali) {
  pendengarSorot.forEach((padamkan) => padamkan(kecuali))
}

export default function Kartu({
  pesan,
  sudahDibuka,
  bisaDiseret,
  onBuka,
  onGeser,
  terangkat = false,
  sapu = false,
}) {
  const [fotoGagal, setFotoGagal] = useState(false)
  const { ref, report } = useVelocitySkew(bisaDiseret)
  const turun = useRef(null)

  /* Sorot hover dipegang STATE, bukan `:hover` CSS.

     Sebabnya seret: Motion memakai `setPointerCapture` selama menyeret.
     Selama pointer ter-capture, browser berhenti memperbarui `:hover`
     normal — dan begitu capture dilepas, kartu-kartu yang TERLEWATI kursor
     saat menyeret bisa tertinggal dalam keadaan `:hover` sekaligus. Itu
     yang membuat semua kartu tampak tersorot setelah satu kali seret, dan
     baru hilang kalau tiap kartu dihover ulang satu per satu.

     `onHoverStart`/`onHoverEnd` Motion tidak kena masalah itu: keadaannya
     dijaga di JS dan dibereskan sendiri saat seret dimulai. (Bukti bahwa
     diagnosisnya benar: `whileHover` scale 1.04 — yang juga Motion — tidak
     ikut nyangkut, hanya bagian CSS-nya.) */
  const [disorot, setDisorot] = useState(false)

  /* Tiap kartu mendaftarkan satu cara untuk dipadamkan dari luar. Yang
     dibandingkan `pesan.id`, bukan identitas fungsi — kartu yang sedang
     menyalakan dirinya sendiri tidak boleh ikut padam oleh sinyalnya
     sendiri. */
  useEffect(() => {
    const padamkan = (kecuali) => {
      if (kecuali !== pesan.id) setDisorot(false)
    }
    pendengarSorot.add(padamkan)
    return () => {
      pendengarSorot.delete(padamkan)
    }
  }, [pesan.id])

  /* Simpangan seret dipegang eksplisit, bukan dibiarkan internal Motion,
     supaya bisa dinolkan. Lihat efek di bawah. */
  const dx = useMotionValue(0)
  const dy = useMotionValue(0)

  /* Kartu yang diseret meninggalkan `transform` translate pada dirinya
     sendiri. Saat panel sorot mengambil alih `layoutId`-nya, proyeksi layout
     Motion menulis transform-nya SENDIRI ke elemen yang sama — keduanya
     bertumpuk, dan saat panel ditutup kartunya terbang dua kali lipat
     simpangannya, keluar frame.

     Jadi begitu kartu terangkat, simpangan seretnya DIPINDAHKAN ke
     pembungkusnya (`onGeser`) lalu dinolkan di sini. Titik jatuhnya tetap
     terjaga — cuma disimpan di lapis yang tidak dipakai proyeksi layout,
     jadi tidak ada lagi dua transform di satu elemen.

     Efek ini `useEffect` (bukan di dalam handler klik) dengan sengaja: ia
     berjalan SETELAH efek layout, jadi Motion sempat mengukur kartu di
     posisi seretnya dan panelnya terbang dari tempat kartu itu dijatuhkan.
     Serah-terima ke pembungkus terjadi saat kartunya sudah
     `visibility: hidden`, jadi selisih satu frame di antara keduanya tidak
     terlihat. */
  useEffect(() => {
    if (!terangkat) return
    const gx = dx.get()
    const gy = dy.get()
    if (gx === 0 && gy === 0) return
    onGeser?.(pesan.id, gx, gy)
    dx.set(0)
    dy.set(0)
  }, [terangkat, dx, dy, onGeser, pesan.id])

  /* Seret pada elemen `button` tetap memunculkan event `click` saat tombol
     dilepas — jadi menggeser kartu ikut membuka panel sorotnya.

     Dibedakan dari JARAK pointer, bukan dari flag `onDragStart`/`onDragEnd`
     Motion: urutan dragEnd vs click tidak dijamin, jadi flag semacam itu
     harus dibersihkan lewat timeout dan rapuh. Jarak selalu benar. */
  const klik = (e) => {
    /* detail 0 = ditekan dari keyboard (Enter/Space). Di situ clientX/Y
       bernilai 0 dan pengukuran jarak tidak berlaku. */
    if (e.detail !== 0 && turun.current) {
      const d = Math.hypot(e.clientX - turun.current.x, e.clientY - turun.current.y)
      if (d > AMBANG_SERET) return
    }
    /* Celah yang sama dengan seret: begitu panel sorot terbuka, kartunya
       terangkat keluar dari bawah kursor dan `onHoverEnd`-nya tidak pernah
       datang — jadi kartu ini akan tertinggal menyala saat panel ditutup.
       Dipadamkan di sini, sebelum panelnya membuka. */
    pindahSorot(null)
    onBuka(pesan)
  }

  const kosong = pesan.video === null
  const inisial = pesan.nama.slice(0, 1).toUpperCase()

  /* Ukurannya diminta di sini, bukan di `messages.js`: kartu ini paling
     lebar ~208px CSS, jadi 460px sudah cukup untuk layar 2×. `urlFoto`
     mengembalikan `null` kalau fotonya belum diunggah — dan `null` DICEK
     di render, bukan dibiarkan jadi `<img src={null}>` yang memicu 404 lalu
     jatuh ke `onError`. 21 permintaan gagal itu ongkos yang tidak perlu. */
  const foto = fotoGagal ? null : urlFoto(pesan.id, { lebar: 460, rasio: '3:4' })

  return (
    <motion.button
      ref={ref}
      layoutId={`kartu-${pesan.id}`}
      /* Kartu tanpa video TETAP bisa dibuka. Sejak ada tahap sorot (02-pesan
         §2.6b), yang muncul pertama bukan videonya melainkan siapa
         pengirimnya — itu tetap ada isinya walau videonya belum diunggah.
         Dulu klik diblokir `!kosong`, jadi selama `video: null` seluruh meja
         terasa mati. Yang dimatikan sekarang hanya tombol "putar"-nya. */
      onPointerDown={(e) => {
        turun.current = { x: e.clientX, y: e.clientY }
      }}
      onClick={klik}
      /* Kursor kustom menampilkan NAMA pengirimnya, bukan "klik!". Kartunya
         sendiri sudah menuliskan namanya di pojok bawah, tapi di tumpukan
         nama itu sering tertutup kartu lain — ini yang membuatnya terbaca
         tanpa perlu menggeser apa pun. */
      data-kursor-teks={pesan.nama}
      /* Dipakai HP: menjalankan kilau sekali saat kartu masuk layar. Di
         desktop kilaunya dipicu `:hover`, yang di layar sentuh tidak pernah
         terjadi (lihat `@media (hover: hover)` di index.css). */
      data-sapu={sapu ? '' : undefined}
      /* Pengganti `:hover` CSS — lihat komentar `disorot` di atas.
         INI SATU-SATUNYA pemicu cincin sorot. Tidak ada jalur lain yang
         boleh menulis `box-shadow` ke kartu (lihat `whileDrag` di bawah). */
      data-sorot={disorot ? '' : undefined}
      drag={bisaDiseret ? true : false}
      dragMomentum={false}
      dragElastic={0.12}
      style={{ x: dx, y: dy }}
      /* Menyalakan diri sendiri SEKALIGUS memadamkan yang lain. Inilah yang
         menegakkan "cuma satu kartu tersorot": kalau `onHoverEnd` sebuah
         kartu hilang ditelan pointer capture, kartu berikutnya yang
         di-hover yang akan memadamkannya. */
      onHoverStart={() => {
        setDisorot(true)
        pindahSorot(pesan.id)
      }}
      onHoverEnd={() => setDisorot(false)}
      /* Padamkan SELURUH meja, bukan cuma kartu ini.
         Kartu yang nyangkut adalah yang cuma dilewati kursor sebelum seret
         dimulai — kartu ini tidak tahu mereka ada, dan begitu capture
         aktif mereka tidak akan pernah menerima `onHoverEnd` sendiri. */
      onDragStart={() => pindahSorot(null)}
      onDrag={(_, info) => report(info.delta.x * 2.2)}
      onDragEnd={() => report(0)}
      whileHover={bisaDiseret ? { scale: 1.04, transition: spring.snap } : undefined}
      /* TANPA `boxShadow` di sini — dan itu WAJIB, bukan selera.
         Untuk menganimasikan `box-shadow`, Motion membaca nilai computed
         saat seret dimulai sebagai titik awal. Kartu HARUS di-hover dulu
         supaya bisa diseret, jadi yang terekam selalu CINCIN HOVER
         (`[data-sorot]` di index.css). Saat seret selesai Motion menulis
         hasil interpolasinya balik sebagai INLINE style — dan inline
         mengalahkan class, jadi cincin itu menempel permanen di kartu yang
         pernah diseret, kebal terhadap hover (`data-sorot` sudah `false`
         tapi cincinnya tetap tergambar). Itulah "highlight nyangkut" yang
         lama tak ketahuan: sumbernya bukan state hover, tapi sisa inline
         style ini.

         Jadi cincin HANYA boleh hidup di CSS `[data-sorot]`. Kalau kesan
         "terangkat" saat menyeret mau dikembalikan, pakai CSS lewat
         atribut sendiri — JANGAN lewat `boxShadow` Motion. `scale` aman
         karena ditulis ke `transform`, bukan ke `box-shadow`. */
      whileDrag={bisaDiseret ? { scale: 1.07, transition: spring.snap } : undefined}
      {...tapPress}
      aria-label={`Pesan ${pesan.id} dari ${pesan.nama}${kosong ? ' — videonya belum ada' : ''}`}
      className={[
        'kartu-inersia tap relative block overflow-hidden rounded-2xl',
        'w-[clamp(9rem,42vw,13rem)] aspect-[3/4]',
        'text-left shadow-[0_10px_30px_-12px_rgba(46,42,38,0.4)]',
        bgClass(pesan.warna),
        onClass(pesan.warna),
        'cursor-pointer',
        /* TIDAK ADA penanda transparan untuk "videonya belum ada".
           Dulu kartu tanpa video diberi `opacity-45`. Begitu video pertama
           diunggah, penanda itu menyala untuk 18 kartu sisanya sekaligus —
           dan kartu tembus pandang di atas taplak kotak-kotak terbaca
           RUSAK, bukan "belum siap" (aturan yang sama dengan peredup panel
           sorot, lihat 02-pesan §2.8b). Informasinya tidak hilang: panel
           sorot tetap bilang "videonya menyusul" dan tombol putarnya tidak
           ada. Kalau penanda di meja diinginkan lagi, pakai cara yang
           OPAK — jangan opacity. */
        sudahDibuka ? 'saturate-[0.55]' : '',
      ].join(' ')}
    >
      {foto ? (
        <>
          <img
            src={foto}
            alt=""
            loading="lazy"
            decoding="async"
            /* `draggable={false}` + `pointer-events-none`: TANPA ini, drag
               native gambar bawaan browser (menyeret sebagai file/link)
               merebut gesture dari drag kustom Motion di tombolnya — kartu
               berfoto jadi tidak bisa diseret sama sekali. Klik tetap
               sampai ke tombol karena img tidak lagi ikut menangkap
               pointer. */
            draggable={false}
            onError={() => setFotoGagal(true)}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
          {/* Scrim gelap di bawah: nomor & nama dipaksa putih (lihat di
              bawah) supaya kontrasnya TIDAK bergantung isi foto — tanpa
              scrim, foto terang (langit, dinding putih) membuat teks putih
              itu sendiri yang tertelan. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
            style={{ background: 'linear-gradient(to top, rgba(20,16,12,0.55), transparent)' }}
          />
        </>
      ) : (
        <span className="absolute inset-0 grid place-items-center text-[3.5rem] font-light opacity-35">
          {inisial}
        </span>
      )}

      <span
        className={[
          'absolute left-3 top-2 text-2xl font-semibold tabular-nums [-webkit-text-stroke:1px_rgba(20,16,12,0.85)] [paint-order:stroke_fill]',
          foto ? 'text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]' : 'text-white',
        ].join(' ')}
      >
        {String(pesan.id).padStart(2, '0')}
      </span>

      <span
        className={[
          'absolute bottom-3 left-3 right-3 italic-accent text-lg leading-tight',
          foto ? 'text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]' : '',
        ].join(' ')}
      >
        {pesan.nama}
      </span>

      <span aria-hidden className="kartu-kilau pointer-events-none absolute inset-0" />

      {sudahDibuka && <SudutTerlipat />}
    </motion.button>
  )
}

/* Penanda "sudah ditonton": sudut kanan atas terlipat.
   Lebih halus daripada centang, dan tetap terbaca di 375px. */
function SudutTerlipat() {
  return (
    <span
      aria-hidden
      className="absolute right-0 top-0 h-8 w-8"
      style={{
        background: 'linear-gradient(225deg, rgba(253,248,240,0.92) 50%, transparent 50%)',
      }}
    />
  )
}
