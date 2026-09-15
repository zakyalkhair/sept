?# Tahap 7 — Kartu Bertumpuk untuk Navigasi

Section menumpuk di atas section sebelumnya saat scroll. Yang lama tetap
terlihat di belakang sambil menyusut. Ini teknik 5.

**Tempatnya: di akhir `/pesan`, setelah 21 kartu.** Keputusan ini diambil
karena itu jalan keluar alami dari halaman inti — dan karena efek ini hanya
dipakai **sekali di seluruh situs**, dampaknya tidak luntur. Jangan
menambahkannya di halaman lain.

Selesai kalau: tiga panel menumpuk mulus saat scroll ke bawah, panel yang
tertinggal menyusut dan meredup tapi tetap terlihat, dan tidak ada yang
patah di Safari iOS.

---

## 7.1 `sticky`, bukan `pin`

GSAP ScrollTrigger punya `pin: true` dan itu pilihan yang jelas — tapi
salah untuk kasus ini.

`pin` bekerja dengan membungkus elemen dan men-transform wrapper-nya tiap
frame. Di iOS Safari, itu berinteraksi buruk dengan address bar yang
menyusut-membesar saat scroll: elemen ter-pin melompat, atau tertinggal
setengah layar.

`position: sticky` adalah primitif browser. Compositor yang mengurusnya,
bukan JavaScript. Mulus di semua tempat, gratis, dan tidak bisa rusak.

Ini juga yang dilakukan saisei-sbj.webflow.io — empat elemen `sticky`, nol
`pin`. Lihat `docs/00-riset-motion.md`.

**Aturannya:** `sticky` yang menahan posisi, ScrollTrigger hanya untuk
`scale` dan `opacity` panel yang tertinggal di belakang.

Satu jebakan: `position: sticky` **mati diam-diam** kalau ada leluhur yang
punya `overflow: hidden`, `auto`, atau `scroll`. Nilai-nilai itu membuat
leluhurnya jadi wadah scroll sendiri, dan elemen sticky jadi lengket pada
wadah itu — bukan pada layar. Tidak ada error, tidak ada peringatan. Kalau
tumpukan tidak jalan, itu yang diperiksa pertama, bukan nilai `start`/`end`.

Dua hal yang sering menjebak:

- **`overflow: clip` justru aman** dan merupakan solusinya. `clip` memotong
  isi tanpa membuat wadah scroll. Kalau butuh memotong sesuatu di sekitar
  tumpukan, pakai `clip`, jangan `hidden`.
- **`overflow-y: hidden` saja tidak cukup aman.** Menyetel satu sumbu membuat
  sumbu yang lain dihitung sebagai `auto` — dan `auto` memecahkan sticky.
  Setel keduanya, atau jangan sama sekali.

`PageShell` dan `Layout` dari tahap 1 tidak punya `overflow` — jangan
menambahkannya. Kalau perlu, ganti `overflow-hidden` di `Pembuka.jsx`
(tahap 5) — halaman itu tidak punya tumpukan, jadi aman, tapi jangan salin
polanya ke `/pesan`.

---

## 7.2 Data panel

`src/data/navPanel.js`

```js
export const navPanel = [
  {
    id: 'surat',
    ke: '/surat',
    warna: 'sage',
    label: 'ada surat',
    sub: 'yang harus dibaca pelan-pelan',
    cta: 'baca',
  },
  {
    id: 'penutup',
    ke: '/penutup',
    warna: 'lilac',
    label: 'dan satu hal lagi',
    sub: 'setelah semua pesan dibuka',
    cta: 'lihat',
  },
  {
    id: 'ulang',
    ke: '/',
    warna: 'kuning',
    label: 'dari awal',
    sub: 'kalau mau mengulang',
    cta: 'ulangi',
  },
]
```

Tiga panel. Bukan lima — efek menumpuk butuh cukup panel untuk terbaca
sebagai tumpukan, tapi tiap panel menghabiskan satu layar penuh scroll, dan
lima berarti lima layar sebelum halaman selesai.

---

## 7.3 Komponen

`src/components/Tumpukan.jsx`

