# Riset Motion — 8 Situs Referensi

Diamati langsung di browser (bukan `web_fetch`), 1 September 2026.
Metode: probe `window` globals, `document.styleSheets` (cubic-bezier + @keyframes),
atribut `data-*`, jumlah `<canvas>` + `data-engine`, dan introspeksi
`gsap.globalTimeline` / `ScrollTrigger.getAll()` saat GSAP terekspos global.

---

## Ringkasan

| Situs | Fondasi | WebGL? | Bisa ditiru? |
|---|---|---|---|
| bryantcodes.art | Next.js + Tailwind, 1 canvas fullscreen | Ya | Sebagian kecil |
| noomoagency.com | Nuxt + Swiper, `three.js r156` | Ya | Hampir tidak |
| **ayocin.com** | Sistem animasi GSAP deklaratif via `data-*` | **Tidak** | **Ya, banyak** |
| **docky.site** | Next.js, GSAP scroll-scrub bernama per-scene | **Tidak** | **Ya, banyak** |
| **elvismao.com** | Astro, canvas 2D ASCII, CSS glitch | Tidak (canvas 2D) | **Ya, ada 1 teknik emas** |
| **raven-trading.com** | Webflow + GSAP 3.12.5 + ScrambleText + Lenis | Ya (sebagian) | **Ya, untuk scramble** |
| labs.chaingpt.org | — | — | **Situs mati** ("Service Suspended") |
| **saisei-sbj.webflow.io** | Webflow + Lenis + GSAP bundled, split-text | **Tidak** | **Ya, banyak** |

**Kesimpulan besar:** empat situs paling relevan untuk proyek ini
(ayocin, docky, saisei, elvismao) **tidak memakai WebGL sama sekali**.
Semua kesan "mahal"-nya datang dari easing, stagger, dan scroll-scrub —
persis yang sudah diputuskan di brief. Ini konfirmasi kuat bahwa keputusan
"tanpa shader" tidak mengorbankan apa pun yang penting.

---

## 1. bryantcodes.art

```
Fondasi   Next.js (pages router) + Tailwind CSS
Canvas    1, fullscreen
Font      Roboto Mono + font kustom 'bryant' (woff)
Kursor    /cursor/terminal.svg, /cursor/paint.svg  ← kursor kustom per-mode
cubic-bezier yang dipakai di CSS: hanya (0.4, 0, 0.2, 1)  ← itu default Tailwind
```

Seluruh motion yang mengesankan hidup di dalam canvas. CSS-nya sendiri
polos (`transition-all duration-300` khas Tailwind). Ini menegaskan yang
sudah ditulis pemiliknya: efeknya GLSL.

**Yang tetap bisa dicuri:** ide kursor kustom yang **berganti bentuk sesuai
konteks** (terminal vs paint) — bukan satu blob yang mengikuti mouse.
Di proyek kita: kursor berubah saat di atas kartu vs di atas teks.
Ingat aturan brief: hanya jika `matchMedia('(pointer: fine)')`.

Trik `height: calc(100 * var(--vh))` dengan `--vh` diset dari JS — solusi
lama untuk address-bar mobile. Sekarang lebih baik pakai `100dvh`.

---

## 2. noomoagency.com — **lewati**

```
Fondasi   Nuxt 3 + Swiper
Canvas    1, data-engine="three.js r156"
```

@keyframes yang ada cuma primitif: `hoverLine` (`translateX(-100%) → 0`),
`preloaderSeq`, `scrollMove` (bob 10px), `priteMove` (marquee).
Semua `transition` yang terpasang di elemen nyata:

```
all | 0.5s | ease-in-out
all | 0.3s | ease-in-out
all | 0.6s | ease-in-out
all | 0.6s | ease-out
```

Yaitu: **easing bawaan** — persis yang dilarang brief. Kelas situs ini
100% dari layer Three.js. Tidak ada yang bisa diambil selain satu hal:
`hoverLine` — garis bawah link yang masuk dari kiri (`translateX(-100%) → 0`)
dan **keluar ke kanan**, bukan mundur ke kiri. Itu contoh murah dari
prinsip asimetri di brief.

---

