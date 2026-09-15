# Tahap 4 — Surat dengan Scroll-Scrub

Halaman terakhir yang membuat situs ini "utuh dan bisa dikirim".

Efek yang dituju: seluruh teks sudah terlihat sejak awal dalam abu pucat
(`#D8D0C4`). Saat di-scroll, teks berubah jadi pekat (`#2E2A26`) mengikuti
posisi scroll — seperti garis baca yang bergerak turun.

Maknanya: dia tidak bisa membaca cepat-cepat. Untuk surat pribadi itu
bermakna.

---

## 4.1 Mesinnya: `background-clip: text`

> ⚠️ **DIGANTI — lihat §4.7.** Bagian ini disimpan karena alasannya masih
> mengajarkan sesuatu, tapi kodenya sudah tidak berlaku. Mesin sekarang
> **opacity per kata**. Ringkasnya: kekhawatiran "300 elemen tersendat" di
> bawah ternyata salah sasaran — yang mahal bukan jumlah elemennya, tapi
> menganimasikan `color` (paint) tiap frame. Dengan `opacity` dan **satu
> ScrollTrigger ber-stagger per paragraf** (bukan per kata), 100 kata jalan
> mulus. Yang benar-benar salah dari mesin lama adalah **satuannya**: satu
> pita menyapu seluruh paragraf terbaca sebagai progress bar, bukan sebagai
> membaca.

Rencana yang tampak jelas — bungkus tiap kata jadi `<span>`, stagger
warnanya — punya masalah nyata: surat 300 kata jadi 300 elemen yang
warnanya diperbarui tiap frame scroll. Di HP itu terasa tersendat.

Cara yang dipakai situs referensi (elvismao.com, lihat
`docs/00-riset-motion.md`) jauh lebih baik: **beri teks sebuah gradient yang
di-clip ke bentuk hurufnya, lalu animasikan lebar gradient itu.**

```css
.surat-teks {
  color: var(--color-ghost);                 /* warna dasar: abu pucat */
  background-image: linear-gradient(var(--color-ink), var(--color-ink));
  background-repeat: no-repeat;
  background-size: 0% 100%;                  /* ini yang di-scrub 0% → 100% */
  -webkit-background-clip: text;
  background-clip: text;

  /* WAJIB. Safari punya bug repaint lama pada -webkit-background-clip: text:
     teks yang ter-clip tidak diperbarui di tengah animasi, jadi sapuannya
     tersendat atau tidak muncul sama sekali. Memaksa compositing layer
     memperbaikinya. Jangan dihapus meski terlihat tidak berguna di Chrome. */
  will-change: background-size;
  transform: translateZ(0);
}
```

Satu properti yang dianimasikan, bukan 300. `background-size` tidak memicu
layout maupun repaint teks — hanya compositing.

**Kenapa `color` tetap diset:** `background-clip: text` hanya mengecat
bagian yang tertutup gradient. Sisanya memakai `color` biasa. Jadi warna
dasar pucat dan warna pekat hidup berdampingan di satu elemen tanpa
`-webkit-text-fill-color: transparent` — yang akan membuat teks tak terbaca
kalau CSS gagal termuat.

`background-repeat: no-repeat` bukan opsional — tanpa itu, gradient di keadaan
`0%` justru ter-tile dan seluruh teks langsung pekat.

**Satu paragraf = satu elemen ber-scrub sendiri.** Jangan satu gradient
untuk seluruh surat: gradient horizontal pada blok multi-baris menyapu
lebar, bukan mengikuti alur baca. Per-paragraf membuat sapuan berhenti di
akhir tiap paragraf, yang justru terasa seperti membaca.

---

## 4.2 Hook scrub

`src/hooks/useTextScrub.js`

```js
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from './useReducedMotion.js'

gsap.registerPlugin(ScrollTrigger)

export function useTextScrub() {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const root = ref.current
    if (!root) return

    const paras = root.querySelectorAll('[data-scrub-teks]')

    if (reduced) {
      paras.forEach((p) => { p.style.backgroundSize = '100% 100%' })
      return
    }

    const ctx = gsap.context(() => {
      paras.forEach((p) => {
        gsap.fromTo(
          p,
          { backgroundSize: '0% 100%' },
          {
            backgroundSize: '100% 100%',
            ease: 'none',
            scrollTrigger: {
              trigger: p,
              start: 'top 78%',
              end: 'bottom 42%',
              scrub: 1.1,
            },
          }
        )
      })
    }, root)

    return () => ctx.revert()
  }, [reduced])

  return ref
}
```

Tiga hal yang penting di sini:

**`scrub: 1.1`, bukan `scrub: true`.** Angka berarti animasi *mengejar*
posisi scroll dengan jeda 1,1 detik, bukan terkunci mati padanya. Ini yang
memberi bobot — dicuri dari raven-trading.com yang memakai `scrub: 1.5`.
`scrub: true` terasa seperti scrollbar, bukan seperti membaca.

**`ease: 'none'`.** Untuk animasi yang di-scrub, easing datang dari gerakan
jari pengguna. Easing tambahan membuat sapuan terasa tidak sinkron dengan
scroll.

