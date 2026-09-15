# Tahap 5 — Pembuka: Formasi 21 + Teks Teracak

Situs langsung dibuka dengan kartu terbang masuk dan merakit angka "21".
Setelah formasi selesai, judul tersingkap di belakangnya dengan teks teracak.
Tidak ada hero terpisah.

Teknik: **2 (kartu merakit formasi)** dan **1 (teks teracak)**. Dua — anggaran
penuh. Tombol "masuk" tetap boleh magnetik (tahap 6): itu mikro-interaksi
pada satu elemen, bukan teknik halaman.

**Komponen `Formasi21` di dokumen ini dipakai ulang di tahap 8.** Jangan
menulis versi kedua di sana.

---

## 5.1 Geometri

21 kartu, 21 sel. Grid 8 kolom × 7 baris:

```
. # # # . . . #
# . . . # . . #
. . . . # . . #
. . . # . . . #
. . # . . . . #
. # . . . . . #
# # # # # . . #
```

Angka "2" memakai 14 sel (kolom 0–4), angka "1" memakai 7 sel — **batang
lurus penuh di kolom 7, baris 0–6**, tinggi persis sama dengan "2".
Jumlahnya persis 21 — bukan kebetulan, itu yang membuat formasi ini masuk akal.

Tidak ada flag/serif di ujung atas "1". Dengan hanya 21 kartu, pilihannya:
"1" pendek dengan flag, atau "1" tinggi-penuh tanpa flag. Dipilih yang
kedua — di samping "2" dan di latar blur 30%, batang lurus tetap terbaca
sebagai "21", dan tinggi yang sejajar lebih penting daripada serif kecil
yang tak terlihat.

`src/lib/formasi.js`

```js
/* [kolom, baris] pada grid 8x7, 0-indeks. Urutan array = urutan kartu id 1..21. */
export const SEL = [
  [1, 0], [2, 0], [3, 0], [0, 1], [4, 1],
  [4, 2], [3, 3], [2, 4], [1, 5], [0, 6],
  [1, 6], [2, 6], [3, 6], [4, 6], [7, 0],
  [7, 1], [7, 2], [7, 3], [7, 4], [7, 5],
  [7, 6],
]

export const KOLOM = 8
export const BARIS = 7

/* Sel grid untuk kartu ke-i. CSS Grid 1-indeks. */
export function selOf(i) {
  const [cx, cy] = SEL[i] ?? [0, 0]
  return { col: cx + 1, row: cy + 1 }
}

/* Titik masuk: offset dari posisi akhir, dalam satuan viewport.
   Bergantian kiri-kanan, tinggi acak tapi deterministik. */
export function masukOf(i) {
  const dariKiri = i % 2 === 0
  const acak = ((i * 2654435761) >>> 0) / 4294967296
  return {
    x: dariKiri ? '-120vw' : '120vw',
    y: `${-30 + acak * 60}vh`,
    rot: (dariKiri ? -1 : 1) * (18 + acak * 22),
  }
}
```

**Posisi akhir diatur CSS Grid, bukan aritmatika persen.** Ini disengaja.
Persen pada `x`/`y` Motion dihitung terhadap **ukuran elemen itu sendiri**,
bukan wadahnya — jadi `x: "50%"` menggeser kartu setengah lebar kartu, bukan
ke tengah kotak. Menghitungnya manual bisa, tapi tiap perubahan ukuran kartu
akan merusak seluruh formasi diam-diam. Grid tidak punya masalah itu.

Yang dianimasikan hanya `x`/`y` sebagai **offset dari posisi grid**, dari
titik masuk ke `0`. Itu murni `transform` — tidak memicu layout.

Kenapa `i % 2` boleh di sini padahal dilarang untuk warna: ini **arah masuk**,
dan bergantian kiri-kanan memang yang diminta brief. Yang dilarang adalah
`i % 5` untuk warna, karena di sana pola berulang justru terlihat.

---

## 5.2 Komponen `Formasi21`

Dipakai dua kali: tahap 5 (`varian="masuk"`) dan tahap 8 (`varian="pulang"`).
Perbedaannya hanya urutan, dan apakah kartu tampil sebagai sudah-dibuka.

Dua prop ambient opsional, keduanya default `false` dan saling lepas:
- `hidup` — nafas + tilt (dipakai `/penutup`, lihat `docs/08` §8.5.1).
- `senggol` — kursor mendorong kartu (dipakai `/`, lihat §5.6.4 di bawah).

Struktur internal: tiap kartu adalah `<KartuFormasi>` — `motion.span` luar
(grid + dorongan `senggol`) membungkus `motion.span` dalam (animasi rakit).
Tanpa kedua prop, tidak ada listener terpasang dan hasilnya identik dengan
versi awal.

`src/components/Formasi21.jsx`