```jsx
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { navPanel } from '../data/navPanel.js'
import { bgClass, onClass } from '../lib/colors.js'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

gsap.registerPlugin(ScrollTrigger)

export default function Tumpukan({ penutupTerbuka }) {
  const root = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = root.current
    if (!el || reduced) return

    const ctx = gsap.context(() => {
      const panel = gsap.utils.toArray('[data-panel]')

      /* Panel terakhir tidak menyusut — tidak ada yang menumpuk di atasnya. */
      panel.slice(0, -1).forEach((p, i) => {
        gsap.to(p, {
          scale: 0.9,
          opacity: 0.55,
          ease: 'none',
          scrollTrigger: {
            trigger: panel[i + 1],
            start: 'top bottom',
            end: 'top top',
            scrub: 1.1,
          },
        })
      })
    }, el)

    return () => ctx.revert()
  }, [reduced])

  return (
    <section ref={root} className="relative">
      {navPanel.map((p) => {
        const terkunci = p.id === 'penutup' && !penutupTerbuka

        return (
          <div
            key={p.id}
            data-panel
            className="sticky top-0 grid h-dvh place-items-center px-6"
            style={{ transformOrigin: 'center 20%' }}
          >
            <div
              className={[
                'flex w-full max-w-[42rem] flex-col items-start gap-3 rounded-3xl p-8 md:p-12',
                bgClass(p.warna),
                onClass(p.warna),
                terkunci ? 'opacity-60' : '',
              ].join(' ')}
            >
              <h2 className="h-display text-[clamp(2rem,7vw,3.5rem)]">
                {p.label}
              </h2>
              <p className="italic-accent text-lg opacity-80">{p.sub}</p>

              {terkunci ? (
                <span className="tap mt-4 grid place-items-center rounded-full border border-current/40 px-6 opacity-70">
                  belum terbuka
                </span>
              ) : (
                <Link
                  to={p.ke}
                  className="link-garis tap mt-4 grid place-items-center rounded-full border border-current/40 px-6"
                >
                  {p.cta}
                </Link>
              )}
            </div>
          </div>
        )
      })}
    </section>
  )
}
```

Empat hal yang penting:

**`sticky top-0` + `h-dvh` di tiap panel.** Panel menempel di atas viewport
sampai panel berikutnya mendorongnya. Tidak ada JavaScript yang mengurus ini.

**`trigger: panel[i + 1]`, bukan `panel[i]`.** Panel menyusut karena panel
*berikutnya* naik menutupinya. Kalau trigger-nya diri sendiri, penyusutan
mulai di waktu yang salah.

**`transformOrigin: 'center 20%'`.** Panel menyusut ke arah atas, bukan ke
tengah — supaya bagian atasnya (judulnya) tetap terlihat di celah antara
panel. Kalau menyusut ke tengah, yang tersisa terlihat cuma pinggiran warna.

**`scale: 0.9`, bukan lebih kecil.** Panel di belakang harus tetap terbaca
sebagai panel, bukan jadi garis warna. Bersama `opacity: 0.55` itu sudah
cukup untuk memberi kedalaman.

`ease: 'none'` dan `scrub: 1.1` — sama alasannya dengan halaman surat.
Easing pada animasi ter-scrub datang dari jari pengguna.

### Revisi final: satu amplop surat

**Kartu kedua & ketiga dihapus.** Navigasi akhir `/pesan` sekarang hanya
satu tujuan: **`/surat`**, disajikan sebagai **amplop** yang bisa dibuka.

> **Konsekuensi navigasi.** Panel "dan satu hal lagi" (`/penutup`) dan
> "dari awal" (`/`) tidak lagi ada di sini, jadi **kunci `/penutup`
> (`penutupTerbuka`) hilang** — `/penutup` kini selalu terjangkau lewat
> link "lanjut" di akhir `/surat`. Perhitungan `penutupTerbuka` dihapus
> dari `Pesan.jsx`. `navPanel.js` tetap berisi tiga entri (dokumentasi
> tujuan); `Tumpukan` hanya memakai yang `id === 'surat'`.