**`gsap.context` + `ctx.revert()`.** Ini yang membunuh semua ScrollTrigger
saat komponen unmount. Tanpanya, pindah route meninggalkan trigger yang
menunjuk elemen mati, dan trigger berikutnya akan salah posisi.

---

## 4.3 Isi surat

Isi masih dummy. Struktur datanya dipisah supaya nanti tinggal diganti
tanpa menyentuh komponen.

`src/data/surat.js`

```js
export const surat = [
  "Aku menulis ini beberapa minggu sebelum tanggalnya, karena kalau menunggu sampai harinya, aku tahu aku akan menulis yang buru-buru.",
  "Dua puluh satu. Angka yang aneh — cukup tua untuk dianggap sudah tahu, cukup muda untuk masih boleh tidak tahu.",
  "Ada dua puluh satu orang yang menitipkan pesan di halaman sebelumnya. Aku tidak bilang apa-apa ke mereka selain tanggalnya. Yang mereka kirim adalah milik mereka sendiri.",
  "Yang ingin aku katakan sebenarnya sederhana, dan aku menghabiskan tiga paragraf untuk menundanya.",
  "Selamat ulang tahun.",
]
```

> **Diperbarui.** `surat.js` sekarang mengekspor empat hal, bukan satu array:
> `suratKop` (**tanggal + sapaan**), `surat` (badan, 4 paragraf),
> `suratAkhir`, dan `suratTanda`. `"Selamat ulang tahun."` **dikeluarkan dari
> array** — lihat §4.7. Semuanya tetap teks murni: mengganti isi surat tidak
> menyentuh satu baris pun kode komponen.
>
> Isi sekarang: tanggal `20 09 2026`, sapaan `happy birthday`, tanda tangan
> `— Zaky`. Field `tempat` (dulu "ditulis lebih awal" di sisi kanan kop)
> **dihapus**; `justify-between` di `<header>` ikut dilepas, kalau tidak
> tanggalnya terlempar sendirian ke kiri dengan sisa ruang kosong yang aneh.

---

## 4.7 Kertas, kop, dan kalimat pamungkas

Ditambahkan setelah tahap awal. Diagnosisnya tiga, dan tak satu pun soal
"kurang efek":

1. **Tidak ada bendanya.** Teks mengambang di atas latar halaman, padahal
   amplop di `/pesan` baru saja menjanjikan selembar kertas yang meluncur
   keluar dan melebar memenuhi layar. Janji yang tidak ditepati.
2. **Scrub menyapu paragraf sebagai satu blok**, jadi terbaca seperti
   progress bar.
3. **Tidak ada pembuka dan penutup.** `"Selamat ulang tahun."` punya bobot
   visual yang sama persis dengan paragraf lain, padahal itu satu-satunya
   kalimat yang penting.

### Kertas — `.kertas-surat` + `.latar-surat`

Kertas `#FFFDF8` di atas **meja** (`.latar-surat`, `fixed`, radial gelap
sangat samar di tepi). Meja itu wajib: tanpa dia, krem kertas dan krem
halaman nyaris sama dan kertasnya tidak terbaca sebagai benda.

Garis margin `::before` memakai **coral dari palet**, bukan biru buku tulis
generik.

### Perabot kertas — `useKertasSurat()`

Tiga gerak digabung di satu hook karena trigger-nya sama, lembar suratnya
sendiri:

1. **Bekas lipatan memudar** (`.lipatan`). Dua garis melintang di layar
   pertama — di situlah kertasnya baru saja keluar dari amplop. **Satu garis
   saja terbaca sebagai garis, bukan lipatan**; yang membuatnya lipatan
   adalah pasangan **gelap-di-atas / terang-di-bawah** plus bayangan lebar
   yang sangat samar (`::after`).
2. **Garis margin tumbuh** ke bawah mengikuti progres baca
   (`.margin-garis`, `scaleY` 0→1, `scrub: 0.6`). Elemen sendiri, bukan
   `::before`, supaya bisa di-`scaleY`. Ini satu-satunya gerak yang menemani
   sepanjang halaman — sengaja pelan dan sunyi.
3. **Kop naik & memudar** saat dilewati (`[data-kop]`, `y: -34`,
   `opacity: 0.25`). Memberi gerak di bagian atas halaman yang tadinya diam
   total.

Dua jebakan:
- `end` memakai **fungsi** `() => '+=' + innerHeight * 0.75`, bukan
  `'+=75%'`. Persen di `end` dihitung dari **tinggi trigger**, dan trigger di
  sini selembar surat yang sangat panjang — lipatannya tidak akan pernah
  selesai memudar. ScrollTrigger juga tidak mengerti satuan `vh`.
- Semua yang dianimasikan properti komposit murni (`opacity`, `transform`),
  sesuai aturan performa 05-pembuka §5.6.5.

### Scrub per kata — `useTextScrub()` (mesin baru)

`.surat-kata` mulai di `opacity: 0.2`, dinaikkan ke 1 satu per satu.