```jsx
import { useCallback, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { messages } from '../data/messages.js'
import { bgClass } from '../lib/colors.js'
import { selOf, masukOf, KOLOM, BARIS } from '../lib/formasi.js'
import { EASE, DUR } from '../lib/motion.js'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

/* Stagger mengecil: jeda antar kartu makin rapat.
   21 x 80ms linier = 1,7 detik dan terasa lamban.
   Kurva kuadrat selesai dalam ~0,95 detik tapi tetap terbaca satu per satu. */
const jeda = (n, total = 0.95) => total * Math.pow(n / 20, 2)

export default function Formasi21({ varian = 'masuk', dibuka, onSelesai }) {
  const reduced = useReducedMotion()
  const sudahLapor = useRef(false)

  /* Ref, bukan state. Fungsi yang dioper ke setState WAJIB murni — React
     StrictMode memanggilnya dua kali di development, jadi onSelesai() di
     dalam updater akan terpanggil dua kali dan scramble restart. */
  const lapor = useCallback(() => {
    if (sudahLapor.current) return
    sudahLapor.current = true
    onSelesai?.()
  }, [onSelesai])

  useEffect(() => {
    if (reduced) lapor()
  }, [reduced, lapor])

  return (
    <div
      aria-hidden
      className="pointer-events-none relative mx-auto grid w-[min(78vw,44rem)] aspect-[8/7] gap-[0.6%]"
      style={{
        gridTemplateColumns: `repeat(${KOLOM}, 1fr)`,
        gridTemplateRows: `repeat(${BARIS}, 1fr)`,
      }}
    >
      {messages.map((m, i) => {
        const { col, row } = selOf(i)
        const awal = masukOf(i)
        const sudah = dibuka?.has(m.id)

        /* Kartu terakhir yang mendarat: urutan dibalik di varian "pulang". */
        const n = varian === 'pulang' ? 20 - i : i
        const terakhir = n === 20

        return (
          <motion.span
            key={m.id}
            style={{ gridColumn: col, gridRow: row }}
            initial={
              reduced
                ? false
                : { x: awal.x, y: awal.y, rotate: awal.rot, opacity: 0 }
            }
            animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            transition={{
              duration: DUR.page,
              ease: EASE.in,
              delay: reduced ? 0 : jeda(n),
            }}
            onAnimationComplete={() => { if (terakhir) lapor() }}
            className={[
              'block h-full w-full rounded-[0.3rem]',
              bgClass(m.warna),
              sudah ? 'saturate-[0.5] opacity-75' : '',
            ].join(' ')}
          />
        )
      })}
    </div>
  )
}
```

Empat hal yang penting:

**Wadahnya `grid` dengan `aspect-[8/7]`.** Rasio kotaknya harus sama dengan
rasio grid, kalau tidak sel jadi tidak persegi dan angka 21-nya miring.

**Kartu mengisi selnya penuh (`h-full w-full`), `gap` yang membuat celah.**
Jangan mengatur ukuran kartu dengan `w-[...]` — itu memutus hubungan antara
ukuran kartu dan ukuran grid, dan formasi akan pecah di lebar layar tertentu.

**`lapor()` dijaga `useRef`, bukan `useState`.** Dua alasan. Pertama,
`onAnimationComplete` memang terpanggil tiap kali sebuah animasi selesai —
kalau target `animate` berubah karena re-render, dia jalan lagi. Kedua, dan
ini yang lebih halus: fungsi yang dioper ke `setState` **wajib murni**, dan
React StrictMode sengaja memanggilnya dua kali di development untuk
membuktikannya. Memanggil `onSelesai()` dari dalam updater berarti scramble
akan restart di tengah jalan — dan hanya di development, yang membuatnya
sangat membingungkan untuk dilacak. Ref tidak punya masalah itu.

**`aria-hidden`.** Formasi ini murni dekoratif. Pembaca layar harus mendengar
judulnya, bukan 21 kotak tanpa nama.

---

## 5.3 Teks teracak — ditulis sendiri

GSAP punya ScrambleTextPlugin tapi itu plugin berbayar. Yang kita butuh
muat dalam satu hook.

Cara kerjanya: tiap karakter punya waktu "mengendap" sendiri, tersebar di
sepanjang durasi. Sebelum waktunya, karakter itu diganti huruf acak. Sesudah,
dia jadi huruf aslinya dan tidak berubah lagi.

> **Hanya HURUF yang diacak.** Angka, tanda baca, dan spasi langsung tampil
> sebagai dirinya sendiri (`bisaDiacak = /[A-Za-z]/`). Dua alasan: `GLYPH`
> isinya huruf semua — mengacak "2" jadi huruf itu kategori yang salah — dan
> lebih penting, **angka yang teracak terbaca sebagai galat**, bukan sebagai
> tulisan yang sedang terbentuk. Prinsip ini awalnya cuma diterapkan manual
> di `/penutup` (angka "21" dikeluarkan dari scramble); sekarang berlaku di
> semua tempat, jadi judul seperti **"21 wishes for 21st birthday"** aman.

> ⚠️ **JANGAN panggil `useScramble` langsung di komponen halaman. Selalu
> lewat `TeksAcak.jsx`.**
>
> Hook ini memanggil `setState` tiap ~45ms. Kalau dipakai langsung di
> `Pembuka`/`Penutup` (dan dulu memang begitu), tiap tick me-render ulang
> **seluruh pohon halaman itu**:
>
> | Halaman | Yang ikut ter-render tiap tick |
> |---|---|
> | `/` | `Formasi21` — **21 `KartuFormasi`**, tiap satunya punya `useMotionValue`/`useSpring` — plus `CahayaSapu`, `Grain`, `TombolMasuk` |
> | `/penutup` | **21 `<li>` nama** + kartu ucapan + `LatarLebur` |
>
> Judulnya dua baris = **dua** scramble jalan bersamaan → sampai **~44
> render per detik** atas pohon sebesar itu, selama ~2 detik, **tepat
> bersamaan dengan formasi yang sedang bergerak dan blur yang sedang
> beranimasi**. Itu yang terasa sebagai "`/` berat dan lag".
>
> `TeksAcak` cuma pembungkus daun (`<span>{tampil}</span>`), tapi itu yang
> mengurung `setState`-nya: tick-nya hanya me-render ulang satu `<span>`,
> sisa halaman tidak tahu-menahu.

`src/hooks/useScramble.js`

```js
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './useReducedMotion.js'

const GLYPH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

export function useScramble(teks, { jalan = true, durasi = 1900, tickMs = 45 } = {}) {
  const reduced = useReducedMotion()
  const [tampil, setTampil] = useState('')
  const timer = useRef(0)

  useEffect(() => {
    if (!jalan) return

    if (reduced) {
      setTampil(teks)
      return
    }

    const huruf = [...teks]
    /* Waktu mengendap per karakter: mengikuti arah baca, dengan sedikit
       ketidakteraturan supaya tidak terlihat seperti garis lurus. */
    const endap = huruf.map((c, i) => {
      if (c === ' ' || c === '\n') return 0
      const dasar = (i / huruf.length) * durasi * 0.72
      const acak = ((i * 2654435761) >>> 0) / 4294967296
      return dasar + acak * durasi * 0.28
    })

    const mulai = performance.now()

    const tick = () => {
      const t = performance.now() - mulai

      setTampil(
        huruf
          .map((c, i) => {
            if (c === ' ' || c === '\n') return c
            if (t >= endap[i]) return c
            return GLYPH[(Math.random() * GLYPH.length) | 0]
          })
          .join('')
      )

      if (t < durasi) {
        timer.current = setTimeout(tick, tickMs)
      } else {
        setTampil(teks)
      }
    }

    tick()

    return () => clearTimeout(timer.current)
  }, [teks, jalan, reduced, durasi, tickMs])

  return tampil
}
```

