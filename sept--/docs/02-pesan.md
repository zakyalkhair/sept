# Tahap 2 — Halaman 21 Pesan + Kartu Melebar Jadi Video

Ini inti situs. Kalau hanya satu halaman yang sempat jadi, ini halamannya.

Teknik yang dipakai di sini: **3 (kecepatan → skew & scale)** dan
**4 (kartu melebar jadi halaman)**. Itu sudah dua — anggaran halaman penuh.
Jangan menambahkan magnetik, kartu bertumpuk, atau scramble di halaman ini.

Selesai kalau: 21 kartu tampil dengan warna dan inisial masing-masing, bisa
diseret di desktop, kartu yang diklik memuai jadi layar penuh berisi video,
"berikutnya" bekerja tanpa latar berkedip, progres tersimpan setelah reload,
dan di 375px kartu jadi tumpukan vertikal yang enak di-scroll.

---

## 2.1 Bentuk halaman

Dua tata letak dari satu data. Bukan dua komponen kartu — satu `Kartu`,
dua wadah.

```
Desktop (≥768px)   kartu berhamburan absolut, posisi + rotasi acak-tetap,
                   bisa diseret
Mobile (<768px)    tumpukan vertikal yang di-scroll, tetap miring acak,
                   tidak bisa diseret (seret berebut dengan scroll)
```

Breakpoint diputuskan sekali di satu tempat, bukan disebar sebagai
`md:` di mana-mana:

`src/hooks/useIsDesktop.js`

```js
import { useEffect, useState } from 'react'

export function useIsDesktop() {
  const [desktop, setDesktop] = useState(
    () => window.matchMedia('(min-width: 768px)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const on = (e) => setDesktop(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  return desktop
}
```

---

## 2.2 Posisi acak yang tetap

Berhamburan harus terlihat acak tapi **tidak boleh berubah tiap render** —
kalau berubah, kartu melompat setiap kali React merender ulang, dan
`layoutId` akan salah menghitung asal animasi.

Jangan simpan di `messages.js` (itu data orang, bukan tata letak). Hitung
sekali dari `id` dengan hash deterministik.

`src/lib/scatter.js`

> **Revisi 2×.** (1) `hash(id)` langsung untuk `x`/`y` → id kecil berurutan
> berkorelasi, kartu menggerombol di bawah-kanan. (2) Grid 6×4 satu-kartu-
> per-sel → terlalu rapi. **Sekarang**: grid kasar 4×3 (12 sel), 21 kartu
> ke 12 sel lewat langkah 5 → **9 sel dapat 2 kartu (gerombol), 3 sel
> dapat 1 (sendirian)**. Jitter lebar (±0.65 sel) → pasangan kadang
> menumpuk rapat, kadang berjarak. Seperti kartu dilempar, bukan diatur.
> `z: Math.round(y)` (bukan `z: id`) — kartu di bawah di depan.
>
> Nilai z itu 5–80, jadi **wadahnya wajib `relative z-0`** supaya punya
> konteks penumpukan sendiri. Tanpa itu z kartu berebut di skala yang sama
> dengan overlay `fixed` aplikasi: kartu bernilai 80 pernah menutupi kursor
> kustom (`z-[70]` waktu itu) dan tombol mute (`z-[60]`).
>
> **`warna` di `messages.js` diatur ulang** supaya tidak ada kartu di sel
> yang sama atau bersebelahan yang sewarna (dulu warna diacak untuk urutan
> baca, jadi sering menggerombol sewarna di sebaran). Assignment dihitung
> dari pemetaan sel `(i*5+2)%12` — kalau `scatterOf` diubah, cek lagi.

```js
const COLS = 4
const ROWS = 3

export function scatterOf(id) {
  const i = id - 1
  const sel = (i * 5 + 2) % (COLS * ROWS)
  const cx = sel % COLS
  const cy = Math.floor(sel / COLS)

  const jx = (hash(id) - 0.5) * 1.3 + 0.5
  const jy = (hash(id + 977) - 0.5) * 1.3 + 0.5
  const x = Math.max(3, Math.min(82, ((cx + jx) / COLS) * 74 + 5))
  const y = Math.max(5, Math.min(80, ((cy + jy) / ROWS) * 70 + 8))

  // z: makin ke bawah makin di depan — bukan z: id, supaya kartu id kecil
  // tidak selalu jadi yang terkubur.
  return { x, y, rot: (hash(id + 1861) - 0.5) * 28, z: Math.round(y) }
}

/* Mobile: hanya kemiringan, posisi diatur flow vertikal. */
export function tiltOf(id) {
  return (hash(id + 421) - 0.5) * 14   // -7deg..+7deg
}
```

> ⚠️ **Wadah kartu mobile butuh `gap-9` (36px), bukan `gap-5` (20px).**
> Rotasi CSS tidak mengubah kotak tata letaknya — sudut kartu yang miring
> bisa menonjol keluar kotaknya sendiri sampai ±10px (setengah lebar kartu
> × sin 7°). Kalau dua kartu bertetangga kebetulan miring saling berhadapan,
> keduanya menonjol berlawanan arah dan bisa bertabrakan — satu kartu tampak
> menimpa kartu di bawahnya. Ini bukan bug interaksi (tidak ada hubungannya dengan diklik),
> murni geometri; hanya muncul untuk kombinasi tilt tertentu, makanya
> terkesan "kadang-kadang". Lihat `src/pages/Pesan.jsx`, cabang mobile.

---

## 2.3 Progres di localStorage

Dengan 21 pesan, dia butuh tahu mana yang belum ditonton.

`src/hooks/useProgress.js`

```js
import { useCallback, useEffect, useState } from 'react'

const KEY = '20sept.dibuka'

function baca() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

export function useProgress() {
  const [dibuka, setDibuka] = useState(baca)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify([...dibuka]))
    } catch {
      /* mode privat / storage penuh — situs tetap harus jalan */
    }
  }, [dibuka])

  const tandai = useCallback((id) => {
    setDibuka((s) => (s.has(id) ? s : new Set(s).add(id)))
  }, [])

  /* Dipakai tombol "lewati": tandai sekaligus semua video yang ADA. */
  const tandaiSemua = useCallback((ids) => {
    setDibuka((s) => {
      if (ids.every((id) => s.has(id))) return s
      const n = new Set(s)
      ids.forEach((id) => n.add(id))
      return n
    })
  }, [])

  return { dibuka, tandai, tandaiSemua, jumlah: dibuka.size }
}
```

`try/catch` di dua sisi bukan paranoia: Safari private mode melempar error
saat `setItem`. Situs tidak boleh mati karena penanda progres.

`tandaiSemua` mengembalikan Set lama apa adanya kalau semua `id` sudah ada —
supaya `useEffect` penulis localStorage tidak jalan sia-sia.

---

## 2.4 Teknik 3 — kecepatan → skew & scale

Ini yang memberi kesan inersia, dan ini bagian yang paling mudah dibuat
boros. Aturannya:

1. **JS hanya menulis satu CSS variable per frame.** CSS yang menerjemahkan
   ke `skewX` dan `scaleY`. (Pola ini dicuri dari elvismao.com — lihat
   `docs/00-riset-motion.md`.)
2. **`rAF` berhenti saat elemen keluar layar** lewat `IntersectionObserver`.
3. **`rAF` juga berhenti saat kecepatan sudah nol** dan baru bangun lagi
   saat ada gerakan. Loop yang terus jalan untuk menghitung nol adalah
   baterai yang terbuang.

`src/hooks/useVelocitySkew.js`

```js
import { useEffect, useRef } from 'react'

/* Mengembalikan ref untuk elemen, dan fungsi report(dx) yang dipanggil
   saat elemen bergerak. Elemen membaca --v di CSS-nya sendiri. */
export function useVelocitySkew(enabled = true) {
  const ref = useRef(null)
  const vel = useRef(0)
  const raf = useRef(0)
  const terlihat = useRef(true)

  const report = (dx) => {
    vel.current = dx
    if (enabled && terlihat.current && !raf.current) {
      raf.current = requestAnimationFrame(loop)
    }
  }

  const loop = () => {
    raf.current = 0
    vel.current *= 0.86

    const el = ref.current
    if (!el) return

    if (Math.abs(vel.current) < 0.05) {
      vel.current = 0
      el.style.setProperty('--v', '0')
      el.style.setProperty('--va', '0')
      return
    }

    const v = Math.max(-1, Math.min(1, vel.current / 40))
    el.style.setProperty('--v', v.toFixed(3))
    el.style.setProperty('--va', Math.abs(v).toFixed(3))

    if (terlihat.current) raf.current = requestAnimationFrame(loop)
  }

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return

    const io = new IntersectionObserver(
      ([e]) => {
        terlihat.current = e.isIntersecting
        if (!e.isIntersecting && raf.current) {
          cancelAnimationFrame(raf.current)
          raf.current = 0
          el.style.setProperty('--v', '0')
          el.style.setProperty('--va', '0')
        }
      },
      { rootMargin: '80px' }
    )

    io.observe(el)

    return () => {
      io.disconnect()
      if (raf.current) cancelAnimationFrame(raf.current)
      raf.current = 0
    }
  }, [enabled])

  return { ref, report }
}
```