- **Satu ScrollTrigger per paragraf, bukan per kata.** Satu tween
  ber-stagger menggerakkan seluruh kata di paragraf itu → 4 trigger, bukan
  ±100.
- **`stagger: { amount: 1 }`, bukan `each`.** Total jeda dibagi rata berapa
  pun jumlah katanya, jadi paragraf panjang dan pendek selesai dalam rentang
  scroll yang sama. Dengan `each`, paragraf panjang jauh tertinggal.
- Kata dipecah **di JSX, bukan lewat DOM** — React tetap pemilik tunggal isi
  elemennya.

### Rembesan tinta & coretan tanda tangan

- `.rembesan` — radial **coral sangat samar** di belakang kalimat pamungkas,
  mekar sekali saat masuk layar. Bukan tinta gelap: di atas kertas krem,
  noda gelap terbaca sebagai kotor.
- Coretan tanda tangan — `<motion.path>` dengan **`pathLength` 0→1**. Motion
  menanganinya langsung; tidak perlu mengukur `getTotalLength()` lalu
  mengatur `stroke-dasharray`/`dashoffset` sendiri seperti resep klasiknya.
  Sengaja **bukan huruf sungguhan**: satu garis luwes yang menggambar dirinya
  terbaca sebagai goresan pena, sementara huruf tulisan tangan palsu langsung
  ketahuan palsunya.

### Kalimat pamungkas

Dipisah dari array `surat` supaya **tidak ikut di-scrub** seperti paragraf
lain. Dia dapat: jeda `mt-[52vh]` (satu-satunya bagian halaman yang boleh
kosong), tipografi display, dan kedatangan **huruf per huruf** lewat
`whileInView` + `staggerChildren`.

Durasinya ditaruh **di dalam varian**, bukan sebagai prop `transition`
terpisah — prop itu menimpa konfigurasi yang dikirim induk, termasuk jeda
stagger-nya, jadi semua huruf akan datang bersamaan.

`aria-label` di `<h2>` + `aria-hidden` di tiap huruf supaya pembaca layar
membaca kalimatnya, bukan mengeja.

#### Huruf dikelompokkan PER KATA — tiga jebakan sekaligus

> ⚠️ Versi pertama merender 20 huruf sebagai `inline-block` sejajar di satu
> induk, dengan spasi diganti karakter **NBSP literal** di source. Hasilnya
> rusak dua kali: `Selamatulangta / hun.`

1. **Baris boleh putus di antara huruf mana pun** kalau tiap huruf adalah
   `inline-block` yang berdiri sendiri — browser memperlakukan tiap huruf
   sebagai item yang bisa dipisah. Tiap **kata** sekarang dibungkus satu
   elemen, jadi titik putus baris cuma ada di antara kata.
2. **Spasi ditulis sebagai text node biasa DI LUAR pembungkus kata**, bukan
   sebagai elemen berisi spasi. Spasi sendirian di dalam `inline-block`
   diruntuhkan browser dan hilang.
3. **Jangan simpan NBSP literal di source.** Karakter tak terlihat itu
   pernah berubah jadi spasi biasa dalam satu putaran penyuntingan tanpa
   ada yang menyadarinya — tidak terlihat di diff, tidak ketahuan lint,
   baru ketahuan dari layar. Kalau memang perlu, tulis `' '`.

**Jeda huruf pakai `custom`, bukan `staggerChildren`.** `staggerChildren`
hanya menjangkau anak **langsung**; begitu huruf-hurufnya dibungkus per kata,
rantainya putus dan semua huruf datang bersamaan. Sekarang varian `datang`
adalah **fungsi** `(i) => …` dengan `delay: i * 0.045`, dan indeksnya
diratakan lintas kata supaya jedanya berurutan dari awal kalimat sampai
akhir, tidak mengulang tiap kata.

**Pembungkus kata harus `motion.span`, bukan `span` biasa.** Motion
meneruskan label varian hanya lewat rantai komponen motion — satu `span`
polos di tengah memutus rantainya dan huruf-hurufnya tidak akan pernah
dianimasikan.

### Foto yang diselipkan di badan surat — `FotoSurat`

Halaman inilah tempat foto bersama, bukan `/pesan` (di sana tiap foto milik
satu orang) dan bukan `/` (kartu formasinya ~40px, sudah diredupkan 30% +
blur — foto tidak akan terbaca di situ).

Datanya di `surat.js` → `suratFoto`, tiap entri:
`{ n, setelah, teks, miring }` — `setelah` = muncul sesudah paragraf
ke-berapa (0 = paragraf pertama). Nomornya juga harus didaftarkan di
`SURAT_FOTO_ADA` (`video.js`). **Kosong = tidak ada yang dirender.**

- **Bingkai putih tebal + miring sedikit** = foto cetak yang ditempel
  tangan, bukan gambar yang disisipkan ke dokumen. Kemiringan **±3° saja**;
  lebih dari itu terbaca sebagai stiker.
- **Masuk searah kemiringannya** (`whileInView`, `once`) — pola yang sama
  dengan kartu `/pesan` versi HP: datang dari sisi yang dituju miringnya,
  bukan melawannya.