**`setTimeout` 45ms, bukan `requestAnimationFrame`.** Scramble pada 60fps
terlihat seperti noise TV — terlalu cepat untuk dibaca sebagai huruf. Sekitar
22 kali per detik justru membuat tiap huruf acak sempat terlihat, dan biayanya
seperempatnya.

**Durasi 1900ms melebihi pagu 1200ms di `CLAUDE.md`, dan itu benar.**
Scramble bukan perpindahan elemen — tidak ada yang menunggunya selesai, dan
di bawah 1,2 detik efeknya tidak sempat terbaca. Pagu 1200ms berlaku untuk
elemen yang bergerak.

**Lebar teks harus dikunci.** Huruf acak punya lebar berbeda dari huruf
asli, jadi judul akan bergoyang selama scramble. Perbaikannya di CSS:

```css
.scramble {
  font-variant-numeric: tabular-nums;
  /* Kunci tinggi baris supaya pergantian huruf tidak menggeser baris di bawahnya */
  display: block;
  min-height: 1em;
}
```

Untuk judul dua baris seperti punya kita, kunci per baris — bukan per blok.

---

## 5.4 Halaman Pembuka

> **Teks judul:** `21 wishes` / `for Nailah Adlina` (baris kedua italic
> coral). Sebelumnya `happy birthday` / `Nailah Adlina`.
>
> Halaman ini **sengaja berbeda** dari dua tempat lain yang memakai frasa
> serupa: header `/pesan` dan judul kartu `/penutup` keduanya
> "21 wishes for 21st birthday". Yang di sini menyebut **namanya**, bukan
> ulang tahunnya — ini halaman pembuka, tempat sapaan pada orangnya.
> Jadi kalau frasanya diganti lagi, `/` tidak otomatis ikut dua yang lain.

`src/pages/Pembuka.jsx`

```jsx
import { useState } from 'react'
import { motion } from 'motion/react'
import PageShell from '../components/PageShell.jsx'
import Formasi21 from '../components/Formasi21.jsx'
import TombolMasuk from '../components/TombolMasuk.jsx'
import TeksAcak from '../components/TeksAcak.jsx'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { DUR, EASE } from '../lib/motion.js'

/* CATATAN: `useScramble` TIDAK lagi dipanggil di sini — sekarang lewat
   <TeksAcak>, lihat peringatan di §5.4. Cuplikan di bawah menyisakan bentuk
   lamanya untuk konteks; sumber kebenaran ada di src/pages/Pembuka.jsx. */
export default function Pembuka() {
  const [formasiSelesai, setFormasiSelesai] = useState(false)

  const reduced = useReducedMotion()

  return (
    <PageShell className="relative grid min-h-dvh place-items-center overflow-hidden p-6">
      {/* Formasi mengisi flow dan dipusatkan grid. Saat merakit dia yang
          terlihat (judul masih opacity 0); setelah selesai memudar jadi
          hantu samar + blur supaya tidak mengganggu keterbacaan judul. */}
      <motion.div
        animate={{
          opacity: formasiSelesai ? 0.3 : 1,
          filter: formasiSelesai ? 'blur(3px)' : 'blur(0px)',
        }}
        transition={{ duration: 1.6, ease: EASE.smooth, delay: 0.35 }}
        className="relative z-0"
      >
        <Formasi21 varian="masuk" onSelesai={() => setFormasiSelesai(true)} />
      </motion.div>

      {/* Judul di lapisan depan — tersingkap setelah formasi selesai. */}
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: formasiSelesai ? 1 : 0 }}
        transition={{ duration: DUR.enter, ease: EASE.in }}
        className="h-display pointer-events-none absolute z-10 text-center text-[clamp(2.2rem,9vw,5.5rem)]"
      >
        <span className="scramble block">{baris1}</span>
        <span className="scramble italic-accent block text-coral">{baris2}</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={formasiSelesai ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: DUR.enter, ease: EASE.in, delay: reduced ? 0 : 1.4 }}
        className="absolute bottom-[8vh] z-20"
      >
        <TombolMasuk />
      </motion.div>
    </PageShell>
  )
}
```

Urutannya, dalam detik sejak halaman dibuka:

```
0,00   kartu pertama masuk
0,95   kartu terakhir mendarat, formasi jadi
0,95   scramble mulai, judul mulai muncul
1,30   formasi mulai memudar ke 30% + blur — turun pelan (1,6s)
2,35   scramble baris dua selesai
2,35   tombol "masuk" muncul
2,90   formasi selesai turun ke 30%
```

**Formasi memudar jadi latar, tidak hilang.** Versi pertama memakai 28%
tanpa blur dan turun cepat (1s) — kotak-kotak mendarat persis di atas huruf
dan judul jadi sulit dibaca (lihat screenshot di riwayat). Sekarang: **30%
opacity + `blur(3px)`, transisi 1,6s** yang lebih lambat supaya perpindahan
formasi-jadi-latar terasa disengaja, bukan tiba-tiba redup. Bentuk **21**
tetap kebaca di belakang judul — itu yang memberi tahu ini ulang tahun ke
berapa tanpa satu kata pun.

**Urutan lapisan:** cahaya `z-0`, formasi `relative z-10`, judul
`absolute z-20`, tombol `z-30`, kursor kustom `fixed z-[999]`. Grain
`fixed z-[3]`. Saat merakit, judul masih `opacity: 0` jadi formasi tetap
jadi bintangnya; z-index cuma menentukan siapa di atas setelah keduanya
terlihat.