## 3. ayocin.com — **paling banyak dicuri**

Tanpa canvas sama sekali. Yang mereka bangun adalah **sistem animasi
deklaratif**: markup diberi atribut, satu modul JS membaca atribut itu dan
membangun tween GSAP-nya.

```html
<span data-animation="fade" data-from="0" data-to="0.35"
      data-scrub data-ease="none"
      data-start="bottom bottom" data-end="+=100%"></span>

<div data-animation="parallax" data-start="top top" data-end="bottom top"
     data-start-at="0" data-speed="6"></div>

<div data-animation="moveUp" data-delay="0"></div>
<div data-animation="moveUp" data-delay="0.1"></div>
<div data-animation="moveUp" data-delay="0.2"></div>
```

Kosakata `data-animation` yang mereka pakai:

```
fade  parallax  ambient-move  moveUp  scaleX  split
chained-content  chained-lamp  star-mask  marquee
layers  scale  light-controller  stacked-content  3d-showcase
```

`stacked-content` = teknik 5 di brief (kartu bertumpuk).
`layers` dan `3d-showcase` = varian dari ide yang sama.

Nilai `data-start` / `data-end` yang nyata dipakai:

```
start:  "bottom bottom"  "top top"  "top bottom"
        "top bottom+=100"  "top center-=200"
end:    "+=100%"  "+=200%"  "+=300%"  "+=400%"  "bottom top"  "bottom top-=100"
```

cubic-bezier di CSS-nya:

```
cubic-bezier(0.77, 0, 0.18, 1)      in-out tajam
cubic-bezier(1, 0, 0.25, 0.995)     in-out sangat tajam
cubic-bezier(0.19, 1, 0.22, 1)      ease-out-expo (≈ punya kita)
cubic-bezier(0.215, 0.61, 0.355, 1) ease-out-cubic
cubic-bezier(0.5, 0, 0.5, 1)        in-out simetris
```

**Yang diambil untuk proyek kita:** pola sistemnya, bukan atributnya.
Di React kita tidak butuh `data-*` — padanannya adalah **satu hook
`useReveal(preset, opts)`** dengan preset bernama, supaya semua entrance
di situs memakai kurva dan stagger yang sama. Itu yang membuat situs terasa
satu tangan.

**Catatan kritis:** stagger mereka 0 / 0.1 / 0.2 detik = 100ms.
Brief kita minta 40–80ms. 100ms untuk 3 elemen masih enak; untuk 21 kartu
akan terasa lamban (21 × 0.1 = 2.1 detik). Untuk formasi 21 kartu, pakai
stagger yang **mengecil** (`gsap` `{each: 0.05, from: "random"}` atau
kurva ease pada stagger), bukan linier.

---

## 4. docky.site — **struktur scene**

```
Fondasi   Next.js App Router, GSAP di-bundle (tidak global)
Canvas    0
Video     7, semuanya inline
```

cubic-bezier yang dipakai:

```
cubic-bezier(0, 0, 0.4, 1)      masuk — mulai instan, mendarat lembut
cubic-bezier(0.6, 0, 0.4, 1)    in-out
cubic-bezier(0.3, 1.4, 0.4, 1)  OVERSHOOT  ← sepupu --ease-overshoot kita
cubic-bezier(0.6, 0, 1, 1)      keluar — mempercepat lalu potong
```

Perhatikan pasangan terakhir: **masuk pakai `(0,0,0.4,1)`, keluar pakai
`(0.6,0,1,1)`**. Itu asimetri (prinsip 3 di brief) diterapkan sebagai
kebijakan, bukan improvisasi. Kita tiru persis polanya: satu kurva untuk
masuk, satu kurva berbeda untuk keluar, dipakai global.

Struktur DOM-nya: tiap scene punya kamus atribut sendiri —

```
data-boats-map  data-boats-layer  data-boats-land  data-boats-boat
data-boats-cards  data-boats-card  data-boats-photo  data-boats-phone
data-berths-map  data-berths-layer  data-berths-animation
data-manage-bookings  data-manage-berths  data-manage-chat
```

Satu timeline GSAP per scene, tiap elemen di dalamnya punya nama.
Ini yang membuat animasi scroll panjang tetap bisa dirawat.