- **`box-shadow`, bukan `filter: drop-shadow`** — elemen ini di-`rotate`
  saat masuk, dan drop-shadow memaksa raster ulang tiap perubahan
  (05-pembuka §5.6.5).
- Keterangannya memakai `--font-display` italic: di kertas ini dialah yang
  terbaca sebagai tulisan tangan di bawah foto, bukan caption cetakan.
- Ditaruh **di dalam** wadah scrub tapi **tanpa** `data-scrub-teks`, jadi
  hook scrub-nya melewatinya begitu saja.
- Minta `w_1000` — paling besar di situs ini, karena kertasnya ~500px CSS
  dan foto surat memang yang paling layak dilihat besar. Tanpa `ar_`:
  potongan aslinya yang menentukan, karena foto bersama bisa lanskap
  maupun potret.

### Garis bawah tautan — coretan tangan (berlaku SE-SITUS)

`.link-garis` dulu garis lurus 1px yang di-`scaleX`. Diganti **coretan
tangan**: SVG data-URI ombak, diulang sebagai ubin.

Tiga keputusan yang menentukan:

- **`mask-image`, bukan `background-image`.** Dengan mask, warnanya tetap
  `currentColor`, jadi satu aturan melayani teks gelap di krem maupun teks
  krem di atas kartu warna — tanpa varian per konteks. Lightning CSS
  menambahkan `-webkit-mask-image` sendiri (sudah dicek di CSS hasil build).
- **`preserveAspectRatio="none"` TIDAK dipakai.** Kalau ombaknya diregangkan
  mengikuti lebar tautan, tautan pendek dan panjang punya panjang gelombang
  berbeda dan terbaca tidak konsisten. Ubinnya berukuran tetap (44×7) lalu
  `repeat-x`.
- **`clip-path`, bukan `scaleX`.** Coretan harus *digambar* dari kiri seperti
  pena. Dengan `scaleX`, seluruh gelombang terjepit di awal lalu memuai —
  terbaca seperti per, bukan coretan.

Konsekuensinya: arahnya jadi satu (masuk menggambar kiri→kanan, keluar
menariknya balik). Trik dua-arah versi lama (menukar `transform-origin` di
aturan `:hover`) tidak punya padanan di `clip-path`.

### Tombol "lanjut" — `TombolLanjut.jsx`

Sengaja **bukan** `link-garis` seperti tautan lain: ini satu-satunya jalan
keluar dari halaman terpanjang di situs, jadi boleh punya bobot sendiri.

**Pil tinta pekat, bahasa yang sama dengan tombol "masuk" di `/`.** Keduanya
satu jenis tindakan — pintu ke babak berikutnya — dan halaman sepanjang ini
butuh penutup yang jelas, bukan tautan kecil yang mudah terlewat di ujung
teks. Hover: naik 2px. Ditekan: turun lagi.

**Tanpa `box-shadow`.** Tombol ini duduk di atas kertas surat yang sudah
punya bayangannya sendiri; bayangan kedua di atasnya membuat tombolnya
terbaca **melayang di atas** kertas, bukan tercetak di atasnya.

**Tingginya mentok di 44px** — `padding` sudah dikecilkan (`0.55rem 2.1rem`),
tapi class `.tap` memasang `min-height: 44px` sebagai target sentuh minimum.
Itu lantainya; mengecilkan lagi berarti melanggar aturan target sentuh yang
dipakai se-situs (§1.4), jadi kalau perlu lebih pendek lagi, keputusannya
harus diambil sadar — bukan dengan menurunkan `padding` lebih jauh (tidak
akan berpengaruh).

> **Riwayat, supaya tidak diulang:**
> - **Magnetik** — sempat dipasang lalu dibuang. Tombolnya berdiri
>   sendirian di ujung halaman yang sunyi; tarikan magnet membuatnya
>   gelisah, bukan hidup.
> - **Panah bergaris** (garisnya memanjang `scaleX` 0.72 → 1, kepalanya
>   meluncur saat dihover) — dibuang juga. Panahnya jadi ornamen yang harus
>   dijelaskan; tombol pekat langsung terbaca sebagai "ditekan di sini".
>   Ikut hilang bersamanya: garis bawah coretan tangan di teksnya, dan
>   kebutuhan `transform-box: fill-box` pada path SVG-nya.

Tetap **`<Link>`, bukan `<button>`** — ini navigasi, jadi harus bisa dibuka
di tab baru dan terbaca sebagai tautan. Klik biasa di-`preventDefault` supaya
transisinya sempat jalan; klik dengan Ctrl/Cmd/Shift/tombol tengah dibiarkan
lewat ke perilaku bawaan browser.

### Transisi surat → penutup: konfeti kertas

`mulaiPesta()` di `TransisiContext` — saudara kedua dari lingkaran coral yang
dipakai `/` → `/pesan` (05-pembuka §5.7). Serpih kertas dilempar dari
tombolnya sementara **tirai krem** naik menutupi pertukaran route di
belakangnya.