**Tombol muncul terakhir.** Kalau muncul lebih awal, dia akan ditekan
sebelum judulnya sempat terbaca, dan seluruh pembuka jadi sia-sia.

---

## 5.6 Lapisan ambient — state sebelum klik (tambahan)

Setelah tombol muncul, halaman semula benar-benar diam sampai kursor
menyentuh tombol. Atas permintaan, empat lapisan ambient ditambahkan
(referensi di `docs/00-riset-motion.md` → Daftar Curian). Semua mati /
parkir di `prefers-reduced-motion`; tidak ada `rAF` permanen tanpa gerbang.

Efek "senter" (kolam cahaya menyalakan "21") **sempat dibuat lalu dihapus**
atas permintaan — file `Senter.jsx` sudah tidak ada, formasi kembali redup
rata 0.3.

> **Checkpoint.** `scratchpad/pembuka-pre-senter/` = grain + cahaya + kursor,
> sebelum efek "senggol" §5.6.4.

### 5.6.1 Butir kertas — `Grain.jsx` (statis)

`<div fixed inset-0 z-[3]>` dengan `background-image` data-URI SVG
`feTurbulence` (`baseFrequency 0.9`, 2 oktaf), `opacity 0.085`. Tidak ada
gerak, tidak ada JS runtime — cuma tekstur supaya krem terasa kertas.
(Mulai `0.035`, dinaikkan ke `0.09` karena terlalu tak terasa.)
Dari elvismao (versi jinak, bukan ASCII).

**Blending normal, bukan `mix-blend-multiply`** (lihat §5.6.5). Overlay
ber-blend selebar layar memaksa browser membaca-balik latar di bawahnya
setiap kali ada yang bergerak. Di atas krem terang, noise abu 8,5% lewat
multiply dan lewat alpha biasa nyaris tak terbedakan — jadi biayanya tidak
membeli apa pun.

### 5.6.2 Cahaya hangat menyapu — `CahayaSapu.jsx` (CSS keyframe)

Satu lingkaran `90vmax` radial-gradient `#FFFDF8` → transparan,
`animation: cahaya-sapu 15s ease-in-out infinite alternate` yang menggeser
`translate` + `scale` pelan. Di `absolute inset-0 z-0` di dalam `PageShell`
(`relative` + `overflow-hidden` — clipping-nya memang diinginkan). Murni CSS,
browser menjeda saat tab tak terlihat. `@media (prefers-reduced-motion)` →
`animation: none` + parkir di tengah. Dari ayocin `light-controller`.

**Tanpa `filter: blur(30px)`** — jangan ditambahkan kembali; lihat §5.6.5.
Falloff-nya dibuat halus lewat gradasi itu sendiri (titik tengah di 38% dan
56%), bukan lewat blur.

### 5.6.3 Kursor kustom kontekstual — `KursorKustom.jsx`

Hanya render kalau `usePointerFine() && !useReducedMotion()`. Saat aktif,
menambah class `kursor-kustom-aktif` ke `<html>` (`cursor: none`), dilepas
saat unmount.

**Dipasang di `Layout.jsx`, bukan di halaman** — berlaku di keempat route.
Kalau ikut mount/unmount tiap ganti route, kursor asli berkedip muncul saat
transisi. Class `.kursor-kustom-aktif *` menang atas utility `cursor-*`
Tailwind karena CSS tak-berlapis mengalahkan CSS berlapis di v4.

**`z-[999]` — tertinggi di seluruh aplikasi, dan itu wajib.** Kursor asli
sedang disembunyikan, jadi begitu bentuk ini tertutup sesuatu, pengguna
kehilangan penunjuk sama sekali. Pernah terjadi: `zIndex` kartu di `/pesan`
berasal dari `scatterOf` (5–80) dan berebut di skala yang sama dengan overlay
`fixed`, jadi kartu bernilai 80 menutupi kursor yang waktu itu `z-[70]` —
**dan juga menutupi tombol mute (60)**. Diperbaiki dua sisi: kursor dinaikkan
ke `z-[999]`, dan pembungkus meja kartu diberi `z-0` supaya z kartu terkurung
di konteks penumpukannya sendiri dan tidak pernah bisa naik ke skala overlay.
Aturannya: **z kartu dan z overlay tidak boleh hidup di skala yang sama.**

### `/penutup` dapat bentuk default yang lebih ringan

Bentuk default di halaman lain (makhluk bermata, di bawah) menghitung
sudut/regangan/lirikan mata di **tiap** `pointermove`, dan matanya
berkedip lewat animasi CSS yang berjalan **terus-menerus**. `/penutup` sudah
menumpuk `LatarLebur` (5 lapis wash warna) plus transisi lipat/konfeti dari
`/surat` — jadi kursornya diberi bentuk **titik tinta** polos: satu warna
solid, satu transform saat ditekan, tanpa mata, tanpa animasi berulang.

- `const ringan = pathname.startsWith('/penutup')`, dari `useLocation()`.
- Penghitungan berat (`regangMentah`, `sudut`, `bijiX/Y`) **dilewati sama
  sekali** saat `ringan` — bukan cuma tidak dirender, tapi memang tidak
  dihitung di `pointermove`. Itu yang membuat "lebih ringan" nyata, bukan
  kosmetik.
- Dibaca lewat **`ringanRef`**, bukan langsung dari state `ringan`, dengan
  pola yang sama dengan `varianRef` di versi kertas/ceri sebelumnya: listener
  `pointermove` tidak perlu dipasang ulang tiap pindah halaman.
- Render-nya dua lapis seperti makhluk: elemen luar untuk masuk/keluar
  (`AnimatePresence`), elemen dalam untuk tekan-lepas. Dua motion value
  `scale` pada elemen yang **sama** akan saling menimpa, bukan digabung —
  makanya dipisah jadi dua elemen, sama seperti pola badan/wajah makhluk.