CSS yang menerjemahkannya — tambahkan ke `index.css`:

```css
.kartu-inersia {
  --v: 0;    /* -1..1  arah + besar */
  --va: 0;   /*  0..1  besar saja   */
  transform:
    skewX(calc(var(--v) * -9deg))
    scaleY(calc(1 - var(--va) * 0.08))
    scaleX(calc(1 + var(--va) * 0.04));
  transform-origin: center;
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .kartu-inersia { transform: none; }
}
```

**Jangan pakai `abs()` di CSS.** Fungsi itu baru masuk Chrome 138 (Juni 2025) —
Safari sudah sejak lama, tapi Chrome/Edge/Android WebView yang lebih tua akan
**membuang deklarasinya diam-diam** dan kartu jadi tidak bertransformasi sama
sekali, tanpa error. Karena JS sudah menulis nilainya, `--va` gratis.

---

## 2.5 Komponen `Kartu`

Satu komponen untuk dua tata letak. `layoutId` adalah yang menyambungkannya
ke pemutar video — **nilainya harus identik di kedua tempat**.

Kartu adalah `<motion.button>` dan overlay adalah `<motion.div>`. Motion mencocokkan
berdasarkan `layoutId` saja, jadi beda tag tidak masalah — tapi Motion hanya
menganimasikan kotak (posisi, ukuran, `borderRadius`), **bukan isinya**. Karena itu
isi kartu dan isi overlay sengaja dibuat berbeda dan di-fade masing-masing;
jangan berharap teks nama "morph" dari kartu ke judul overlay.

`src/components/Kartu.jsx`

```jsx
import { useState } from 'react'
import { motion } from 'motion/react'
import { bgClass, onClass } from '../lib/colors.js'
import { spring, tapPress } from '../lib/motion.js'
import { useVelocitySkew } from '../hooks/useVelocitySkew.js'

export default function Kartu({ pesan, sudahDibuka, bisaDiseret, onBuka }) {
  const [fotoGagal, setFotoGagal] = useState(false)
  const { ref, report } = useVelocitySkew(bisaDiseret)

  const kosong = pesan.video === null
  const inisial = pesan.nama.slice(0, 1).toUpperCase()

  return (
    <motion.button
      ref={ref}
      layoutId={`kartu-${pesan.id}`}
      onClick={() => onBuka(pesan)}
      data-kursor-teks="buka!"
      drag={bisaDiseret ? true : false}
      dragMomentum={false}
      dragElastic={0.12}
      onDrag={(_, info) => report(info.delta.x * 2.2)}
      onDragEnd={() => report(0)}
      whileHover={bisaDiseret ? { scale: 1.04, transition: spring.snap } : undefined}
      {...tapPress}
      aria-label={`Pesan ${pesan.id} dari ${pesan.nama}${kosong ? ' — belum tersedia' : ''}`}
      className={[
        'kartu-inersia tap relative block overflow-hidden rounded-2xl',
        'w-[clamp(9rem,42vw,13rem)] aspect-[3/4]',
        'text-left shadow-[0_10px_30px_-12px_rgba(46,42,38,0.4)]',
        bgClass(pesan.warna),
        onClass(pesan.warna),
        kosong ? 'opacity-45 cursor-default' : 'cursor-pointer',
        sudahDibuka ? 'saturate-[0.55]' : '',
      ].join(' ')}
    >
      {!fotoGagal && (
        <img
          src={pesan.foto}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFotoGagal(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {fotoGagal && (
        <span className="absolute inset-0 grid place-items-center text-[3.5rem] font-light opacity-35">
          {inisial}
        </span>
      )}

      <span className="absolute left-3 top-3 text-xs tabular-nums opacity-70">
        {String(pesan.id).padStart(2, '0')}
      </span>

      <span className="absolute bottom-3 left-3 right-3 italic-accent text-lg leading-tight">
        {pesan.nama}
      </span>

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
```

**Efek hover kartu** (styling CSS, pemicu JS, di dalam
`@media (hover:hover) and (pointer:fine)`, **tidak menyentuh kartu lain**):
- **Kilau menyapu** — `<span class="kartu-kilau">` `inset-0`, gradient
  `115deg` (puncak `rgba(255,255,255,0.42)`). `translateX(-130% → 130%)`,
  `transition 0.7s var(--ease-smooth)` dua arah.
- **Highlight** — `filter: brightness(1.05) saturate(1.12)` + `box-shadow`
  tepi cahaya `0 0 0 1.5px rgba(255,253,250,0.6)` + bayangan lebih dalam
  `0 24px 48px -14px`. `transition box-shadow/filter 0.25s`.

> ⚠️ **Pemicunya `[data-sorot]`, BUKAN `:hover` CSS** — dan ini wajib.
>
> Motion memakai `setPointerCapture` selama kartu diseret. Selama capture
> aktif, browser **berhenti memperbarui `:hover`**; saat capture dilepas,
> kartu-kartu yang terlewati kursor sepanjang seretan bisa tertinggal dalam
> keadaan `:hover` **sekaligus**. Gejalanya: **semua kartu tampak tersorot
> setelah satu kali seret**, dan baru pulih kalau dihover ulang satu per
> satu. Ini bug pada `:hover` browser, bukan salah nilai CSS-nya.
>
> Keadaannya sekarang dipegang state di `Kartu` lewat
> `onHoverStart`/`onHoverEnd` Motion dan dipasang sebagai atribut
> `data-sorot`. Petunjuk yang mengonfirmasi diagnosis: `whileHover`
> (scale 1.04) yang juga dikelola Motion **tidak pernah ikut nyangkut** —
> hanya bagian yang bergantung pada `:hover` CSS.
>
> Aturan umumnya: **jangan pakai `:hover` CSS pada elemen yang bisa
> diseret.**

> ⚠️ **Memindahkan sorot ke JS saja BELUM cukup** — ini perbaikan kedua,
> dan gejalanya identik dengan yang di atas sehingga mudah salah didiagnosis
> sebagai kambuhnya `:hover`.
>
> Versi pertama menolkan sorot lewat `onDragStart` **kartu yang diseret**.
> Kartu yang tertinggal menyala bukan kartu itu: mereka menyala lebih dulu,
> waktu kursor sekadar **melintasinya dalam perjalanan** menuju kartu yang
> akan diseret. Begitu seret dimulai, `setPointerCapture` mengalihkan semua
> pointer event ke kartu yang diseret — `onHoverEnd` milik kartu-kartu yang
> terlewati itu tidak pernah datang, dan kartu yang diseret tidak tahu
> mereka ada.
>
> Pembersihnya harus tahu tentang **semua** kartu. `Kartu.jsx` memegang
> registry modul (`pendengarSorot`) dengan satu invarian: **hanya satu kartu
> boleh tersorot pada satu waktu**.
>
> - `onHoverStart` → nyalakan diri, `pindahSorot(pesan.id)` padamkan sisanya
> - `onDragStart` → `pindahSorot(null)`, padamkan seluruh meja
> - klik (sebelum `onBuka`) → `pindahSorot(null)`; kartu terangkat keluar
>   dari bawah kursor, jadi `onHoverEnd`-nya juga hilang
>
> Invarian itu yang membuat sisa sorot **tidak mungkin**, bukan sekadar
> dibersihkan setelah terjadi: `onHoverEnd` yang hilang akan ditutup oleh
> kartu berikutnya yang di-hover. Registry modul, bukan context — tidak ada
> nilai di sini yang perlu me-render ulang seluruh meja tiap kursor pindah
> kartu.

> "Sudut terangkat / lipatan", "nomor → buka", dan peredupan kartu lain
> (`:has()` focus) dicoba lalu **dibuang**.

**Kenapa `saturate-[0.55]` dan bukan `opacity`:** kartu yang sudah dibuka
harus terlihat pudar tapi warnanya tetap terbaca sebagai identitas orangnya.
`opacity` mencampurnya dengan krem dan mengaburkan siapa itu.

**Penanda "videonya belum ada" DIHAPUS dari meja.**