**Lapisan amplop** (belakang → depan) — ini yang bikin terbaca sebagai
amplop sungguhan, bukan kotak bertumpuk:

1. `.amplop-belakang` — `inset-0`, warna **lebih gelap** (`color-mix` 86%
   dengan ink) = bagian dalam amplop.
2. `.amplop-kertas` — kertas krem (`--color-bg`) berisi 4 garis
   `--color-ghost`, tersembunyi di dalam.
3. `.amplop-depan` — hanya 58% bagian bawah, **menutupi kaki kertas**, plus
   dua garis rambut diagonal membentuk **lipatan V** khas amplop.
4. `.amplop-tutup` — **SVG `<path>`**, bukan `clip-path` segitiga: bahunya
   membulat dan ujungnya tumpul (`viewBox "0 0 100 32.5"` cocok rasio
   nyata + `preserveAspectRatio: none` → tak terdistorsi). Berengsel
   `transform-origin: top center`, **lak lilin** coral radial-gradient.

**Empat detail yang menghilangkan kesan kaku** (dari referensi amplop
airmail):
- **Sisi lipatan meredup, BUKAN ganti warna.** Percobaan pertama menukar
  `fill` path ke warna dalam yang jauh lebih gelap tepat di 90° — gagal:
  pada `rotateX` berperspektif, bidangnya tidak pernah benar-benar tak
  terlihat, jadi lompatan warnanya ketangkap mata dan transisinya patah.
  Sekarang: SVG punya **dua path identik** — `.tutup-muka` (warna tetap)
  dan `.tutup-bayang` (`fill: #2e2a26`) yang `opacity`-nya `0 → 0.16`
  **mengalir sepanjang putaran**. Terbaca sebagai sisi yang meredup.
  `opacity` juga jauh lebih murah daripada `filter`.
- **Gradasi, bukan warna rata.** Badan depan `linear-gradient(155deg)` dari
  `--amplop-terang`; badan belakang dari `--amplop-dalam` ke
  `--amplop-tutup`.
- **Pita udara (airmail)** `repeating-linear-gradient(48deg)` di kedua sisi
  badan depan (`::before` / `::after`).
- **Tidak ada `filter` pada tutup.** `drop-shadow` di elemen yang berputar
  harus dihitung ulang tiap frame → tersendat. Kedalaman diambil dari path
  bayangan tadi; `drop-shadow` cuma dipasang statis di `.amplop` (yang
  tidak berputar).

Kertas keluar dari **sela** antara badan belakang dan badan depan.

**Jebakan yang sempat bikin jelek/patah — jangan diulang:**
1. **Kertas terlalu sempit** (`6%` tiap sisi) → badan belakang muncul
   sebagai dua "kuping" di kiri-kanan. Sekarang `3.5%`.
2. **Sudut atas badan belakang membulat + warnanya beda dari tutup** →
   dua nub yang tidak segaris dengan alas segitiga tutup. Sekarang
   `border-radius: 0 0 .55rem .55rem` (atas siku) dan warnanya
   `var(--amplop-tutup)` — alas segitiga dan tepi badan jadi satu bidang.
3. **Isi kertas `justify-content: center`** → garisnya jatuh di area yang
   tertutup badan depan. Sekarang rata-atas (`flex-start` + `padding-top`).
4. **Rotasi tutup beda antara `:hover` dan `[data-buka]`** → klik-setelah-
   hover memicu animasi ulang yang tersendat. Harus nilai yang **sama**
   (`-170deg`), digabung dalam satu selector.
5. **Urutan buka/tutup tidak dibalik** → saat kursor keluar, tutup menutup
   lebih cepat daripada kertas turun, jadi tutup mendarat di atas kertas
   yang masih naik. Lihat di bawah.

**Urutan bolak-balik (kunci supaya terasa nyata).** Delay arah *menutup*
ditaruh di **aturan dasar**, delay arah *membuka* di aturan
`:hover` / `[data-buka]` — jadi urutannya benar-benar terbalik:

```
MEMBUKA                              MENUTUP
0.00  tutup berputar + bayang        0.00  kertas turun
0.20  z-index tutup → 0              0.28  tutup menutup + bayang pudar
0.30  kertas naik                    0.62  z-index tutup → 4
0.96  selesai                        0.94  selesai
```