**Diambil:** untuk halaman surat dan halaman penutup, jangan menyusun
timeline dari selector CSS. Beri tiap aktor nama eksplisit
(`useRef` bernama, atau `data-act="..."`), lalu satu timeline merujuk nama itu.

---

## 5. elvismao.com — **satu teknik emas untuk halaman Surat**

```
Fondasi   Astro
Canvas    1 — 2D, untuk ASCII art (bukan WebGL)
```

Ini temuan terpenting dari seluruh riset:

```css
.type {
  background: linear-gradient(#fff, #fff) 0% 0% / 0px 100% no-repeat text;
  -webkit-text-fill-color: transparent;
  transition: background-size 2s ease-in;
}
.type.typed { background-size: 100% 100%; }
```

Teks diberi gradient yang di-clip ke bentuk huruf (`background-clip: text`),
lalu **lebar gradient itu** yang dianimasikan dari `0` ke `100%`.
Hasilnya: teks tersingkap kiri-ke-kanan seperti garis baca — **tanpa
memecah teks jadi ratusan span**.

Untuk **halaman Surat** kita, ini jauh lebih baik daripada rencana awal
"tiap kata jadi span lalu di-stagger". Satu properti (`background-size`)
di-scrub oleh ScrollTrigger, bukan 500 elemen. Lebih halus, lebih ringan
di HP, dan `background-size` bukan properti yang memicu layout.

Detail yang harus disesuaikan: gradient-nya bukan putih→transparan tapi
`#2E2A26` (teks pekat) di atas warna dasar `#D8D0C4` (abu pucat) — jadi
warna dasar diset sebagai `color`, dan gradient pekat yang menyapu di atasnya.

Juga ada:

```css
.big-title { opacity: calc(1 - var(--t)); }
```

Satu CSS variable `--t` diperbarui dari JS per frame; CSS yang menurunkan
semua nilai lain. Pola bagus untuk teknik 3 (kecepatan → skew & scale):
JS cukup menulis `el.style.setProperty('--v', velocity)`, CSS yang
menerjemahkan ke `skewX` dan `scaleY`.

Tombol `.cybr-btn` mereka pakai `clip-path: polygon(...)` dengan empat
varian clip yang bergantian + `text-shadow` ganda untuk efek glitch —
murni CSS, tanpa JS. Menarik tapi **estetikanya cyberpunk, bertabrakan
dengan krem hangat kita.** Jangan dipakai.

---

## 6. raven-trading.com — **untuk teknik scramble**

```
Fondasi   Webflow + jQuery + GSAP 3.12.5 (global)
Plugin    ScrollTrigger, ScrollToPlugin, CustomEase, ScrambleTextPlugin
Scroll    Lenis (terlihat dari data-lenis-prevent / data-lenis-stop)
Canvas    1, data-engine="three.js r162"  ← hanya untuk hero
```

Introspeksi `gsap.globalTimeline` saat halaman hidup:

```
tween aktif : 69
properti    : scrambleText, opacity, y, x, z, filter, width, text,
              totalProgress, stagger, ease, duration
easing      : "expo", "power2.inOut", CustomEase (fungsi terkompilasi)
durasi      : 0.5  1.5  1.85  2  2.5  3.4  4  8
ScrollTrigger: 1 saja — { start:"top bottom", end:"bottom bottom", scrub:1.5 }
```

Tiga hal yang perlu dicatat:

1. **`scrambleText` di sini adalah GSAP ScrambleTextPlugin — plugin berbayar
   (GSAP Club).** Ini keputusan yang perlu kamu ambil, bukan aku asumsikan.
   Menulis sendiri butuh ±30 baris dan cukup untuk kebutuhan kita
   (satu judul, sekali jalan). Lihat pertanyaan terbuka di bawah.

2. **`scrub: 1.5`, bukan `scrub: true`.** Angka = jeda kejar dalam detik;
   animasi mengejar posisi scroll dengan lag, bukan terkunci mati padanya.
   Ini yang membuat scroll-scrub terasa punya bobot. **Untuk halaman Surat
   kita, pakai angka (0.8–1.5), jangan `true`.**