> ⚠️ Dulu kartu `kosong` diberi `opacity-45`, digerbangi prop `adaVideo`
> (`redup = kosong && adaVideo`) supaya hanya menyala kalau sudah ada
> kontras "belum siap vs siap". Gerbang itu justru jebakannya: begitu
> **video pertama** diunggah, penanda itu menyala untuk **18 kartu sisanya
> sekaligus** — dan 18 kartu tembus pandang di atas taplak kotak-kotak
> terbaca **RUSAK**, bukan "belum siap". Ini persis aturan §2.8b yang sudah
> kita tetapkan sendiri untuk peredup panel sorot, tapi luput di sini.
>
> Informasinya tidak hilang: panel sorot tetap bilang "videonya menyusul"
> dan tombol putarnya tidak ada. Prop `adaVideo` ikut dihapus (tidak ada
> pemakai lain); `ADA_VIDEO` di `Pesan.jsx` masih dipakai untuk "lewati"
> dan "berikutnya".
>
> **Kalau penanda di meja diinginkan lagi, pakai cara yang OPAK** — jangan
> `opacity`. Perlu diingat `saturate` sudah dipakai untuk "sudah ditonton",
> jadi butuh sinyal ketiga yang berbeda.

**Kartu tanpa video tetap bisa diklik.** Dulu `onClick` dijaga `!kosong` dan
kartunya `aria-disabled` — akibatnya, selama seluruh `messages.js` masih
`video: null`, **satu meja penuh kartu tidak merespons klik sama sekali** dan
halamannya terasa rusak. Sejak ada tahap sorot (§2.6b), yang muncul pertama
bukan videonya melainkan siapa pengirimnya, dan itu tetap ada isinya. Yang
dimatikan sekarang cuma tombol **putar** di panel sorot.

> Catatan sejarah yang tetap berlaku kalau `disabled` dipakai lagi di tempat
> lain: **pakai `aria-disabled`, jangan `disabled`.** Tombol `disabled` di
> Chrome tidak menerima event pointer → `:hover` (highlight) nyangkut, tidak
> hilang saat kursor pergi.

**Seret tidak boleh terhitung klik.** Elemen `button` tetap memunculkan event
`click` saat tombol dilepas, walaupun pointernya baru saja menyeret kartu
sejauh setengah layar — jadi menyeret kartu ikut membuka panel sorotnya.
Dibedakan dari **jarak pointer**: `onPointerDown` mencatat titiknya,
`onClick` mengukur `hypot` ke titik lepas, dan lebih dari `AMBANG_SERET`
(6px) diabaikan.

Bukan dari flag `onDragStart`/`onDragEnd` Motion: urutan `dragEnd` terhadap
`click` tidak dijamin, jadi flag semacam itu harus dibersihkan lewat
`setTimeout` dan rapuh. Jarak selalu benar.

Satu kasus yang wajib dikecualikan: **`e.detail === 0` berarti ditekan dari
keyboard** (Enter/Space). Di situ `clientX/Y` bernilai 0, jadi pengukuran
jarak akan menganggapnya seret dan kartu tidak akan pernah bisa dibuka
dengan keyboard.

**Simpangan seret harus dinolkan saat kartu terangkat.** Kartu yang sudah
diseret meninggalkan `transform: translate(...)` pada dirinya sendiri. Saat
panel sorot mengambil alih `layoutId`-nya, proyeksi layout Motion menulis
transform-nya **sendiri** ke elemen yang sama; keduanya bertumpuk, dan saat
panel ditutup kartunya terbang **dua kali lipat** simpangannya — keluar
frame. Gejalanya: seret kartu jauh, klik, tutup → kartunya melesat entah ke
mana.

Perbaikannya — **simpangan dipindah lapis, bukan dibuang.** `x`/`y` dipegang
eksplisit lewat `useMotionValue` (bukan dibiarkan internal Motion). Saat prop
`terangkat` menyala, nilainya diserahkan ke pembungkusnya lewat `onGeser`
lalu dinolkan di kartunya. Kartu itu **pulang ke titik jatuhnya**, bukan ke
petak asalnya, tapi simpangan itu sekarang tinggal di lapis yang **tidak**
dipakai proyeksi layout — jadi tidak ada lagi dua transform di satu elemen.

`Pesan.jsx` menyimpannya di state `geser` (`{ [id]: {x, y} }`) dan
**menjumlahkannya**, bukan mengganti, supaya seret kedua menumpuk di atas
yang pertama. Nilainya lalu dijumlah dengan `sibak` di `animate` pembungkus.

Serah-terimanya lewat **`useEffect`, bukan di dalam handler klik**, dan itu
disengaja: efek pasif berjalan **setelah** efek layout, jadi Motion sempat
mengukur kartu di posisi seretnya dan panelnya terbang dari tempat kartu itu
dijatuhkan. Selisih satu frame antara "kartu dinolkan" dan "pembungkus
digeser" tidak terlihat karena kartunya sedang `visibility: hidden`.

---

## 2.6 Halaman `Pesan`

`src/pages/Pesan.jsx`

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import PageShell from '../components/PageShell.jsx'
import Kartu from '../components/Kartu.jsx'
import Pemutar from '../components/Pemutar.jsx'
import { messages } from '../data/messages.js'
import { scatterOf, tiltOf } from '../lib/scatter.js'
import { tapPress } from '../lib/motion.js'
import { useIsDesktop } from '../hooks/useIsDesktop.js'
import { useProgress } from '../hooks/useProgress.js'

const ADA_VIDEO = messages.filter((m) => m.video !== null).map((m) => m.id)