**Satu keluarga easing & durasi untuk SEMUA bagian.** Ini yang paling
menentukan. Sebelumnya amplop naik `0.4s --ease-overshoot`, tutup `0.6s
cubic-bezier(0.34,1.14,…)`, kertas `0.52–0.55s` dengan kurva lain lagi —
ketiganya saling menyalip, hasilnya terasa patah-patah meski tiap
animasinya sendiri mulus. Sekarang semuanya memakai variabel di `.amplop`:

```css
--buka:  cubic-bezier(0.2, 0.85, 0.3, 1);   /* melambat, tanpa overshoot */
--tutup: cubic-bezier(0.5, 0.05, 0.35, 1);  /* ease-in-out */
--lama:  0.66s;
```

Yang berbeda antar-elemen hanya `transition-delay` — itulah yang membentuk
urutannya. `will-change: transform` pada tutup dan kertas.

Persis seperti amplop sungguhan: membuka = tutup dulu baru kertas keluar;
menutup = kertas masuk dulu baru tutup turun.

**Gerak**
- **Hover** → amplop **terbuka** di tempat: tutup `rotateX(-168deg)`,
  kertas mengintip `-16%`. Amplopnya sendiri **tidak bergeser**.
  Yang di-**highlight adalah kertasnya**, bukan amplopnya — sebahasa
  dengan hover kartu pesan (§2.5):
  - **Tepi cahaya + bayangan angkat** pada `.amplop-kertas`:
    `0 0 0 1.5px rgba(255,253,250,0.95)` + `0 16px 30px -10px …`, plus
    `filter: brightness(1.035)`. Ring krem di atas amplop hijau terbaca
    sebagai halo di sekeliling kertas.
  - **Kilau menyapu** `.kertas-kilau` — teknik yang sama dengan
    `.kartu-kilau`, tapi disetel untuk permukaan krem: ada **tepi gelap
    tipis** (`rgba(46,42,38,0.05)`) sebelum pita terangnya, kalau tidak
    sapuan putih di atas krem nyaris tak terlihat. `translateX(-135% →
    135%)`, 0,75s. Kertas diberi `overflow: hidden` untuk mengurungnya.
  - Keduanya juga aktif pada `[data-buka]` → di perangkat sentuh (tanpa
    hover) tetap muncul saat diklik.
  - **Catatan teknis:** aturan `:hover` / `[data-buka]` untuk kertas memakai
    `transition-delay` / `-duration` / `-timing-function` **longhand**,
    bukan shorthand `transition` — kalau pakai shorthand, transisi
    `box-shadow` dan `filter` dari aturan dasar ikut terhapus dan highlight-
    nya melompat.
- **Klik** (`data-buka`) — tiga tahap:
  1. Kertas meluncur keluar penuh `translateY(-62%)` — **lebih cepat dari
     gerak hover**: `0.46s` delay `0.2s` (bukan `--lama` 0,66s delay 0,3s).
     Saat diklik, tutup biasanya sudah terbuka dari hover, jadi delay
     panjang cuma jadi waktu mati. Aturan `[data-buka]` harus ditulis
     **setelah** aturan `:hover` — spesifisitasnya sama, urutan yang menang.
     Bersamaan, overlay `bg-ink` opacity `0 → 0.55` (`z-90`) **meredupkan
     sekitarnya**; amplop dinaikkan ke `z-95` jadi dia yang tersorot.
  2. **700ms** — `getBoundingClientRect()` kertas diukur, lalu satu
     `motion.div` krem `fixed` (`z-97`) ditempatkan **persis** di atasnya
     dan **melebar** ke tengah layar (`x/y` ke pusat, `scale` =
     `max(vw/w, vh/h) × 1.1`, 0,8s `EASE.in`). Ini bahasa yang sama dengan
     lingkaran coral di transisi `/` → `/pesan` (§5.7) dan kartu→video
     (§2.7) — kertas surat *menjadi* halamannya.
  3. **1360ms** — `navigate('/surat')` saat overlay sudah menutup penuh.
     `/surat` juga krem, jadi peralihannya tak terlihat.