3. Durasi scramble mereka **3.4 detik** — jauh di atas pagu 1200ms di brief.
   Itu tidak melanggar: scramble bukan perpindahan elemen, tidak ada yang
   "menunggu selesai". Pagu 1200ms berlaku untuk elemen yang bergerak.
   Perlu ditulis eksplisit di CLAUDE.md supaya tidak jadi kontradiksi.

---

## 7. labs.chaingpt.org — **mati**

Merespons "Service Suspended". Tidak ada yang bisa diamati.
Kalau kamu punya screenshot atau ingat efeknya, ceritakan.

---

## 8. saisei-sbj.webflow.io

```
Fondasi   Webflow + Lenis (class "lenis" di <html>) + GSAP di-bundle
Canvas    0
Split     307 elemen ber-class line/word  ← split per BARIS, bukan per huruf
Sticky    4 elemen position:sticky        ← section bertumpuk
```

cubic-bezier:

```
cubic-bezier(0.25, 1, 0.5, 1)   ease-out-quart  ← IDENTIK dengan --ease-out-quart kita
cubic-bezier(0.22, 1, 0.36, 1)  ease-out-quint
cubic-bezier(0.23, 1, 0.32, 1)  ease-out-quint varian
```

Ketiganya kurva melambat murni. **Tidak ada satu pun overshoot di CSS-nya.**
Overshoot mereka simpan untuk elemen playful saja — sama seperti aturan kita.

Kosakata `data-*`-nya sejenis ayocin tapi lebih ramping:

```
data-anim  data-anims  data-anim-para  data-anim-whipe
data-parallax  data-scroll-parallax  data-big-text  data-big-img
data-appearance  data-loader  data-menu  data-hover  data-theme
```

Dua hal yang paling relevan:

- **Split per baris, bukan per huruf.** 307 span untuk seluruh halaman.
  Kalau di-split per huruf, angkanya akan ribuan dan HP akan tersendat.
  Untuk judul di halaman pembuka kita, split per baris atau per kata —
  per huruf hanya untuk teks teracak (dan itu pun mengubah `textContent`,
  bukan membuat elemen).
- **`position: sticky` untuk section bertumpuk, bukan `pin` GSAP.**
  Hanya 4 sticky, tanpa `pin: true`. Sticky murni CSS jauh lebih mulus
  di mobile daripada ScrollTrigger `pin` (yang mentransform wrapper dan
  sering pecah di iOS Safari). **Untuk teknik 5 kita, mulai dari
  `position: sticky`; pakai ScrollTrigger hanya untuk `scale` dan
  `opacity` section yang tertinggal di belakang.**

---

## Daftar Curian — Yang Masuk ke Spec

1. **Sistem preset, bukan animasi ad-hoc** (ayocin, saisei) —
   satu hook `useReveal` dengan preset bernama.
2. **Asimetri sebagai kebijakan global** (docky) — satu kurva masuk
   `(0.16, 1, 0.3, 1)`, satu kurva keluar `(0.6, 0, 1, 1)`.
3. **`background-clip: text` + `background-size` di-scrub** (elvismao) —
   mesin halaman Surat.
4. **`scrub` bernilai angka, bukan `true`** (raven) — 0.8–1.5.
5. **CSS variable ditulis JS per frame, CSS yang menurunkan transform**
   (elvismao `--t`) — mesin teknik 3 (kecepatan → skew & scale).
6. **`position: sticky` untuk stacking, bukan GSAP `pin`** (saisei).
7. **Split per baris/kata, tidak pernah per huruf** (saisei).
8. **Kursor kustom yang berganti bentuk per konteks** (bryantcodes).
9. **Underline masuk dari kiri, keluar ke kanan** (noomo) — asimetri termurah.

## Yang Sengaja Tidak Diambil

- Semua efek Three.js/GLSL di bryantcodes, noomo, raven.
- Estetika glitch cyberpunk elvismao — bertabrakan dengan krem hangat.
- Stagger 100ms ayocin untuk kumpulan besar — terlalu lamban untuk 21 kartu.
- GSAP `pin: true` untuk section bertumpuk — rapuh di iOS Safari.