- Warnanya `var(--color-ink)` solid, bukan coral. Coral konsisten dipakai di
  situs untuk "aktif/disorot"; titik ini cuma penunjuk posisi, jadi warna
  netral yang tidak ikut bersaing dengan hover coral 21 nama di halaman ini.

### Bentuk default: bola agar-agar

**`.kursor-bola`, dipakai di `/`, `/pesan`, `/surat`** (sisa route selain
`/penutup`).
Sempat dicoba sobekan kertas (`/`, `/surat`, `/penutup`) + sepasang ceri
(`/pesan`) — dua-duanya dibuang: ikon bergambar di ujung pointer ramai dan
menutupi yang sedang ditunjuk. Yang bertahan adalah bentuk paling sederhana,
dengan karakternya dipindah ke **cara bergeraknya**. Rujukan gerakan:
[Codrops — Custom Cursor Effects](https://tympanus.net/codrops/2019/01/31/custom-cursor-effects/),
[elastic cursor](https://codepen.io/gusevdigital/pen/MWxyXRa),
[Awwwards: Hovers, Cursors & Cute Interactions](https://www.awwwards.com/awwwards/collections/hovers-cursors-and-cute-interactions/).

Bolanya: 24px, isi coral, **garis tinta 1,5px**, dan **dua mata**. Garis tinta
itu bukan hiasan — tanpanya badan coral hilang di atas taplak kotak-kotak
`/pesan` yang juga coral.

**Dua lapis di dalam pembungkus, dan ini yang bikin bisa jalan:**
`.makhluk-badan` memikul semua transform fisik (rotate arah-gerak, `scaleX`/
`scaleY`, `scale` tekan), sementara `.makhluk-wajah` ada **di luar** badan
jadi tidak ikut berputar atau memipih. Kalau wajah ditaruh di dalam badan,
matanya ikut terbalik saat kursor bergerak ke kiri. Ini persis cara
squash-stretch kartun: badan berubah bentuk, wajahnya tidak.

- Mata **melirik ke arah gerak** — manik digeser `x`/`y` maks `BIJI_MAKS`
  2,1px, springnya (`MATA`) sengaja **lebih lambat** dari badan supaya
  terbaca "menyusul melihat", bukan menempel kaku. Kuatnya ikut laju, jadi
  gerakan pelan cuma menggeser sedikit — bukan langsung membelalak.
  Kembali menatap lurus lewat timer diam yang sama dengan regangan.
- **Berkedip berkala** — `@keyframes makhluk-kedip` **3s** pada putih matanya
  (`scaleY 1 → 0.1` di 93%), mata kanan `animation-delay: 0.06s` supaya
  tidak sinkron sempurna. Transform-only pada dua elemen 7px; biayanya dapat
  diabaikan menurut aturan §5.6.5.
- **Terpejam selama tombol ditekan** — state `ditekan` (dari `pointerdown`/
  `pointerup` yang sudah ada; sekali per klik, bukan per frame) memasang
  `data-pejam` di pembungkusnya. CSS-nya **wajib** memakai `animation: none`
  di situ: animasi mengalahkan deklarasi biasa, jadi tanpa itu `scaleY`-nya
  tak akan pernah terpakai. Melepas animasinya mengembalikan nilai dasar, dan
  `transition: transform, background-color 0.11s` yang menutupnya dengan
  halus. Maniknya di-`opacity: 0` — mata terpejam yang maniknya masih
  terlihat sebagai garis gelap terbaca seperti terjepit, bukan terpejam.
- **Garis kelopaknya tinta, bukan putih menipis.** Putih di atas badan coral
  terbaca seperti celah, bukan kelopak. `scaleY(0.22)` dari mata 7,4px =
  garis ~1,6px yang panjangnya persis selebar matanya; dipipihkan lebih jauh
  (mis. `0.08`) garisnya turun di bawah 1px dan hilang.
- Wajahnya diberi `padding-bottom: 2px` — mata yang pas di tengah lingkaran
  terbaca seperti kancing, bukan wajah.

- Posisi: `useMotionValue` x/y di-`set` dari `pointermove`, di-`useSpring`
  dengan preset `POS` (`stiffness 1100`, lag sangat tipis — dinaikkan dari
  500 karena terasa lamban). `fixed left-0 top-0` + spring x/y px.
- **Tiga lapis, tidak boleh digabung**: lapis posisi (`x`/`y`) → lapis
  pemutar (`.kursor-panggung`, `rotate` + `perspective: 600px`) → bentuk.
  Menaruh `rotate` di elemen yang sama dengan `x`/`y` membuat sumbu putarnya
  ikut bergeser; `perspective` di lapis atas akan mendistorsi posisi.
- **Squash-stretch dari kecepatan.** `laju = hypot(dx, dy) / dt`;
  `regang = min(laju * 0.16, 0.42)` lewat spring `KENYAL`, lalu
  `scaleX = 1 + r` / `scaleY = 1 − 0.72r` (`useTransform`) — memanjang searah
  gerak, memipih tegak lurus, volume terasa tetap. Dibagi `dt` supaya sama di
  60Hz dan 120Hz. Timer 90ms mengembalikan ke bulat saat kursor diam.
- **Sudut = arah gerak**, dipasang di `.makhluk-badan` (bukan di panggung),
  `atan2`, diset **langsung tanpa spring**: pada lingkaran polos arah putarnya
  tak terlihat, dan spring pada sudut malah berputar penuh saat melewati
  ±180°. Sudutnya **diakumulasi** (`akum += ((Δ % 360) + 540) % 360
  − 180`); tanpa unwrap ini, gerak yang melewati ±180° membuat bola berputar
  setengah lingkaran. Di bawah `laju > 0.06` sudut lama dipertahankan — di
  situ arahnya cuma derau dan bolanya akan berkedut.
- **Menciut saat ditekan.** `pointerdown` → `scale 0.68`, `pointerup` → `1`,
  lewat spring `KENYAL` yang sama, jadi memantul balik. Ini digabung dengan
  `scaleX`/`scaleY`: Motion menyusun `scale`, `scaleX`, dan `scaleY` sebagai
  properti terpisah, jadi ketiganya boleh dipakai bersamaan.

**Penentuan mode — lewat `pointerover`, bukan `elementFromPoint`.**

> ⚠️ **Diganti sekali.** Versi pertama men-sampling `document.elementFromPoint`
> di dalam `pointermove`, digerbangi jarak minimum (`CEK_JARAK`, 6px) + satu
> `requestAnimationFrame` supaya tidak dipanggil tiap piksel. Cepat, tapi ada
> jeda antara pointer benar-benar masuk sebuah kartu dan mode-nya sempat
> diperbarui — di tumpukan kartu yang rapat, jeda itu kadang cukup untuk
> mode tetap `default` padahal pointer sudah di atas kartu, jadi nama
> pengirimnya tidak muncul di kursor. Diganti ke `pointerover`: event asli
> browser yang justru **untuk ini** — browser sendiri yang melakukan
> hit-test tepat saat elemen yang dihover berganti, jadi tidak perlu
> sampling, tidak perlu jarak minimum, dan lebih murah (cuma terpanggil saat
> elemen berganti, bukan tiap gerakan pointer).

Urutannya, dari `e.target.closest(...)` di listener `pointerover`:

1. `[data-kursor]` eksplisit → saat ini hanya `"judul"`.
2. `a` / `button` / `[role="button"]` **apa pun** → mode `label`. Teksnya
   dari `data-kursor-teks` di elemen itu, default `"klik!"`. Auto-deteksi
   ini yang bikin fitur berlaku sekeliling situs tanpa menandai satu per
   satu. Elemen ber-`aria-disabled="true"` dilewati (tetap bentuk default),
   supaya kontrol yang dimatikan tidak menjanjikan klik.
3. selain itu → bola.

`pointermove` sekarang murni untuk posisi (`mx`/`my`) dan squash-stretch —
tidak lagi ikut menentukan mode.

Ganti bentuk lewat `AnimatePresence` **tanpa** `mode="wait"` — keduanya
menumpuk sesaat di titik yang sama, jadi terasa membalik, bukan menunggu.
`.kursor-panggung` sendiri **tidak** berputar (cuma `perspective`), jadi label
& kaca otomatis tegak tanpa perlu menolkan sudut.

- `.kursor-label` — stiker yang **membalik masuk** (`rotateY: -70 → 0`,
  spring 460/26) dan berhenti miring −4°. Empat `border-radius` berbeda
  supaya terbaca sebagai potongan tangan, bukan pill generik.
  Teks terpasang: `masuk!` (TombolMasuk), `buka!` (Kartu), `baca!` (amplop
  Tumpukan), sisanya `klik!`.
- `.kursor-kaca` — `<h1>` judul `data-kursor="judul"` → **cincin gelap tipis
  30px** (isi transparan, border 1px `rgba(46,42,38,0.5)`) dengan
  `backdrop-filter: blur(2.5px)` → kesan kaca pembesar. Isinya transparan
  supaya huruf yang ditunjuk tetap terbaca. `backdrop-filter` diset **inline** (Lightning CSS
  membuang versi tak-berprefix). Supaya `elementFromPoint` bisa mengenainya,
  `<h1>` diberi `pointer-events` normal + `select-none`.

Dari bryantcodes (#8 Daftar Curian).

### 5.6.4 Kursor menyenggol kartu — prop `senggol` di `Formasi21`

Kartu formasi (yang redup 30% di latar) terdorong menjauh saat titik kursor
lewat, lalu spring balik — seperti menyibak. Hanya di `/` (`Pembuka` mengoper
`senggol`), hanya `pointer:fine && !reduced`.

**Struktur dua lapis per kartu.** `Formasi21` sekarang merender
`<KartuFormasi>` per kartu:
- `motion.span` **luar**: penempatan grid + `x`/`y` dorongan (`useSpring`).
- `motion.span` **dalam**: animasi rakit (`initial`/`animate` dari titik
  masuk). Dua layer transform supaya dorongan tidak bentrok dengan rakitan.

**Satu listener, bukan 21.** `Formasi21` punya satu `pointermove` (di-rAF-
throttle) yang meng-iterasi ref kartu. Pusat kartu di-cache lewat
`ResizeObserver` pada grid (dibaca sekali + tiap resize), jadi `pointermove`
cuma matematika — tidak ada `getBoundingClientRect` per frame. Radius 110px,
dorongan maks 22px, meluruh linier ke tepi radius.

Gerbang: `senggol && usePointerFine() && !useReducedMotion()`. Kalau mati,
`KartuFormasi` luar tidak dapat style `x`/`y`, listener tidak dipasang —
formasi identik dengan sebelum fitur ini. Penutup (`hidup`, tanpa `senggol`)
tidak terpengaruh.

Dari ayocin `ambient-move` (versi reaktif — hanya di titik kursor, berhenti
seketika, bukan loop nafas seperti `/penutup`).

> Dua eksperimen judul dibatalkan (tidak disukai): interaksi hover per-baris
> (`JudulHidup.jsx`) dan pergantian frasa "happy birthday" ↔ "selamat ulang
> tahun" (`FraseAtas.jsx`). Yang dipakai: judul mengubah **bentuk kursor
> kustom** jadi cincin kaca-pembesar saat dilewati — lihat §5.6.3.

### 5.6.5 Kenapa `/` sempat berat — dan aturannya sekarang

`/` menumpuk lima efek ambient di satu layar, dan tiga di antaranya membayar
biaya per-frame yang tidak terlihat dari kodenya. Yang sudah diperbaiki:

| Penyebab | Kenapa mahal | Perbaikan |
|---|---|---|
| `.cahaya-sapu` `filter: blur(30px)` di elemen `90vmax` yang keyframe-nya ber-`scale()` | Layer ber-filter **tidak bisa** sekadar diregangkan compositor — tiap skala baru memaksa raster ulang. Blur 30px di area ~1200×1200 dihitung ulang terus, 15 detik, selamanya. Ini yang terbesar. | Blur dibuang; falloff dipindah ke gradasi (titik tengah 38% & 56%) |
| `Grain` `mix-blend-multiply` selebar layar | Blend memaksa baca-balik latar tiap kali ada yang bergerak di bawahnya | Blending normal, `opacity` 0.09 → 0.085 |
| `.kursor-bola` / `.kursor-label` `filter: drop-shadow` | Bola di-`scale` tiap frame; drop-shadow raster ulang tiap perubahan | `box-shadow` (bentuknya bulat/rounded, hasilnya sama) |
| `setTampil(true)` di tiap `pointermove` | Memanggil React tiap gerakan mouse, padahal nilainya berubah sekali | Dijaga `tampilRef` |
| `elementFromPoint` tiap frame | Memaksa hit-test; mode tidak mungkin berubah dalam beberapa piksel | Diganti event `pointerover` (§5.6.3) |
| `useScramble` dipanggil **di komponen halaman** | `setState` tiap ~45ms × **dua** baris judul me-render ulang seluruh pohon `/` — termasuk 21 `KartuFormasi` — sampai ~44×/detik selama ~2 detik, persis saat formasi & blur sedang beranimasi | Dikurung di komponen daun `TeksAcak.jsx`; tick-nya hanya me-render satu `<span>` |

**Aturan yang berlaku ke depan di halaman ini:**

1. **Jangan pasang `filter` pada elemen besar yang di-`transform`.** Blur +
   transform = raster ulang tiap frame. Kalau butuh tepi lembut, buat lembut
   di gradasinya.
2. **Jangan pakai `mix-blend-*` pada overlay selebar layar.**
3. **`box-shadow`, bukan `filter: drop-shadow`,** untuk apa pun yang bergerak
   atau berskala — kecuali bentuknya memang tak bisa diwakili box-shadow.
4. **Jangan `setState` di dalam `pointermove`** tanpa penjaga ref.
5. **Kurung `setState` beruntun di komponen daun.** Apa pun yang mengubah
   state berulang kali (scramble, pengetikan, hitung mundur) harus tinggal
   di komponen sekecil mungkin — kalau tidak, React me-render ulang seluruh
   pohon halaman di tiap tick, dan ongkosnya ditentukan oleh **tetangganya**,
   bukan oleh efeknya sendiri. Ini yang membuat efek teks yang murah terasa
   sangat mahal hanya karena kebetulan bersebelahan dengan 21 kartu.

Biaya sisa yang **disengaja**: `filter: blur(3px)` pada pembungkus formasi di
`Pembuka.jsx`. Ini melanggar aturan 1 dan memang masih dibayar tiap kartu
tergeser efek senggol — tapi areanya (~700×600) dan radiusnya (3px) dua orde
lebih murah daripada kasus `.cahaya-sapu`. Kalau `/` masih terasa berat di
mesin lemah, **inilah tuas berikutnya**: buang `blur(3px)`-nya dan biarkan
`opacity 0.3` saja yang meredupkan formasi.

---

## 5.7 Transisi klik "masuk" — tinta membludak — `TransisiContext.jsx`

Klik "masuk" → lingkaran warna `coral` tumbuh dari titik tengah tombol
(`scale 0→1`, 0,5s `EASE.in`), menutup layar, `navigate('/pesan')`, lalu
lingkaran itu **larut** (`exit` opacity `[1,1,0]`, tahan 0,4s lalu fade
0,5s) mengungkap halaman pesan. Ekonya teknik "kartu melebar jadi halaman"
(§2.7) — situs punya satu bahasa transisi.

`/pesan` memakai `PageShell tanpaGeser` (§1.11) supaya 21 kartu ber-`layoutId`
tidak glitch saat halaman muncul di balik lingkaran.

- `TransisiProvider` di `Layout` (dalam Router, untuk `useNavigate`).
  `mulai(tujuan, x, y)` dipanggil `TombolMasuk` dengan titik tengah tombol
  dari `getBoundingClientRect`.
- Diameter = `2,3 × jarak-ke-sudut-terjauh`, jadi selalu menutup penuh dari
  posisi mana pun.
- `z-[100]` — di atas tombol mute dan semua isi halaman. Satu-satunya yang
  tetap di atasnya: kursor kustom (`z-[999]`).
- `pindahRef` menjaga `navigate` + `setBloom(null)` hanya jalan sekali
  (`onAnimationComplete` juga menyala saat `exit` selesai).
- `prefers-reduced-motion` → `mulai` langsung `navigate`, tanpa lingkaran.
- `TombolMasuk` sekarang `nyalakan()` **tanpa await** (play() tetap di dalam
  gestur) lalu `mulai()` — navigasi ditunda ke transisi, bukan ke promise
  audio.

---

## 5.5 Kalau `prefers-reduced-motion` aktif

`Formasi21` langsung memanggil `onSelesai()` dan merender kartu di posisi
akhir tanpa animasi masuk. `useScramble` langsung mengembalikan teks utuh.
Delay `1.4` pada tombol diganti `0` lewat `reduced ? 0 : 1.4` — sudah masuk
di kode §5.4. Menunggu 1,4 detik tanpa ada apa pun yang bergerak terasa
seperti situs yang macet.

Formasi tetap ikut memudar ke 10% + blur di reduced-motion (itu perubahan
`opacity`/`filter`, bukan perpindahan) supaya judul tetap bersih.

---

## Cek Sebelum Lanjut ke Tahap 6

- [ ] Kartu masuk bergantian kiri-kanan, bukan semua dari satu sisi.
- [ ] Formasi akhir terbaca sebagai **21**. Foto layarnya, tunjukkan ke
      orang lain tanpa memberi tahu — kalau mereka bilang "21", benar.
- [ ] Tidak ada kartu yang tumpang tindih atau keluar dari kotak formasi.
- [ ] Ubah lebar jendela dari 375px sampai 1920px perlahan: bentuk 21 tetap
      utuh dan proporsional di semua lebar. Kalau pecah di lebar tertentu,
      ada ukuran kartu yang dipatok manual, bukan mengikuti grid.
- [ ] Scramble mulai **setelah** kartu terakhir mendarat, bukan bersamaan.
- [ ] Judul tidak bergoyang lebar selama scramble.
- [ ] Huruf yang sudah mengendap tidak berubah lagi. Rekam layar dan
      periksa — kalau ada huruf yang "kembali acak", `endap` salah.
- [ ] **Angka "21" tidak pernah teracak** — sudah jadi angka sejak frame
      pertama, hanya hurufnya yang berputar.
- [ ] Baris kedua di `/` berbunyi **"for Nailah Adlina"**, bukan
      "for 21st birthday" (itu milik `/pesan` & `/penutup`).
- [ ] Tombol "masuk" muncul terakhir, dan menyalakan musik (tahap 3).
- [ ] 375px: kotak formasi muat tanpa scroll horizontal, kartunya masih
      terlihat sebagai kartu bukan titik.
- [ ] `prefers-reduced-motion`: formasi langsung utuh, judul langsung
      terbaca, tombol langsung ada. Tidak ada jeda kosong.
- [ ] Reload berkali-kali: pembuka **selalu** tampil penuh. Tidak ada
      bypass localStorage — itu keputusan yang sudah diambil.
- [ ] Kursor kustom di atas judul: bola berganti jadi cincin gelap tipis;
      teks di dalam lingkaran sedikit kabur (kaca pembesar). Balik jadi bola
      saat keluar. Uji juga di Firefox (backdrop-filter).
- [ ] Klik "masuk": lingkaran coral membludak dari tombol, menutup layar,
      lalu larut mengungkap `/pesan`. Tidak ada kedip krem, **dan 21 kartu
      tidak melompat/glitch** saat muncul. Klik dari posisi tombol yang
      berbeda (setelah magnetik menggesernya) — tetap menutup penuh.
- [ ] Reduced-motion: klik "masuk" langsung pindah, tanpa lingkaran.
- [ ] Grain: krem terasa bertekstur, tapi teks judul tetap tajam terbaca.
- [ ] Cahaya sapu: bergeser sangat pelan, tidak pernah "berkedip" atau
      terlihat sebagai lingkaran berbatas.
- [ ] Kursor kustom: bola mengikuti dengan lag pendek, **memanjang searah
      gerak** dan bulat lagi begitu berhenti (tidak terparkir lonjong).
- [ ] **Matanya tetap tegak** saat badan meregang miring — gerakkan ke kiri,
      ke atas, menyerong: mata tidak pernah terbalik atau ikut memipih.
- [ ] Manik melirik ke arah gerak lalu kembali ke tengah saat berhenti.
      Diamkan: matanya berkedip tiap ~3 detik, kanan-kiri tidak sinkron.
- [ ] Tekan-tahan tombol mouse: matanya **terpejam** dan tetap terpejam
      selama ditahan (tidak berkedip-kedip melawan animasi), lalu membuka
      halus saat dilepas.
- [ ] Gerakkan mouse memutar penuh, lalu menyilang kiri↔kanan berkali-kali:
      bola **tidak pernah berputar setengah lingkaran** (unwrap sudut) dan
      tidak berkedut saat digerakkan sangat pelan (ambang laju).
- [ ] Tekan tombol mouse di area kosong: bola menciut lalu **memantul**
      balik, bukan kembali datar.
- [ ] Di atas "masuk": bola berganti jadi stiker **"masuk!"** yang membalik
      masuk, berhenti sedikit miring dan **tegak** (tidak ikut sudut arah
      gerak). Keluar-masuk cepat berkali-kali: tidak ada dua bentuk yang
      tersangkut bersamaan.
- [ ] Pindah antar-halaman: bentuknya sama di `/`, `/pesan`, `/surat`, dan
      tidak ada kedip kursor asli saat transisi.
- [ ] Masuk `/penutup`: bola bermata **berganti jadi titik tinta polos**
      (tanpa mata, tanpa squash-stretch saat digerakkan cepat). Kembali ke
      `/surat`: bola bermata muncul lagi.
- [ ] Di `/penutup`, klik & tahan di area kosong: titiknya menciut lalu
      kembali, sama seperti tekan pada bola di halaman lain.
- [ ] Hover "kembali ke pesan" di `/penutup`: tetap jadi label stiker
      seperti tautan lain — hanya bentuk *default*-nya yang berbeda.
- [ ] `/pesan`: bola tetap terbaca di atas taplak kotak-kotak coral (garis
      tintanya yang menjamin ini) — cek juga saat lewat di atas kartu coral.
- [ ] `/pesan`: hover kartu → **nama pengirimnya** (semua kartu bisa dibuka,
      termasuk yang videonya belum ada). Hover amplop → "baca!".
- [ ] Hover kartu yang tertumpuk rapat di meja `/pesan` (banyak kartu
      bertindihan): nama muncul **seketika** saat pointer masuk kartu, tanpa
      jeda yang terasa, dan tidak pernah "nyangkut" di bola default padahal
      pointer sudah di atas kartu.
- [ ] `/surat` & `/penutup`: kembali ke kertas; tombol/link apa pun →
      "klik!" tanpa perlu ditandai satu per satu.
- [ ] Senggol: gerakkan kursor melewati area "21" — kartu terdekat
      terdorong menjauh lalu spring balik, mulus, tidak menyentak.
- [ ] Senggol di `pointer: coarse` / reduced: kartu tidak bergerak sama
      sekali, tidak ada listener `pointermove` dari `Formasi21`.
- [ ] Resize jendela saat kursor di atas formasi: dorongan tetap menargetkan
      posisi kartu yang benar (pusat di-cache ulang oleh `ResizeObserver`).
- [ ] HP / `pointer: coarse`: tidak ada kursor kustom, tidak ada
      `pointermove`, `cursor: none` **tidak** terpasang.
- [ ] `prefers-reduced-motion`: cahaya parkir diam, tidak ada kursor kustom,
      grain tetap ada (statis, boleh).