export default function Pesan() {
  const desktop = useIsDesktop()
  const navigate = useNavigate()
  const { dibuka, tandai, tandaiSemua, jumlah } = useProgress()
  const [aktif, setAktif] = useState(null)

  const buka = (pesan) => {
    setAktif(pesan)
    tandai(pesan.id)
  }

  const lanjut = () => {
    const i = messages.findIndex((m) => m.id === aktif.id)
    const berikut = messages.slice(i + 1).find((m) => m.video !== null)
    if (berikut) buka(berikut)
    else setAktif(null)
  }

  /* Lewati bagian video: tandai semua video yang ADA sebagai dibuka
     (ini yang membuka kunci /penutup), tutup overlay, ke /surat. */
  const lewati = () => {
    tandaiSemua(ADA_VIDEO)
    setAktif(null)
    navigate('/surat')
  }

  return (
    <PageShell tanpaGeser className="relative">
      {/* DIPERBARUI: judulnya sekarang "21 wishes for 21st birthday" (sama
          dengan judul `/` dan `/penutup`). Karena jauh lebih panjang dari
          "21 pesan", ukurannya di-`clamp` dan sisi kanan diberi `shrink-0`
          supaya counter + "lewati" tidak terdorong keluar layar sempit —
          yang mengalah selalu judulnya. */}
      <header className="pointer-events-none sticky top-0 z-20 flex items-baseline justify-between gap-4 p-5">
        <h1 className="h-display text-[clamp(0.95rem,3.6vw,1.5rem)] leading-tight">
          21 wishes for 21st birthday
        </h1>
        <div className="pointer-events-auto flex shrink-0 items-center gap-4">
          <p className="text-sm tabular-nums text-muted">
            {jumlah} / {messages.length} dibuka
          </p>
          <motion.button
            {...tapPress}
            onClick={lewati}
            aria-label="Lewati semua video, langsung ke surat"
            className="tap link-garis text-sm text-muted"
          >
            lewati
          </motion.button>
        </div>
      </header>

      {desktop ? (
        <div className="relative h-[calc(100dvh-5rem)] w-full">
          {messages.map((m) => {
            const s = scatterOf(m.id)
            return (
              <div
                key={m.id}
                className="absolute"
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  zIndex: s.z,
                  rotate: `${s.rot}deg`,
                }}
              >
                <Kartu
                  pesan={m}
                  sudahDibuka={dibuka.has(m.id)}
                  bisaDiseret
                  onBuka={buka}
                />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 px-5 pb-24">
          {messages.map((m) => (
            <div key={m.id} style={{ rotate: `${tiltOf(m.id)}deg` }}>
              <Kartu
                pesan={m}
                sudahDibuka={dibuka.has(m.id)}
                bisaDiseret={false}
                onBuka={buka}
              />
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {aktif && (
          <Pemutar
            pesan={aktif}
            onTutup={() => setAktif(null)}
            onLanjut={lanjut}
            onLewati={lewati}
          />
        )}
      </AnimatePresence>
    </PageShell>
  )
}
```

**Catatan `rotate` sebagai style:** di wadah luar, bukan di `motion.button`.
Kalau rotasi ada di elemen yang sama dengan `layoutId`, Motion akan
mencoba menganimasikannya bersama layout dan hasilnya berputar aneh saat
memuai jadi layar penuh.

**Catatan `PageShell tanpaGeser`:** alasan yang sama menuntut `/pesan` tidak
pakai transisi geser-`y` bawaan `PageShell`. `y` pada `motion.main` induk
membuat pengukuran layout `layoutId` 21 kartu meleset saat mount → kartu
glitch/melompat. `tanpaGeser` (§1.11) menjadikannya opacity murni.

**Judul header = jalan pulang ke `/`.** `<h1>` membungkus `<Link to="/">`
ber-`link-garis` (coretan tangan saat dihover) dan
`data-kursor-teks="awal"`.

`pointer-events-auto` dipasang **di tautannya saja, bukan di `header`** —
header-nya sengaja `pointer-events-none` supaya tidak menghalangi seret
kartu di belakangnya. Menaruhnya di header akan menghidupkan kembali
masalah yang justru dihindari `pointer-events-none` itu.

**Tombol "lewati" di header — DIHAPUS.** Yang tersisa di header cuma judul
dan counter. Fungsi `lewati()` **tetap ada** karena masih dipakai tombol
"lewati semua" di dalam overlay `Pemutar` (§2.7): menandai **semua video
yang ADA** sebagai dibuka lalu ke `/surat`; efek sampingnya kunci `/penutup`
ikut terbuka (lihat `CLAUDE.md` → keputusan di luar brief).

Jalan ke `/surat` tetap dua: **amplop di ujung meja** (§2.6b/07-tumpuk) dan
**"lewati semua"** di dalam pemutar. Jadi menghapus tombol header tidak
membuat siapa pun terjebak.

`header` tetap `pointer-events-none` supaya tidak menghalangi seret kartu di
belakangnya. Counter-nya sekarang teks biasa — tidak perlu bungkus
`pointer-events-auto` lagi karena tidak ada yang bisa diklik di sana.

---

## 2.6b Tahap sorot — kartu keluar dari tumpukan dulu

**Klik kartu TIDAK langsung membuka video.** Ada satu tahap di antaranya
(`src/components/Sorot.jsx`), supaya tiap pesan diperkenalkan dulu, bukan
langsung dilempar ke pemutar:

1. Kartu diklik → **tetangganya menyibak**, minggir menjauh darinya.
2. Sekelilingnya **meredup**.
3. Kartu itu sendiri **terangkat ke tengah** dan membesar (`layoutId`).
4. Isinya muncul: nomor + "pesan dari" + **nama pengirim**, dan **cuplikan
   videonya** (bisu, berulang, tanpa kontrol).
5. Tombol **putar** → baru masuk `Pemutar` (§2.7). **kembali** / Esc / klik
   peredup → kartu terbang balik ke tumpukan.

**Kartu asal disembunyikan** selama panelnya terangkat. `layoutId` **tidak**
menyembunyikannya sendiri — panel dan kartu dua elemen berbeda yang keduanya
tetap terpasang, jadi tanpa ini kartunya terlihat masih tergeletak di
tumpukan padahal "sudah diangkat".

Caranya lewat **`opacity` di `animate`**, bukan `visibility: hidden` di
`style`, dan bukan `display: none` (yang itu menghapus kotak layout-nya
sehingga Motion tak bisa mengukur ke mana panel harus pulang).

**Dua arahnya tidak simetris** (`opasitasKartu()`), dan di situ letak
kerapiannya:

| Arah | Transisi opacity | Alasan |
|---|---|---|
| Menyembunyikan (panel naik) | `duration: 0` | Panelnya berangkat dari kotak yang persis sama, jadi tidak ada yang perlu ditutupi. Diberi durasi sedikit saja, selama itu kartu masih tergambar di petaknya sementara panelnya sudah melayang pergi — **itulah kembaran yang terlihat saat mengklik**. |
| Memunculkan (panel pulang) | `duration: 0.1`, `delay: 0.03` | Motion memasang proyeksi layout kartu di efek layout commit yang sama. Tanpa jeda ±1 frame itu, ada peluang kartu tergambar sekejap di **petak asalnya** sebelum proyeksinya terpasang — kembaran saat menutup. Jedanya menutup peluang itu tanpa menyisakan lubang yang terasa. |

Ini juga alasan kenapa `opacity` **harus dikecualikan dari pegas** lewat
transisi per-properti: pegas punya ekor panjang, dan kartu yang memudar
perlahan sambil terbang adalah bayangan versi lain lagi. Pengecualiannya
hanya dipasang setelah `sudahMasuk` — kalau dipasang sejak awal, jeda tangga
deal masuk ikut hilang.

> Pelajarannya, dan ini berlaku untuk semua serah-terima `layoutId` di
> proyek: **yang ditinggalkan harus hilang seketika, yang menerima boleh
> menyusul.** Fade dua arah selalu menghasilkan dua benda tergambar
> bersamaan di dua tempat.

**Bayangan panel dibatasi** (`blur 50px`, dulu 80px). Motion mengoreksi skala
`box-shadow` selama animasi layout, tapi koreksinya tidak sempurna untuk blur
sebesar itu: sepanjang penerbangan bayangannya melar dan terbaca seperti noda
gelap yang mengekor kartunya.

**Sibakan — `sibakOf(pusat, s, id)` di `lib/scatter.js`.** Dihitung dari
koordinat sebar (persen), **bukan** `getBoundingClientRect`: posisinya sudah
diketahui tanpa menyentuh DOM, jadi menghitung 21 kartu sekaligus tidak
memicu layout thrashing. Radius 38 (satuan persen sebar), dorongan maks 96px,
meluruh linier.

**Pusatnya TENGAH MEJA (`{x: 42, y: 38}`), bukan posisi kartu yang diklik.**
Panelnya mendarat di tengah layar, jadi ruang yang perlu dikosongkan ada di
tengah. Versi pertama memakai posisi kartu asal, dan hasilnya kartu yang
menyibak berada jauh dari yang sedang dilihat — terbaca seperti kartu acak
bergerak sendiri, bukan seperti memberi jalan. Keluarannya **px, bukan persen** — `x`/`y` Motion memakai
lebar elemen sendiri untuk persen, jadi persen di sini berarti "persen lebar
kartu" dan dorongannya jadi tidak konsisten antar-ukuran layar.
Kartu yang nyaris setumpuk persis (jarak < 1) tidak punya arah; tanpa
penanganan khusus mereka diam di tempat dan tetap menutupi yang disorot —
jadi diberi arah tetap dari hash id-nya.

**Meredup lewat SATU overlay tinta, bukan `opacity` per kartu.** Ini
konsekuensi langsung dari §2.8b: di atas taplak kotak-kotak, apa pun yang
pucat atau tembus pandang terbaca rusak. Overlay solid `bg-ink` yang
di-animasikan ke `0.62` aman; 21 kartu semi-transparan tidak.

**Tiga jebakan `layoutId` di sini, semuanya sudah kena:**

1. **Panel `Sorot` sengaja tanpa `exit`.** Kartu di meja masih terpasang dan
   memegang `layoutId` yang sama. Begitu panel lepas seketika, kartu itulah
   yang mengambil alih dan terbang balik ke tumpukan — animasi baliknya
   gratis. Kalau panel diberi `exit`, ia bertahan beberapa ratus ms dan untuk
   sesaat **ada dua elemen ber-`layoutId` sama**; Motion menganimasikan
   keduanya dan hasilnya berbayang.
2. **Peredupnya tinggal di `Pesan.jsx`, bukan di dalam `Sorot`.** Peredup
   butuh `exit` supaya memudar halus. Kalau ia satu komponen dengan panel,
   `AnimatePresence` menahan **seluruh** `Sorot` selama peredup memudar — dan
   panel ber-`layoutId` itu ikut tertahan, menimpa kartu yang sedang terbang
   balik. Dua `AnimatePresence` terpisah.
3. **`setSorot(null)` + `setAktif(pesan)` dalam satu handler.** React
   menggabungkannya jadi satu commit, jadi `Sorot` lepas dan `Pemutar`
   terpasang di frame yang sama dan `layoutId`-nya berpindah mulus. Dipisah
   jadi dua render, kartu akan sempat terbang balik ke meja dulu.

**`sudahMasuk`.** Transisi pembungkus kartu berganti dari "masuk" (berdurasi
+ berjeda tangga) ke pegas sibakan setelah kartu terakhir mendarat
(`onAnimationComplete` di kartu ke-21). Tanpa penanda ini, kartu kembali ke
posisinya dengan jeda sampai 0,9 detik saat sorot ditutup.

Cuplikan video **wajib `muted`** — tanpa itu browser menolak `autoPlay`.
Kalau `video === null`, yang tampil fotonya + label "videonya menyusul".

**Kunci scroll lewat `useKunciScroll()`, bukan `body.style.overflow` mentah.**
`overflow: hidden` saja menghilangkan scrollbar, area konten melebar selebar
scrollbar itu (±15px di Windows), dan **seluruh halaman melompat** ke kanan
saat overlay dibuka lalu melompat balik saat ditutup — paling terasa waktu
kartu terbang kembali ke tumpukan. Hook-nya mengukur
`window.innerWidth − documentElement.clientWidth` lalu menggantinya dengan
`padding-right` sebesar itu, jadi lebar konten tidak berubah. Nilai lama
disimpan dan dikembalikan (bukan diset string kosong) supaya dua overlay yang
tumpang-tindih tidak saling menghapus. `Pemutar` memakai hook yang sama —
sebelumnya ia punya bug yang persis sama.

## 2.7 Teknik 4 — kartu melebar jadi halaman

Masuk dari tombol **putar** di tahap sorot, bukan langsung dari kartu.
Yang harus terjadi, berurutan:

1. Elemen ber-`layoutId` yang sama muncul sebagai overlay.
2. Motion mengukur posisi kartu asal dan posisi tujuan (layar penuh), lalu
   memuaikannya. Kita tidak menulis animasinya — kita cuma memberi
   `layoutId` yang cocok.
3. Setelah muai selesai, video fade in di tengah.
4. Pindah ke pesan berikutnya: **warna latar melebur, tidak berkedip.**

Poin 4 adalah yang paling mudah salah. Kalau overlay di-unmount lalu
di-mount ulang, akan ada satu frame krem di antaranya — itu kedipan.
Solusinya: **overlay tetap ter-mount**, hanya `backgroundColor` yang
dianimasikan Motion (`animate`, bukan key baru).

`src/components/Pemutar.jsx`

```jsx
import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { bgHex, onHex } from '../lib/colors.js'
import { DUR, EASE, tapPress } from '../lib/motion.js'

export default function Pemutar({ pesan, onTutup, onLanjut, onLewati }) {
  const [muaiSelesai, setMuaiSelesai] = useState(false)
  const videoRef = useRef(null)
  const sentuhX = useRef(0)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onTutup()
      if (e.key === 'ArrowRight') onLanjut()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onTutup, onLanjut])

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
      onLayoutAnimationComplete={() => setMuaiSelesai(true)}   /* satu arah saja — lihat catatan */
      onTouchStart={(e) => { sentuhX.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        const d = e.changedTouches[0].clientX - sentuhX.current
        if (d < -60) onLanjut()
        if (d > 60) onTutup()
      }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-5"
      style={{ color: onHex(pesan.warna) }}
    >
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={muaiSelesai ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: DUR.enter, ease: EASE.in, delay: 0.05 }}
        className="italic-accent text-[clamp(2rem,8vw,4.5rem)] leading-none"
      >
        {pesan.nama}
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={muaiSelesai ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: DUR.enter, ease: EASE.in, delay: 0.12 }}
        className="w-full max-w-[min(46rem,92vw)] overflow-hidden rounded-2xl p-2"
        style={{ background: 'rgba(255,255,255,0.28)' }}
      >
        {muaiSelesai && pesan.video && (
          <video
            ref={videoRef}
            src={pesan.video}
            controls
            playsInline
            preload="none"
            autoPlay
            onEnded={onLanjut}
            className="aspect-video w-full rounded-xl bg-black/10"
          />
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={muaiSelesai ? { opacity: 1 } : {}}
        transition={{ duration: DUR.enter, ease: EASE.in, delay: 0.2 }}
        className="flex items-center gap-3"
      >
        <motion.button
          {...tapPress}
          onClick={onTutup}
          aria-label="Tutup"
          className="tap grid place-items-center rounded-full px-5"
          style={{ background: 'rgba(255,255,255,0.28)' }}
        >
          tutup
        </motion.button>

        <motion.button
          {...tapPress}
          onClick={onLanjut}
          aria-label="Pesan berikutnya"
          className="tap grid place-items-center rounded-full px-5"
          style={{ background: 'rgba(255,255,255,0.28)' }}
        >
          berikutnya
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
```

**Kotak video pakai `rgba(255,255,255,0.28)`, bukan warna solid** — supaya
otomatis menyesuaikan diri ke warna latar apa pun tanpa lima varian.

> ⚠️ **Aturan ini BERLAKU untuk bidang/kotak, TIDAK untuk tombol.**
>
> Dulu tombol ikut memakai putih transparan dengan alasan yang sama. Di
> atas warna kartu yang pekat, putih 32% tidak terbaca sebagai tombol —
> terbaca sebagai tombol yang **pudar/nonaktif**. Tombol harus terlihat
> bisa ditekan; bidang latar tidak.
>
> Gantinya `background: var(--color-bg)` (krim **solid**). Itu tetap **satu
> nilai untuk kelima warna kartu** — tidak melanggar semangat aturan
> aslinya — dan teksnya otomatis gelap karena panelnya sudah mengoper
> `color: onHex(warna)` yang diwarisi tombolnya. Lihat tombol "putar" di
> `Sorot.jsx`.

### Kontrol pemutar dibuat sendiri, bukan `controls` bawaan

Dulu `<video controls>`. Diganti karena kontrol bawaan browser tampil beda
di tiap mesin dan tidak mengikuti bahasa visual situs — bagian paling polos
di seluruh situs.

Yang dibangun: klik video = putar/jeda, tombol putar besar di tengah saat
jeda, garis progres yang bisa diklik untuk melompat, **Spasi** = putar/jeda
(`preventDefault` supaya halaman di belakangnya tidak ikut ter-scroll).

Empat hal yang menentukan:

- **Progres ditulis LANGSUNG ke DOM lewat rAF, bukan `setState`.** Ini
  pelajaran yang sama dengan scramble (05-pembuka §5.6.5): yang dibayar
  bukan efeknya sendiri, melainkan seluruh pohon yang ikut ter-render — dan
  di sini pohonnya termasuk elemen `<video>`. Me-render ulang `<video>` tiap
  frame adalah hal terakhir yang kita mau.
- **rAF, bukan event `timeupdate`.** `timeupdate` cuma menyala ~4×/detik;
  garis yang melompat empat kali sedetik terbaca patah.
- **`scaleX`, bukan `width`.** Properti komposit murni, jadi pembaruan tiap
  frame tidak memicu layout.
- **Klik-untuk-melompat WAJIB ada** begitu `controls` dilepas — tanpa itu
  video tidak bisa diulang atau dilewati sebagiannya sama sekali. Wadah
  target kliknya dibuat setinggi 1,6rem walau garisnya cuma 3px; target 3px
  praktis mustahil dikenai.

**Yang hilang bersama `controls`:** pengatur volume. Diterima — volume
sistem/perangkat menanganinya, dan tombol mute situs hanya untuk musik latar
(yang memang sudah otomatis di-*duck* saat video berjalan).

Tombolnya: **"berikutnya" krim solid** (aksi utama), "tutup" dan "lewati
semua" jadi tautan. Krim solid, bukan putih transparan — lihat peringatan
tombol vs bidang di atas.

**Catatan `onLayoutAnimationComplete`:** callback ini bisa terpanggil lebih dari
sekali (tiap kali Motion menghitung ulang layout elemen), dan hanya terpanggil di
elemen yang *masuk*, bukan yang keluar. Karena kita hanya memakainya untuk
`setMuaiSelesai(true)` — satu arah, tidak pernah kembali `false` — pemanggilan
berulang tidak berbahaya. Jangan pakai callback ini untuk logika dua arah.

**`preload="none"`** dan render `<video>` hanya setelah `muaiSelesai`.
Ini yang mencegah 21 player dimuat sekaligus — dan bahkan satu player pun
tidak mulai mengunduh sampai kartunya benar-benar dibuka.

**`onEnded={onLanjut}`** membuat 21 pesan bisa ditonton berturut-turut
tanpa menyentuh apa pun.

**Tombol "lewati semua"** ditaruh di bawah baris tombol, bukan sebaris —
supaya tidak setara bobotnya dengan "berikutnya". Fungsinya sama dengan
tombol "lewati" di header `/pesan` (`onLewati` yang sama): tandai semua
video yang ADA, tutup, ke `/surat`. Muncul hanya setelah `muaiSelesai`
seperti kontrol lain.

---

## 2.8 Cloudinary

### Yang harus dilakukan manusia (sekali, ±15 menit)

1. Daftar di cloudinary.com. Gratis, tanpa kartu kredit.
2. Catat **cloud name** dari dashboard. Itu satu-satunya nilai yang dibutuhkan
   kode — bukan API key, bukan secret.
3. Buat folder bernama `20sept` (organisasi saja — lihat catatan mode folder
   di bawah, folder ini mungkin **tidak** muncul di URL-nya).
4. Seret video ke folder itu, lalu **ganti Public ID-nya** (bukan cuma nama
   tampilan) jadi `01` sampai `21` sesuai id di `messages.js`. Di panel detail
   asset, field-nya persis bernama **"Public ID"** — beda dari nama file
   asli. Rename lewat klik-kanan di Media Library kadang cuma mengubah nama
   tampilan, Public ID-nya tetap nama asli dari kamera; **selalu cek field
   Public ID-nya**, jangan asumsi dari nama yang terlihat di daftar.

### Yang bisa dikerjakan Claude Code

Karena URL Cloudinary deterministik dari nama file, `messages.js` bisa diisi
tanpa memanggil API apa pun:

```
https://res.cloudinary.com/<cloud-name>/video/upload/f_auto,q_auto/01
```

> ⚠️ **Tanpa prefix folder di URL — verifikasi lapangan, bukan asumsi.**
> Cloudinary sekarang punya dua mode folder: **fixed folders** (lama, folder
> = bagian dari Public ID, URL-nya `folder/nama`) dan **dynamic folders**
> (baru, folder cuma label organisasi di panel; Public ID-nya **tidak**
> menyertakan folder). Akun yang dipakai proyek ini "Dynamic folders" —
> dicek langsung dengan `curl`/`Invoke-WebRequest`: `…/upload/20sept/03` →
> 404, `…/upload/03` → 200. Kalau nanti proyek pindah ke akun bermode fixed
> folders, baris ini perlu dikembalikan menyertakan folder. **Selalu
> verifikasi satu URL nyata dulu sebelum mengisi banyak `SUDAH_ADA`** —
> jangan percaya pola URL dari ingatan/dokumentasi lama begitu saja.

**Jangan pasang Cloudinary SDK di proyek ini.** Tidak ada unggahan dari sisi
klien, tidak ada API yang dipanggil saat runtime. Ini cuma URL.

#### `src/data/video.js` — satu-satunya berkas yang diubah

Kolom `video` tidak lagi ditulis tangan 21 kali. `messages.js` sekarang cuma
menyimpan `id`, `nama`, `warna`; `foto` dan `video` diturunkan dari id lewat
`urlFoto()` / `urlVideo()`. Yang perlu diisi tinggal **dua baris**:

```js
export const CLOUD = 'nama-cloud-anda'   // 1 — dari dashboard Cloudinary
export const SUDAH_ADA = [1, 2, 3]       // 2 — nomor yang sudah diunggah
```

`SUDAH_ADA = ISI_SEMUA` kalau ke-21 sudah naik. Nomor di luar daftar
otomatis `video: null` → kartunya tetap bisa dibuka, menampilkan
"videonya menyusul", dan tidak punya tombol putar. Jadi **boleh diunggah
bertahap** tanpa menyentuh kode lain.

`CLOUD` kosong = semua `null`, artinya keadaan sekarang berjalan normal
tanpa konfigurasi apa pun. Cloud name memang nilai publik — bukan API key,
bukan secret — jadi aman ada di kode klien.

**Dua kartu boleh berbagi satu video.** Almi dan Kakak terekam bersama dalam
satu video, jadi ada baris ketiga yang opsional:

```js
export const IKUT_VIDEO = {
  14: 13, // Kakak ikut video Almi
}
```

Kartunya **tidak** digabung jadi satu, cuma videonya yang sama: sebaran 21
sel di `scatter.js` dan peta `warna` di `messages.js` dihitung untuk 21
kartu, jadi menghapus satu kartu akan merusak keduanya. Tiap nama tetap
punya kartunya sendiri; yang diklik mana pun, videonya sama.

`urlVideo()` mengalihkan id **sebelum** mengecek `SUDAH_ADA`, jadi yang
diunggah dan didaftarkan hanya nomor berkasnya (`13`). Mendaftarkan `14`
tidak ada efeknya, dan `ISI_SEMUA` tetap benar tanpa penyesuaian.
Konsekuensi yang disengaja: rantai "lanjut" (§ autoplay) memutar video itu
dua kali, sekali untuk Almi dan sekali untuk Kakak.

#### Foto — Cloudinary juga, tapi aturannya BERBEDA dari video

> ⚠️ **Aturan "jangan pakai `w_`" di atas itu KHUSUS VIDEO.** Video ditagih
> per detik transcoding, jadi tiap dimensi baru dibayar lagi. **Gambar**
> ditagih per 1000 transformasi — praktis gratis di skala ini. Untuk foto,
> `w_` justru **wajib**. Ini satu-satunya tempat kedua aturan bertabrakan.

Alasan foto tidak boleh dipasang mentah: berkas dari HP itu 3000–4000px /
3–8MB. Tanpa `w_`, browser mengunduh 5MB hanya untuk menggambar kartu
selebar 208px — 21 kartu ≈ 100MB per kunjungan, lebih berat dari seluruh
efek di situs ini digabung.

**Terukur di akun ini** (`Invoke-WebRequest -Method Head` dengan header
`Accept` seperti browser):

| URL | Hasil |
|---|---|
| `…/image/upload/sample` | JPEG **117,4 KB** |
| `…/image/upload/f_auto,q_auto,c_fill,g_auto,w_460,ar_3:4/sample` | WebP **28,2 KB** |

`g_auto` dan `ar_` sudah dicek **aktif** di akun gratis ini.

**Public ID-nya berawalan**, tidak polos seperti video:

| Slot | Public ID | Lebar diminta | Rasio |
|---|---|---|---|
| Muka kartu `/pesan` | `foto-01` … `foto-21` | `w_460` | `ar_3:4` |
| Panel sorot | *(foto yang sama)* | `w_760` | `ar_4:3` |
| Foto di badan surat | `surat-01`, `surat-02`, … | `w_1000` | — (ikut aslinya) |

Awalannya wajib: mode **dynamic folders** membuat Public ID **datar** (tanpa
folder), jadi `01` sebagai video dan `01` sebagai foto akan membingungkan
manusia walaupun Cloudinary sendiri memisahkan `/image/` dan `/video/`.

**Daftarnya di `src/data/video.js`:** `FOTO_ADA` (kartu) dan
`SURAT_FOTO_ADA` (surat) — pola yang sama dengan `SUDAH_ADA` untuk video.
Kosong = tidak ada yang dirender; kartu jatuh ke huruf inisial.

**Lebar diminta EKSPLISIT di tiap pemakaian**, tidak ada nilai default.
`messages.js` sengaja **tidak** lagi menyimpan `foto`: satu URL untuk semua
tempat berarti ada yang kebesaran, dan itu justru masalah yang mau
dihindari. `Kartu` minta 460px, `Sorot` minta 760px — dari foto sumber yang
sama.

**`null` dicek di render**, bukan dibiarkan jadi `<img src={null}>` yang
memicu 404 lalu jatuh ke `onError`. 21 permintaan gagal itu ongkos yang
tidak perlu.

#### `alat/siapkan-video.ps1`

Menyiapkan 21 berkas mentah untuk diunggah: mengurutkan, menamai ulang jadi
`01.mp4`…`21.mp4` (penamaan dua digit inilah yang membuat seluruh skema URL
di atas bekerja tanpa API), dan **mengompres hanya yang di atas 100 MB** —
mengompres ulang video yang sudah cukup kecil cuma membuang kualitas.
Berkas asli tidak disentuh.

```cmd
powershell -File alat\siapkan-video.ps1 -Sumber "D:\video-mentah"
```

Kalau `ffmpeg` belum ada, skripnya tetap menyalin dan menamai ulang, lalu
melaporkan berkas mana yang masih terlalu besar.

### Batas yang nyata

```
Video maksimal        100 MB per file   ← ini yang paling sering kena
Kredit gratis         25 per bulan
1 kredit              1 GB storage, atau 1 GB bandwidth,
                      atau 500 detik video SD, atau 250 detik video HD
```

25 kredit lebih dari cukup untuk situs ini. Yang perlu diperhatikan cuma
batas 100 MB: video HP 1080p60 bisa melewatinya di atas satu menit.

Kalau ada file yang lewat, kompres dulu sebelum unggah — ini bisa dikerjakan
Claude Code dengan `ffmpeg`:

```cmd
ffmpeg -i mentah.mp4 -vf "scale=-2:1080" -c:v libx264 -crf 26 -preset slow -c:a aac -b:a 128k 01.mp4
```

`-crf 26` biasanya membawa video satu menit dari ~180 MB ke ~25 MB tanpa
perbedaan yang terlihat di HP. Naikkan ke 28 kalau masih terlalu besar.

### Catatan transformasi

`f_auto,q_auto` membuat Cloudinary mengirim format dan kualitas terbaik per
browser. Untuk video ini adalah **transcoding**, dan dihitung per detik
(500 detik SD atau 250 detik HD per kredit) — bukan per 1000 transformasi
seperti gambar. Hanya dibayar sekali per video; hasilnya di-cache.

21 video × 60 detik HD ≈ 5 kredit sekali bayar. Aman.

**Jangan menambahkan `w_` atau `h_`.** Video sudah direkam dari HP, dan tiap
dimensi baru adalah transcoding baru yang dibayar lagi.

## 2.8b Latar & bayangan — "kartu di atas meja"

Ditambahkan setelah tahap awal, untuk menguatkan kesan kartu sebagai objek
fisik di permukaan — **tanpa motif/taplak** (yang akan bersaing dengan 21
kartu warna-warni).

- **`Vignette.jsx`** — `<div fixed inset-0 z-0>`, `pointer-events-none`,
  anak pertama `PageShell` di `/pesan`. Satu properti `background` bertumpuk:
  1. `radial-gradient` vignette (tepi `rgba(46,42,38,0.13)` → tengah terang).
  2. Dua `repeating-linear-gradient` coral (`rgba(255,122,89,0.11)`, garis
     48px/48px, silang) → **gingham taplak piknik** ukuran sel 48px. Dibuat
     CSS, bukan gambar, jadi warna persis `coral` dan opacity gampang
     diatur. Terlihat lembut supaya tidak menenggelamkan 21 kartu.
  3. `var(--color-bg)` krem sebagai dasar.

  Kalau ingin taplak lebih tegas: naikkan `0.11` → `0.16–0.20`. Lebih besar
  petaknya: ubah `48px`/`96px` proporsional.
- **Bayangan reaktif seret** — `Kartu` dapat `whileDrag` (Motion):
  `scale 1.07` + `boxShadow` memanjang (`0 30px 55px -12px …`, dari base
  `0 10px 30px -12px …`). Kartu terasa terangkat dari meja saat diseret,
  turun lagi saat dilepas. Bergerbang `bisaDiseret` (desktop saja).

- **Kartu dibagikan saat masuk** — pembungkus tiap kartu jadi `motion.div`.
  Desktop: `initial {opacity:0, y:-50, scale:0.86}` → `animate` ke posisi,
  `EASE.overshoot`, stagger **linier** `i * 0.045` (± ritme membagi kartu,
  ~0,95s total). Dianimasikan di **pembungkus**, bukan `Kartu` (yang
  ber-`layoutId`); begitu deal selesai transform pembungkus = identitas,
  jadi morph kartu→video tetap mengukur posisi benar.
  `reduced` → `initial={false}`.

### Mobile: kartu mendarat saat discroll — `BarisKartu`

> ⚠️ **Diganti.** Mobile dulu ikut pola desktop: semua 21 kartu dianimasikan
> sekaligus saat mount dengan jeda tangga (`min(i*0.045, 0.5)`). Masalahnya
> **15 kartu di bawah lipatan layar sudah SELESAI animasinya sebelum jempol
> sempat menggulir ke sana** — jadi menggulir daftarnya sunyi, tidak ada apa
> pun yang terjadi. Itu sumber rasa "boring"-nya, bukan kurang efek.

Tiap kartu sekarang punya komponennya sendiri (`BarisKartu` di `Pesan.jsx`)
dan menunggu gilirannya: `useInView(ref, { once: true, amount: 0.3 })`.

- **Masuk dari sisi yang SEARAH miringnya** (`tiltOf > 0` → dari kanan).
  Kalau arahnya dilawan, kemiringannya terbaca sebagai kartu yang
  terpelanting, bukan kartu yang diletakkan.
- `rotate` ikut dianimasikan (`miring * 2.4` → `miring`), jadi tidak lagi
  di `style`. Pegas `240/24/0.8` — mendarat lalu diam.
- **`once: true` wajib.** Dianimasikan bolak-balik tiap keluar-masuk layar
  membuat menggulir balik ke atas terasa gelisah, dan di daftar sepanjang
  ini itu cepat melelahkan.
- Saat `tersembunyi` (panel sorot naik), **hanya `opacity` yang dinolkan** —
  posisi & rotasinya dipertahankan. Kartu ini pemegang `layoutId`; kalau
  posisinya ikut berubah, panelnya terbang dari tempat yang salah.
- **`opacity` TIDAK PERNAH dianimasikan di HP** (`transition.opacity =
  { duration: 0 }`). Nilainya tetap dipakai — 0 saat kartunya diangkat panel
  sorot — tapi perpindahannya seketika.

  > ⚠️ Ini keputusan sadar setelah dilaporkan **sering error di HP**.
  > Memudarkan opacity di daftar sepanjang ini rawan: nilainya gampang
  > tersangkut di tengah saat tiga hal saling memotong — animasi masuk,
  > sembunyi-untuk-sorot, dan kemunculan kembali — dan yang tersisa kartu
  > setengah transparan yang tidak pulih. Geser + rotasi + skala sudah
  > membawa seluruh gerak masuknya, jadi tidak ada yang hilang.
  > `opasitasKartu` (§2.6b) sekarang **khusus desktop**; jangan dipakai
  > lagi di cabang mobile.

**Kilau menyapu di HP** — `.kartu-kilau` selama ini terkunci di
`@media (hover: hover)`, jadi di layar sentuh **tidak pernah jalan sama
sekali**. Sekarang `BarisKartu` mengoper `sapu` → `data-sapu` di `Kartu`, dan
CSS menjalankan `@keyframes kartu-sapu` sekali saat kartunya mendarat.
Dimatikan saat `reduced`.

> **Catatan riwayat:** bagian ini dulu mendokumentasikan "fokus saat hover"
> (`.meja-pesan:has(.kartu-inersia:hover) .kartu-inersia:not(:hover)` →
> memudarkan kartu lain). Aturan itu **tidak ada di `index.css`** — sudah
> dibuang bersama eksperimen hover lain (lihat catatan "dicoba lalu dibuang"
> di §2.5). Class `.meja-pesan` masih terpasang di JSX tapi tidak dipakai
> CSS mana pun. Kalau nanti dipasang lagi: **jangan lewat `:hover`** —
> elemennya bisa diseret, lihat peringatan `[data-sorot]` di §2.5.

## 2.9 Yang Sengaja Tidak Ada di Halaman Ini

- **Tidak ada magnetik** (teknik 6). Anggaran halaman sudah penuh dengan
  teknik 3 dan 4. Ditambahkan di tahap 6, dan kalau ternyata terasa terlalu
  ramai, tidak usah dipasang di kartu — hanya di tombol.
- **Tidak ada video looping sebagai preview.** Foto statis, sudah final.
- **Tidak ada seret di mobile.** Seret berebut dengan scroll vertikal, dan
  di layar 375px kartu tidak punya ruang untuk pindah ke mana pun.

---

## Cek Sebelum Lanjut ke Tahap 3

- [ ] 21 kartu tampil, tiap kartu warnanya sesuai `messages.js`.
- [ ] Tidak ada `<img>` yang 404 berulang di Network tab — `onError` hanya
      sekali per kartu.
- [ ] Seret kartu di desktop: kartu miring saat cepat, kembali lurus saat
      berhenti. Lepaskan — skew kembali ke nol, tidak nyangkut.
- [ ] Saat diseret: kartu terangkat (scale + bayangan memanjang), turun
      lagi saat dilepas.
- [ ] Vignette: sudut viewport sedikit lebih gelap, tengah terang. Halus,
      tidak terlihat sebagai "bingkai".
- [ ] Masuk `/pesan`: 21 kartu "dibagikan" satu-satu ke posisi sebarnya,
      bukan muncul serentak. Setelah selesai, klik kartu → morph ke video
      **tanpa** melompat.
- [ ] **Seret kartu lalu lepas: panel sorot TIDAK terbuka.** Termasuk seretan
      pendek (~10px). Klik biasa (tanpa geser) tetap membuka.
- [ ] Tab ke sebuah kartu lalu tekan Enter: **tetap terbuka** (jalur
      keyboard tidak ikut tersaring ambang jarak).
- [ ] **Seret kartu jauh → klik → tutup.** Kartu pulang **ke titik
      jatuhnya**, tenang, tidak melesat keluar frame. Uji dari beberapa arah
      seret (atas, bawah, pojok) dan pada kartu yang berbeda.
- [ ] Seret lagi kartu yang sama setelah ditutup: simpangannya **menumpuk**
      dari titik jatuh terakhir, bukan melompat balik ke petak asal.
- [ ] Hover kartu: stiker kursor menuliskan **nama pengirimnya**, bukan
      "klik!". Ganti-ganti kartu cepat — namanya ikut berganti.
- [ ] **Seret satu kartu jauh melintasi kartu-kartu lain, lalu lepas.**
      Tidak boleh ada satu pun kartu yang tertinggal tersorot (lebih terang
      + tepi cahaya).
- [ ] Versi yang paling sering lolos dari uji di atas: **gerakkan kursor
      pelan-pelan melewati 3–4 kartu DULU** (biarkan tiap kartu sempat
      menyala), baru mulai menyeret. Kartu-kartu yang dilewati itulah yang
      dulu nyangkut — bukan kartu yang diseret.
- [ ] Hover sebuah kartu, lalu **klik** untuk membuka panel sorot, lalu
      tutup. Kartunya tidak boleh kembali dalam keadaan menyala.
- [ ] Sapukan kursor cepat melintasi meja: **tidak pernah ada dua kartu
      menyala bersamaan**. Kalau ada, invarian satu-sorot bocor.
- [ ] Saat kartu sedang diseret, kartu itu **tidak** tersorot (hanya
      terangkat + bayangan panjang dari `whileDrag`).
- [ ] Hover satu kartu di desktop: kartu membesar sedikit (`whileHover`),
      kilau menyapu, dan kartu jadi lebih terang + ada tepi cahaya +
      bayangan lebih dalam. Kartu lain **tidak tersentuh**.
- [ ] `reduced-motion`: kartu langsung di posisi, tanpa deal. Hover tetap
      meredupkan (instan).
- [ ] Scroll kartu keluar layar sambil buka Performance tab: `rAF` berhenti.
      Kalau masih ada frame terus-menerus, `IntersectionObserver` tidak jalan.
- [ ] Klik kartu: kartu di **tengah meja menyibak menjauh**, layar meredup,
      dan kartu itu terangkat ke tengah — bukan langsung jadi pemutar video.
- [ ] Posisi asal kartu yang diangkat **kosong** — tidak ada kartu kembar
      yang tetap tergeletak di tumpukan.
- [ ] Buka-tutup sorot **berkali-kali berturut-turut** (10×, kartu yang
      berbeda): **dua-duanya** bersih. Saat mengklik, tidak ada kartu
      tertinggal memudar di petaknya sementara panel sudah naik. Saat
      menutup, tidak ada kilasan kartu di petak asalnya. Juga tidak ada noda
      bayangan gelap yang mengekor. Ini bug bergantung timing frame — sekali
      coba tidak cukup untuk menyatakan lolos.
- [ ] Kartu yang nyaris setumpuk persis di tengah **tetap ikut minggir**
      (bukan diam menutupi panel).
- [ ] Panel sorot: nomor, "pesan dari", nama, dan cuplikan video yang
      berjalan sendiri tanpa suara & berulang. Kalau `video: null` →
      fotonya + "videonya menyusul".
- [ ] Tombol "putar" **pekat**, bukan putih tembus pandang — uji di kelima
      warna kartu (coral, kuning, sage, langit, lilac). Kalau di salah satu
      warna terlihat pudar/nonaktif, latarnya kembali ke `rgba` transparan.
- [ ] Buka lalu tutup sorot sambil memperhatikan tepi kiri layar: **tidak ada
      geseran horizontal** sama sekali. Kalau bergeser ±15px, kompensasi
      scrollbar di `useKunciScroll` tidak jalan. Uji di jendela yang isinya
      cukup panjang untuk punya scrollbar.
- [ ] Klik "kembali" / Esc / klik area gelap: kartu **terbang balik** ke
      posisi semula di tumpukan (bukan menghilang di tempat), tanpa bayangan
      ganda, dan kartu lain kembali ke tempatnya tanpa jeda tangga.
- [ ] Klik "putar": panel sorot langsung jadi pemutar penuh **tanpa** kartu
      sempat terbang balik ke meja dulu.
- [ ] Klik kartu → putar: warnanya memuai dari posisi kartu, bukan fade dari
      tengah. Kalau fade, `layoutId` tidak cocok.
- [ ] Pemutar: **tidak ada kontrol bawaan browser** lagi. Klik video →
      putar/jeda; tombol putar besar muncul hanya saat jeda; Spasi juga
      putar/jeda dan **halaman di belakangnya tidak ikut ter-scroll**.
- [ ] Garis progres bergerak **mulus**, bukan melompat ~4×/detik. Kalau
      melompat, sumbernya `timeupdate`, bukan rAF.
- [ ] Klik di sembarang titik pada garis progres → video melompat ke situ.
      Uji juga di HP: targetnya harus mudah dikenai jari (wadahnya 1,6rem,
      bukan setinggi garisnya).
- [ ] Buka Performance tab saat video berjalan: **tidak ada render React
      berulang** — progres ditulis langsung ke DOM.
- [ ] Klik "berikutnya": latar **melebur** dari warna A ke warna B.
      Rekam layar dan periksa frame per frame — tidak boleh ada satu frame
      krem.
- [ ] Tutup, reload: kartu yang tadi dibuka masih bertanda sudut terlipat.
- [ ] Header `/pesan` cuma berisi judul + counter — **tidak ada tombol
      "lewati"** lagi di sana.
- [ ] Klik judul "21 wishes for 21st birthday" → kembali ke `/`. Dihover:
      coretan tangan muncul di bawahnya, kursor jadi stiker "awal".
- [ ] Seret kartu yang posisinya **di belakang header** (baris paling atas
      meja): masih bisa diseret, tidak tertahan header. Kalau tertahan,
      `pointer-events-auto` kepasang di `<header>`, bukan di tautannya.
- [ ] "lewati semua" (di dalam overlay pemutar) tetap jalan: ke `/surat`,
      counter jadi penuh untuk video yang ADA, dan `/penutup` terbuka.
      Reload — status tetap.
- [ ] Header tidak menghalangi seret kartu di belakangnya.
- [ ] 375px: tumpukan vertikal, tiap kartu miring berbeda, tidak ada
      scroll horizontal, tombol tutup ≥44×44px.
- [ ] 375px, scroll seluruh daftar 21 kartu: **tidak ada sudut kartu yang
      menabrak/menimpa kartu tetangganya**, walaupun keduanya miring ke arah
      berlawanan. Kalau ada yang tumpang tindih, `gap-9` di cabang mobile
      `Pesan.jsx` sudah tidak cukup lagi (mis. lebar kartu berubah) —
      naikkan gap-nya.
- [ ] 375px: **tiap kartu mendarat saat digulir ke layar**, bukan sudah
      diam menunggu. Gulir pelan dari atas ke bawah — kartu ke-10, ke-15,
      ke-21 semuanya masih punya animasi masuk sendiri.
- [ ] Kartu masuk dari sisi yang **searah** miringnya (doyong kanan →
      datang dari kanan), lalu kilau menyapu sekali melintasinya.
- [ ] Gulir balik ke atas: kartu yang sudah mendarat **tidak animasi ulang**
      (`once: true`).
- [ ] Buka lalu tutup panel sorot di HP: kartunya kembali ke posisi & miring
      yang sama, tidak melompat atau mengulang animasi masuknya.
- [ ] **Tidak ada satu pun kartu yang setengah transparan, di mana pun.**
      Ini dua sumber berbeda dan keduanya harus bersih:
      (a) **transisi** — buka-tutup panel sorot berkali-kali cepat sambil
      menggulir di HP; opacity di HP memang tidak ditransisikan, jadi kartu
      hanya boleh pekat penuh atau hilang sama sekali;
      (b) **keadaan diam** — kartu yang videonya belum diunggah harus tetap
      **pekat penuh**. Uji khusus saat sebagian video sudah naik dan
      sebagian belum (mis. `SUDAH_ADA = [3, 9, 16]`), karena dulu justru
      kondisi itulah yang memucatkan 18 kartu sekaligus.
- [ ] `prefers-reduced-motion` di HP: kartu langsung di tempat, tidak ada
      geseran masuk maupun kilau.
- [ ] Geser ke kiri di HP → pesan berikutnya. Geser ke kanan → tutup.
- [ ] `prefers-reduced-motion`: skew mati, muai jadi instan, situs tetap
      bisa dipakai sepenuhnya.