> Sempat dicoba versi **surat dilipat tiga** (dua sepertiga ditekuk lewat
> `rotateX`, lalu paketnya dijatuhkan). Ditolak — bagus di atas kertas, jelek
> di layar: bidang datar tanpa isi yang berputar tetap terbaca sebagai kotak,
> bukan kertas, dan tidak ada cara meyakinkan untuk melipat halaman yang
> panjangnya berkali-kali tinggi layar. Jangan diulang tanpa ide baru soal
> **apa yang tergambar di bidang lipatannya**.

Keputusan yang membentuk rasanya:

- **Tirainya sewarna latar kedua halaman** (`bg-bg`), jadi potongan route-nya
  tidak terlihat sama sekali. Tidak perlu warna pekat seperti lingkaran
  coral, karena di sini yang jadi tontonan konfetinya.
- **Sudut lemparan dicondongkan ke atas** (−160°..−20°), bukan merata ke
  segala arah. Ledakan merata terbaca sebagai partikel; kertas yang dilempar
  ke atas lalu jatuh terbaca sebagai perayaan.
- **`y` tiga titik** (`[0, -naik, jatuh]`, `times: [0, 0.32, 1]`, easing
  `['easeOut','easeIn']`). Satu tarikan lurus ke tujuan akan terbaca sebagai
  partikel yang ditembak, bukan kertas yang dilempar.
- **Pembungkusnya yang punya `exit`, bukan tiap serpih.** Saat tirai lepas,
  konfetinya masih terbang dan ikut memudar **di atas `/penutup`** —
  perayaannya melimpah ke halaman berikutnya, tidak terpotong di batas route.
- Serpihnya **acak beneran**, bukan hash deterministik seperti sebaran kartu.
  Ini visual sekali-pakai yang tidak pernah perlu sama dua kali.
- `prefers-reduced-motion` → langsung `navigate`, sama seperti lingkaran
  coral.

#### `exit` WAJIB menahan opacity penuh dulu

```js
exit={{ opacity: [1, 1, 0], transition: { duration: 1.15, times: [0, 0.48, 1] } }}
```

Bukan hiasan — ini memperbaiki bug nyata: **suratnya masih terlihat menembus
tirai setelah transisi**.

Sebabnya `AnimatePresence mode="wait"` di `App.jsx`. `navigate` tidak
langsung mengganti halaman: `/surat` baru **memainkan animasi keluarnya**
dulu (`DUR.page * 0.6` = 0,48 detik di `PageShell`), dan `/penutup` baru
masuk sesudah itu. Kalau tirai mulai memudar tepat saat `navigate`, ia
memudar persis di atas surat yang belum pergi.

Tahanan 0,48 × 1,15s ≈ **0,55 detik** menutupi seluruh pergantian itu, baru
memudar. Lingkaran coral di `/` → `/pesan` sudah memakai trik yang sama
(`times: [0, 0.45, 1]`) — polanya memang sudah ada, versi konfeti pertama
saja yang lupa memakainya.

> **Aturan umum:** setiap overlay transisi route di proyek ini harus
> **menahan** opacity penuh minimal selama `DUR.page * 0.6` setelah
> `navigate`, sebelum boleh memudar.

### Yang masih terbuka

**Tulisan tangan sungguhan** untuk kalimat pamungkas — butuh aset jejak
tulisan tangan yang harus ditulis dan di-trace dulu, jadi tidak bisa
dikerjakan tanpa bahan dari manusia.