- Kedua `setTimeout` dibersihkan saat unmount; klik ganda dijaga `if (aktif)`.
- `prefers-reduced-motion` → langsung `navigate`, tanpa animasi.

### (dibatalkan) Kipas membuka, CSS scroll-driven

**Kenapa mesinnya diganti.** Semua percobaan sebelumnya pakai GSAP
ScrollTrigger — jalan di *main thread* dan harus disinkronkan manual dengan
Lenis. Itu sumber getar/lag yang berulang ("kartunya gerak-gerak"). CSS
**scroll-driven animation** (`animation-timeline: view()`) jalan di
*compositor thread*: 60fps, tanpa JS, tanpa sinkron Lenis, mustahil
tersendat. Dukungan ~84% (Chrome/Edge 115+, Firefox 132+, Safari 18+).

**Aman tanpa dukungan.** Kalau browser tak mengenal `animation-timeline`,
deklarasi itu diabaikan dan `animation: kipas-buka linear both` jalan dengan
durasi default `0s` → langsung mendarat di keyframe `to`, yaitu posisi
**kipas terbuka** — persis sama dengan `transform` dasar slot-nya. Jadi
tidak pernah tampil rusak, cuma tanpa gerak. Tak perlu `@supports`.

**Bentuk.** Tiga kartu bentang (`17 × 11.5rem`) warna aksen solid
(`bgHex`/`onHex` inline — terbaca tegas di atas gingham).

- Desktop: `.kipas` jadi wadah `relative` seukuran satu kartu; tiap
  `.kipas-slot` `absolute inset-0` dengan `transform-origin: 50% 290%`
  (poros jauh di bawah = gerak kipas sungguhan) dan `rotate(var(--rot))`
  (`-15° / 0° / 15°`). Keyframe: dari `rotate(0) translateY(18px)
  scale(0.94)` (tumpukan rapat) → posisi kipas. `animation-range: entry 12%
  entry 92%` — membuka saat section masuk viewport.
- Mobile: `.kipas` jadi kolom lurus, tanpa rotasi/animasi.
- Hover: slot naik `z-index`, kartu `translateY(-1.1rem) scale(1.05)`
  dengan `--ease-overshoot`. **`z-index` diatur lewat CSS `:nth-child`,
  bukan inline** — inline akan mengalahkan `:hover`.
- `prefers-reduced-motion` → `animation: none`, kipas tetap terbuka.

> Dibuang: sticky-stack (semua varian), pratinjau+benang, amplop, rolodex,
> grid, kartu-berkumpul, tipografi scrub, zona warna / kain.

---

## 7.4 Pasang di `/pesan`

Di `src/pages/Pesan.jsx`, setelah blok kartu dan **sebelum** `<AnimatePresence>`
milik pemutar:

```jsx
import Tumpukan from '../components/Tumpukan.jsx'

// ADA_VIDEO sudah ada di module scope Pesan.jsx sejak fitur "lewati"
// (tahap 2, array id yang video != null). Pakai ulang, jangan bikin lagi.
const penutupTerbuka =
  ADA_VIDEO.length > 0 && ADA_VIDEO.every((id) => dibuka.has(id))

// dalam JSX, setelah blok kartu, sebelum <AnimatePresence> pemutar:
<Tumpukan penutupTerbuka={penutupTerbuka} />
```

`penutupTerbuka` dihitung dari **video yang ada**, bukan dari 21. Kalau baru
15 video yang masuk, membuka 15 sudah cukup. Ini keputusan yang diambil
supaya rekaman yang tidak jadi tidak mengunci halaman penutup selamanya.

`ADA_VIDEO.length > 0` mencegah `every` mengembalikan `true` pada array
kosong — tanpa itu, di hari pertama saat belum ada video sama sekali,
penutup langsung terbuka.

---

## 7.5 Anggaran halaman

`/pesan` sekarang punya tiga teknik: kecepatan→skew (3), kartu melebar (4),
dan kartu bertumpuk (5). Anggarannya dua.