Ditolak dengan sengaja: **silinder/tabung teks 3D**
([Codrops, Nov 2025](https://tympanus.net/codrops/2025/11/04/creating-3d-scroll-driven-text-animations-with-css-and-gsap/))
dan **huruf berjatuhan**
([Codrops SplitText](https://tympanus.net/codrops/2025/05/14/from-splittext-to-morphsvg-5-creative-demos-using-free-gsap-plugins/)).
Keren di portfolio, tapi melawan satu-satunya tugas halaman ini: dibaca
pelan-pelan.

---

## 4.4 Halaman

`src/pages/Surat.jsx`

```jsx
import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell.jsx'
import { surat } from '../data/surat.js'
import { useTextScrub } from '../hooks/useTextScrub.js'

export default function Surat() {
  const ref = useTextScrub()

  return (
    <PageShell className="px-6 pb-40 pt-[35vh]">
      <div ref={ref} className="mx-auto flex max-w-[34rem] flex-col gap-[18vh]">
        {surat.map((p, i) => (
          <p
            key={i}
            data-scrub-teks
            className="surat-teks text-[clamp(1.35rem,4.6vw,2rem)] leading-[1.55]"
          >
            {p}
          </p>
        ))}

        <Link
          to="/penutup"
          className="tap self-start text-muted underline underline-offset-[6px]"
        >
          lanjut
        </Link>
      </div>
    </PageShell>
  )
}
```

Tiga angka yang disengaja:

- **`pt-[35vh]`** — paragraf pertama mulai di bawah lipatan. Kalau langsung
  di atas, sapuannya sudah setengah jalan sebelum pengguna sempat scroll,
  dan efeknya tidak pernah terlihat dari awal.
- **`gap-[18vh]`** — jarak antar paragraf harus besar. Ini yang memaksa
  ritme lambat; kalau paragrafnya rapat, tiga paragraf ter-scrub sekaligus
  dan efek "garis baca" hilang.
- **`max-w-[34rem]`** — sekitar 60–70 karakter per baris. Lebih lebar dari
  itu, mata kehilangan awal baris berikutnya.

`pb-40` di bawah supaya paragraf terakhir bisa mencapai `bottom 42%` —
tanpa ruang di bawahnya, ScrollTrigger tidak pernah menyelesaikan sapuan
terakhir dan kalimat penutup tetap pucat selamanya.

---

## 4.5 Lenis dan ScrollTrigger

Sudah disambungkan di tahap 1 lewat `lenis.on('scroll', ScrollTrigger.update)`.
Kalau sapuan terasa telat atau posisinya meleset, itu penyebab pertama yang
diperiksa — bukan nilai `start`/`end`.

Kalau `prefers-reduced-motion` aktif, Lenis tidak dipasang dan hook di atas
langsung men-set `backgroundSize: '100% 100%'`. Seluruh surat terbaca pekat
sejak awal. Itu benar: efeknya hilang, isinya utuh.

---

## 4.8 Konfeti kertas — kerapatan yang diikat ke scroll

Rujukannya sebuah situs *scrollytelling* bertema musim gugur: daun
beterbangan di atas ilustrasi yang diam. Setelah rekamannya dibandingkan
frame demi frame, yang membuatnya bagus ternyata **bukan daunnya**:

| Keadaan | Yang terlihat |
|---|---|
| Sedang di-scroll cepat | ~40 kepingan memenuhi layar, ukuran sangat beragam |
| Sedang diam dibaca | tinggal 3–4 kepingan, melayang pelan |

Kerapatannya **diikat ke kecepatan scroll**. Itulah sebabnya terasa hidup:
ada sebab-akibat. Lapisan yang jatuh terus-menerus dengan kerapatan tetap
terbaca sebagai wallpaper, bukan sebagai sesuatu yang bereaksi pada kita.

Daunnya **diganti serpihan kertas**. Daun tidak punya alasan untuk ada di
situs ini; kertas punya — kartu ditumpuk, surat bergaris, kartu ucapan
ter-emboss. Dan konfeti memang benda ulang tahun, jadi maknanya tidak perlu
dijelaskan. Tiga bentuk: `kotak`, `pita` (satu sisi membulat penuh), dan
`sobek` (`clip-path` bertepi tidak rata — kertas robek, tidak terpotong
rapi). Warnanya dari `ACCENTS`, bukan oranye musim gugur.

Mekanisnya di [src/components/Konfeti.jsx](../src/components/Konfeti.jsx):

- `aduk` (0..1) naik dari `|Δwindow.scrollY|` dan **meluruh eksponensial**
  (`aduk *= Math.exp(-dt * 1.6)`). Peluruhan eksponensial, bukan pengurangan
  tetap: mengendapnya cepat di awal lalu melandai, seperti benda yang
  kehilangan momentum.
- `aduk` melakukan **dua hal sekaligus** — memunculkan kepingan yang
  ambangnya terlampaui, DAN mempercepat yang sudah ada (`× (1 + aduk * 4)`).
  Tanpa yang kedua, kepingan baru muncul dengan kecepatan halaman-diam dan
  tidak terbaca sebagai "teraduk".
- Lima kepingan pertama berambang `0` supaya **selalu ada**. Layar yang
  benar-benar kosong saat diam terbaca sebagai efeknya rusak.
- Muncul (`laju 6`) lebih cepat daripada menghilang (`laju 1.2`). Kalau
  sama, kepingan berkedip tiap kali `aduk` melintasi ambangnya.
- `scaleX(cos(sudut))` = kertas berbalik menghadap kita. Gratis, karena
  masih di dalam satu `transform` yang sama.

Aturan yang tidak boleh dilanggar:

- **Satu rAF untuk semua kepingan, hasilnya ditulis langsung ke DOM.** Tidak
  ada `setState` per frame — sama seperti pelajaran scramble dan progres
  video (05-pembuka §5.6.5).
- **Posisi scroll dibaca di dalam rAF, bukan lewat event `scroll`.** Selain
  hemat, ini yang membuatnya bekerja apa adanya dengan Lenis.
- **`dt` dibatasi `0.05`.** Tab yang ditinggal lalu dibuka lagi memberi `dt`
  belasan detik, dan semua kepingan melompat sekaligus.
- **Jangan menaruh `transition` di `.konfeti`.** rAF sudah menulis
  `transform` tiap frame; transisi CSS di atasnya membuatnya tertinggal.
- **Acaknya ditentukan indeks**, bukan `Math.random()` — satu re-render saja
  sudah cukup untuk mengocok ulang susunannya dan kepingannya terlihat
  melompat.
- `prefers-reduced-motion` → komponennya tidak me-render apa pun.

Dua peran berbeda, dan pembedaannya disengaja:

| Halaman | Mode | Jumlah | Lapis | Alasan |
|---|---|---|---|---|
| `/surat` | penuh | 28 (16 di HP) | `konfeti-tetap z-30`, **di atas** kertas | halaman ini men-scroll, jadi mekanik "teraduk" punya masukan |
| `/penutup` | `tenang` | 9 (6 di HP) | `z-[1]`, **di belakang** kartu | halaman ini **tidak** men-scroll — lihat di bawah |

`/penutup` tidak punya scroll sama sekali (satu kartu di tengah,
`overflow-hidden`). Dipasang dengan pengaturan `/surat`, dia cuma jadi versi
lemah dari efek di sana: jatuh terus tanpa sebab-akibat. Maka perannya
sengaja dibedakan — sedikit, lambat, di belakang kartu, sekadar menutup
situs dengan tenang. Bukan meniru rujukannya.

Di `/surat` lapisannya **`fixed`, bukan `absolute`**: kepingan jatuh di ruang
layar, bukan ikut tergulung bersama isi halaman. Dipakai class sendiri
(`.konfeti-tetap`), bukan utility `fixed` Tailwind — dua aturan `position`
dengan specificity sama diputus oleh urutan berkas, dan itu tidak perlu
dipertaruhkan.

---

## 4.6 Yang Sengaja Tidak Ada di Halaman Ini

- **Tidak ada kartu.** Ini satu-satunya halaman tanpa motif kartu, dan itu
  disengaja — surat harus terasa berbeda dari 21 pesan.
- **Tidak ada `pin`.** Halaman ini scroll biasa. Pin akan membuat panjang
  scroll terasa palsu.
- **Anggaran teknik berat: dua, dan dua-duanya sudah terpakai** —
  scroll-scrub dan konfeti (§4.8). Sebelum §4.8 ada, baris ini berbunyi
  "hanya satu, sisanya disimpan untuk magnetik di tombol lanjut"; jatah itu
  sudah dipakai konfeti, jadi **tidak ada lagi** yang boleh ditambahkan di
  halaman ini tanpa mencabut salah satunya. Keduanya rAF, tapi keduanya
  menulis langsung ke DOM tanpa `setState` — itu syarat mutlaknya.

---

## Cek — Setelah Ini Situs Sudah Bisa Dikirim

- [ ] **Uji di Safari iOS sungguhan, bukan hanya DevTools.** Ini satu-satunya
      efek di situs yang punya bug spesifik Safari.
- [ ] Muat `/surat` tanpa scroll: semua paragraf terlihat, pucat, terbaca.
      Kalau ada yang tak terlihat sama sekali, `-webkit-text-fill-color`
      ikut terpakai di suatu tempat.
- [ ] Scroll pelan: teks menghitam **kata demi kata**, satu paragraf pada
      satu waktu. Kalau satu pita menyapu seluruh paragraf, mesin lama masih
      terpakai.
- [ ] Paragraf panjang dan paragraf pendek **selesai dalam rentang scroll
      yang sama**. Kalau yang panjang tertinggal jauh, `stagger` memakai
      `each`, bukan `amount`.
- [ ] Scroll cepat lalu berhenti: sapuan **menyusul** setelah jari berhenti.
      Kalau berhenti persis bersamaan, `scrub` masih `true`.
- [ ] Garis margin coral **tumbuh dari atas** mengikuti scroll dan sampai ke
      bawah tepat saat surat habis.
- [ ] **Konfeti bereaksi pada scroll, bukan cuma jatuh.** Scroll cepat →
      layar ramai; berhenti ~2 detik → tinggal 4–5 kepingan yang melayang
      pelan. Kalau kerapatannya sama saja antara keduanya, `aduk` tidak
      terhubung (cek: apakah halaman ini benar-benar men-scroll `window`).
- [ ] Kepingan **muncul dan hilang dengan memudar**, tidak berkedip di
      ambangnya. Berkedip = laju muncul dan hilang dibuat sama.
- [ ] Kepingan lewat **di depan** kertas surat, dan teks surat **masih bisa
      diseleksi** (`pointer-events: none` bekerja).
- [ ] Tinggalkan tab ini ~1 menit lalu kembali: kepingan **melanjutkan
      dengan tenang**, tidak melompat serentak (`dt` terbatas).
- [ ] `prefers-reduced-motion: reduce` → **tidak ada kepingan sama sekali**,
      bukan kepingan yang diam di tempat.
- [ ] Kop (tanggal `20 09 2026` + sapaan `happy birthday`) naik pelan dan
      memudar saat dilewati, tidak hilang mendadak. Sisi kanan kop kosong —
      tidak ada lagi "ditulis lebih awal".
- [ ] Coretan tanda tangan **menggambar dirinya** sekali saat masuk layar,
      tidak muncul jadi.
- [ ] Hover tautan mana pun di situs: garis bawahnya **coretan bergelombang**
      yang tergambar dari kiri, bukan garis lurus. Bandingkan tautan pendek
      ("lewati") dengan yang panjang ("kembali ke pesan") — **panjang
      gelombangnya sama**. Kalau berbeda, ubinnya ikut diregangkan.
- [ ] Coretan itu terlihat juga di atas kartu berwarna (`lewati semua` di
      pemutar) — `mask` mewarisi `currentColor`, bukan warna tetap.
- [ ] Tombol "lanjut" di akhir surat tampil sebagai **pil tinta pekat**
      seperti tombol "masuk" di `/` — tanpa panah, tanpa garis bawah,
      **tanpa bayangan**. Dihover naik sedikit; ditekan turun lagi.
- [ ] Tingginya tepat **44px** (target sentuh minimum). Kalau terukur lebih
      dari itu, ada `padding` yang kebesaran; kalau kurang, `.tap` lepas.
- [ ] Klik "lanjut": konfeti kertas terlempar **ke atas dari tombolnya**,
      lalu jatuh. Warnanya kelima warna palet, bentuknya persegi panjang
      (kertas), bukan bulat.
- [ ] **Isi surat TIDAK pernah muncul lagi** setelah tirai penuh. Rekam layar
      dan periksa frame per frame di detik 0,5–1,2 — di situlah `/surat`
      memainkan animasi keluarnya. Kalau teksnya sempat terlihat menembus
      tirai, tahanan `opacity: [1, 1, 0]` di `exit` hilang atau `times`-nya
      terlalu pendek.
- [ ] Saat pindah ke `/penutup` **tidak ada kedip** — tirainya sewarna latar
      kedua halaman.
- [ ] Konfeti **masih terlihat jatuh di atas `/penutup`** sesaat setelah
      halaman berganti, lalu memudar. Kalau hilang mendadak tepat saat
      pindah, `exit` ada di tiap serpih, bukan di pembungkusnya.
- [ ] Klik "lanjut" dua kali cepat: tidak dobel-navigate (`pindahRef`).
- [ ] Ctrl/Cmd+klik "lanjut" tetap membuka tab baru (transisi dilewati).
- [ ] `prefers-reduced-motion`: klik "lanjut" langsung pindah, tanpa konfeti.
- [ ] Uji `mask-image` di Firefox dan Safari, bukan cuma Chrome.
- [ ] Scroll ke bawah sampai habis: paragraf terakhir **selesai** jadi
      pekat penuh. Kalau tidak, `pb` kurang.
- [ ] Scroll ke atas lagi: sapuan mundur. Ini benar — scrub dua arah.
- [ ] Kertasnya terbaca sebagai **lembar di atas meja** — ada tepi, bayangan,
      dan latar di belakangnya sedikit lebih gelap. Kalau terlihat rata,
      `.latar-surat` tidak termuat.
- [ ] Dua bekas lipatan terlihat saat halaman baru dibuka, lalu **memudar
      habis** dalam ±satu layar scroll. Kalau masih terlihat jauh ke bawah,
      `end` di `useLipatan` salah satuan.
- [ ] Teks tidak pernah menabrak garis margin coral di kiri, termasuk di
      375px.
- [ ] Scroll sampai kalimat pamungkas: huruf datang **satu per satu** dari
      awal kalimat sampai akhir, bukan serentak dan bukan mengulang jeda
      tiap kata. Kalau serentak, rantai varian putus (ada `span` polos di
      antara `motion.span`) atau `custom`-nya tidak sampai.
- [ ] **Spasi antar kata terlihat** — "Selamat ulang tahun.", bukan
      "Selamatulangtahun."
- [ ] Persempit jendela sampai kalimatnya terpaksa turun baris: putusnya
      **di antara kata**, tidak pernah memotong kata di tengah
      ("Selamatulangta / hun." = bug).
- [ ] Pembaca layar membaca "Selamat ulang tahun." sebagai kalimat, bukan
      mengeja huruf.
- [ ] Pindah ke `/penutup` lalu kembali: sapuan bekerja normal, tidak
      meleset. Kalau meleset, `ctx.revert()` tidak jalan.
- [ ] Performance tab saat scroll di 375px throttled 4x CPU: tidak ada
      long task > 50ms.
- [ ] `prefers-reduced-motion`: seluruh surat pekat sejak awal, scroll biasa.
- [ ] Tidak ada scroll horizontal di 375px.

---

## Setelah Tahap 4

Tahap 1–4 adalah situs yang utuh dan bisa dikirim: dia bisa masuk, mendengar
lagu, membuka 21 pesan, dan membaca surat. Sisanya poles.

Kalau waktu masih ada, lanjut sesuai urutan di `CLAUDE.md`:

```
5  Pembuka: formasi 21 kartu + teks teracak   docs/05-pembuka.md
6  Magnetik di semua tombol                   docs/06-magnetik.md
7  Kartu bertumpuk untuk navigasi             docs/07-tumpuk.md
8  Halaman penutup                            docs/08-penutup.md
9  Garis audio-reaktif untuk pemutar musik    docs/09-audio.md
```

Tahap 5 dan 8 berbagi komponen `Formasi21` — kerjakan 5 dulu, jangan
menulis versi kedua di tahap 8.