**Itu tidak apa-apa, dan ini alasannya:** ketiganya tidak pernah aktif
bersamaan. Skew hanya saat kartu diseret. Kartu melebar hanya saat overlay
terbuka — dan saat itu tumpukan ada di bawah lipatan. Tumpukan hanya saat
scroll sudah melewati 21 kartu — dan saat itu tidak ada yang diseret.

Yang dijaga anggaran adalah **beban bersamaan**, bukan jumlah baris kode.
Kalau ternyata terasa ramai, yang dipotong adalah tumpukan — bukan dua
teknik lainnya, karena keduanya adalah inti situs.

Satu hal yang tetap wajib diperiksa: pastikan `useVelocitySkew` pada 21
kartu benar-benar berhenti saat kartu ter-scroll keluar layar. Kalau
`IntersectionObserver`-nya tidak jalan, 21 loop akan tetap hidup selama
orang membaca tumpukan.

---

## Cek Sebelum Lanjut ke Tahap 8

- [ ] Ada **jarak lega** (`mt-[28vh]`) antara area 21 kartu dan amplop.
- [ ] **Hover masuk**: tutup melipat ke belakang dulu, **baru** kertas
      mengintip. Alas segitiga tutup segaris rapi dengan tepi atas badan —
      tak ada nub/celah di kiri-kanan kertas.
- [ ] Hover: amplop **tidak bergeser naik**. Yang tersorot adalah
      **kertasnya** — tepi cahaya + **glow putih** (dua lapis:
      `0 0 14px 2px` rapat + `0 0 42px 12px` lebar, `rgba(255,253,250,·)`)
      + satu kilau menyapu melintasinya. Amplopnya sendiri tidak berubah.
      Satu lapis glow besar saja terlihat kabur, bukan bercahaya — makanya
      dipisah dua. Slot nol yang cocok wajib ada di `box-shadow` dasar,
      kalau tidak glow-nya muncul mendadak tanpa transisi.
- [ ] **Hover keluar**: **kertas turun dulu**, baru tutup menutup. Tutup
      tidak pernah mendarat di atas kertas yang masih naik.
- [ ] **Klik**: kertas meluncur keluar, sekitarnya meredup sementara amplop
      tetap tersorot, lalu kertas **melebar memenuhi layar** dan mendarat
      di `/surat`. Tidak ada kedip krem/hitam di antaranya.
- [ ] Klik dua kali cepat tidak memicu animasi/navigasi ganda.
- [ ] Klik lalu langsung tekan Back — tak ada navigasi nyasar (timeout
      dibersihkan saat unmount).
- [ ] 375px: amplop muat (`min(86vw,26rem)`), tidak ada scroll horizontal.
- [ ] `prefers-reduced-motion`: klik langsung ke `/surat`.
- [ ] **Safari iOS sungguhan**, bukan simulator: scroll naik-turun cepat
      sambil address bar menyusut-membesar. Tidak ada panel yang melompat.
- [ ] Kalau tidak ada yang lengket sama sekali: cari `overflow: hidden`,
      `auto`, `scroll`, atau `overflow-y` sendirian di leluhur. Itu
      penyebabnya, bukan ScrollTrigger. Ganti ke `clip` kalau memang
      butuh memotong.
- [ ] Panel "penutup" terkunci selama masih ada video yang belum dibuka,
      dan tombolnya berubah jadi "belum terbuka".
- [ ] Tiap panel punya pratinjau samar di kanan (garis surat / "21" / kartu)
      dan benang jahitan di sisi kiri yang sejajar antar panel.
- [ ] Buka semua video yang ada → panel penutup jadi bisa diklik **tanpa
      reload**.
- [ ] `messages.js` dengan semua `video: null`: panel penutup tetap terkunci.
- [ ] 375px: panel muat, teks tidak terpotong, tombol ≥44×44px.
- [ ] Pindah ke `/surat` lalu kembali: tumpukan masih normal. Kalau meleset,
      `ctx.revert()` tidak jalan.
- [ ] `prefers-reduced-motion`: panel jadi tiga blok yang di-scroll biasa,
      tanpa menyusut. Tetap bisa dipakai.

