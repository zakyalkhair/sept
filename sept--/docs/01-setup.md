# Tahap 1 — Setup, Routing, Palet, Font, Data

Selesai kalau: `npm run dev` jalan, empat route bisa dibuka, palet dan font
sudah benar, `messages.js` terisi 21 entri, dan halaman kosong tiap route
sudah memakai token warna — bukan warna default browser.

---

## 1.1 Buat proyek

**Lewat CMD, bukan PowerShell.**

```cmd
npm create vite@latest 20sept -- --template react
cd 20sept
npm install
npm install tailwindcss @tailwindcss/vite
npm install motion gsap react-router-dom lenis
npm install -D oxlint
```

Jangan install apa pun di luar daftar ini tanpa bertanya.

### `vite.config.js`

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

### `package.json` — tambahkan skrip lint

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "oxlint src"
}
```

---

## 1.2 Struktur folder

Buat ini sekarang, kosongkan yang belum dipakai. Jangan improvisasi struktur
lain di tengah jalan.

```
public/
  foto/                   01.webp .. 21.webp   (belum ada — lihat 1.6)
  musik/
    semua-aku-dirayakan.mp3
src/
  main.jsx
  App.jsx
  index.css
  data/
    messages.js           21 teman: nama, warna tetap, foto, video
    surat.js              tahap 4
    navPanel.js           tahap 7
  lib/
    motion.js             durasi / easing / stagger — satu sumber kebenaran
    colors.js             nama warna → class dan hex
    scatter.js            posisi acak deterministik      tahap 2
    MusicContext.jsx      provider audio                 tahap 3
    formasi.js            geometri angka "21"            tahap 5
  hooks/
    useReducedMotion.js
    usePointerFine.js
    useLenis.js
    useIsDesktop.js       tahap 2
    useProgress.js        tahap 2
    useVelocitySkew.js    tahap 2
    useTextScrub.js       tahap 4
    useScramble.js        tahap 5
    useMagnetic.js        tahap 6
  components/
    Layout.jsx
    PageShell.jsx
    Kartu.jsx             tahap 2
    Pemutar.jsx           tahap 2
    TombolMasuk.jsx       tahap 3
    TombolMute.jsx        tahap 3
    Formasi21.jsx         tahap 5, dipakai ulang tahap 8
    Tombol.jsx            tahap 6, mengganti tombol lama
    Tumpukan.jsx          tahap 7
    GarisAudio.jsx        tahap 9
  pages/
    Pembuka.jsx
    Pesan.jsx
    Surat.jsx
    Penutup.jsx
```

Yang bertanda tahap dibuat nanti. Di tahap 1 cukup buat foldernya dan file
yang tidak bertanda.

---

## 1.3 Font

Inter Tight dan Familjen Grotesk keduanya ada di Google Fonts.
Masukkan di `index.html` — bukan `@import` di CSS (`@import` memblokir
render dan menambah satu round-trip).

```html
<!-- index.html, di dalam <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500&family=Familjen+Grotesk:ital,wght@1,400;1,500;1,700&display=swap"
  rel="stylesheet">
```

Ganti juga `<title>` jadi `20 Sept` dan `lang="id"` di `<html>`.

> **Diperbarui.** Bobot italic **700** Familjen Grotesk ditambahkan
> (`1,700`) untuk angka "21" di `/penutup` (08-penutup §8.6). Tanpa itu
> browser memalsukan tebalnya jadi *synthetic bold* yang bentuknya rusak.
> Ini satu-satunya tempat bobot 700 dipakai — jangan tambah bobot lain tanpa
> alasan sekonkret ini; tiap bobot adalah berkas font tambahan.

---

## 1.4 `src/index.css`

Tailwind v4 dikonfigurasi di CSS, bukan `tailwind.config.js`.
Blok `@theme` mendaftarkan token sehingga `bg-bg`, `text-ink`,
`bg-coral`, `font-display` langsung bisa dipakai sebagai utility.

```css
@import "tailwindcss";

@theme {
  --color-bg:     #FDF8F0;
  --color-ink:    #2E2A26;
  --color-muted:  #8A8279;
  --color-line:   #E3DCD0;
  --color-ghost:  #D8D0C4;

  --color-coral:  #FF7A59;
  --color-kuning: #FFC94A;
  --color-sage:   #7FB99C;
  --color-langit: #6FA8DC;
  --color-lilac:  #B49BE0;

  --color-on-coral:  #5C1F0E;
  --color-on-kuning: #4D3702;
  --color-on-sage:   #123528;
  --color-on-langit: #0E2F4D;
  --color-on-lilac:  #2E1B4D;

  --font-sans:    "Inter Tight", system-ui, sans-serif;
  --font-display: "Familjen Grotesk", Georgia, serif;

  --ease-in:        cubic-bezier(0.16, 1, 0.3, 1);
  --ease-smooth:    cubic-bezier(0.25, 1, 0.5, 1);
  --ease-overshoot: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out:       cubic-bezier(0.6, 0, 1, 1);
}

:root {
  color-scheme: light;
}

html {
  background: var(--color-bg);
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-ink);
  font-family: var(--font-sans);
  font-weight: 400;
  overscroll-behavior-y: none;
}

/* Judul besar. Dipakai lewat class .h-display, bukan diulang di tiap komponen. */
.h-display {
  font-weight: 300;
  letter-spacing: -0.02em;
  line-height: 0.95;
}

/* Aksen italic. Hemat — nama orang, satu-dua kata kunci, caption. */
.italic-accent {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
}

/* Target sentuh minimum. Pasang di semua yang bisa ditekan. */
.tap {
  min-width: 44px;
  min-height: 44px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Catatan Tailwind v4:** token di `@theme` otomatis jadi utility.
`--color-on-coral` menghasilkan `text-on-coral`. Jangan pernah menulis
`text-[#5C1F0E]` di JSX.

---

## 1.5 `src/data/messages.js`

Warna sudah **diacak sekali** dan permanen. Tidak ada `i % 5` — kalau kamu
baca berurutan tidak ada pola yang terlihat. Jangan mengurutkan ulang,
jangan mengacak saat runtime.

> **Diperbarui di tahap 2.** Nilai `warna` di file diatur ulang supaya di
> sebaran `/pesan` tidak ada kartu bersebelahan yang sewarna — lihat
> `docs/02-pesan.md` §2.2. Angka di bawah adalah nilai *lama*; sumber
> kebenaran ada di `src/data/messages.js`.
>
> **Bentuknya juga berubah.** `foto` dan `video` tidak lagi ditulis per
> baris: `messages.js` menyimpan `id`/`nama`/`warna` saja, sisanya
> diturunkan dari id lewat `src/data/video.js`. Lihat `docs/02-pesan.md`
> §2.8 — di situ tempat cloud name dan daftar video yang sudah diunggah.

```js
export const messages = [
  { id: 1,  nama: "Alya",     warna: "kuning", foto: "/foto/01.webp", video: null },
  { id: 2,  nama: "Rian",     warna: "lilac",  foto: "/foto/02.webp", video: null },
  { id: 3,  nama: "Bening",   warna: "coral",  foto: "/foto/03.webp", video: null },
  { id: 4,  nama: "Fajar",    warna: "sage",   foto: "/foto/04.webp", video: null },
  { id: 5,  nama: "Nadia",    warna: "sage",   foto: "/foto/05.webp", video: null },
  { id: 6,  nama: "Gilang",   warna: "kuning", foto: "/foto/06.webp", video: null },
  { id: 7,  nama: "Sekar",    warna: "langit", foto: "/foto/07.webp", video: null },
  { id: 8,  nama: "Bayu",     warna: "lilac",  foto: "/foto/08.webp", video: null },
  { id: 9,  nama: "Tari",     warna: "langit", foto: "/foto/09.webp", video: null },
  { id: 10, nama: "Damar",    warna: "sage",   foto: "/foto/10.webp", video: null },
  { id: 11, nama: "Laras",    warna: "langit", foto: "/foto/11.webp", video: null },
  { id: 12, nama: "Reza",     warna: "kuning", foto: "/foto/12.webp", video: null },
  { id: 13, nama: "Kirana",   warna: "langit", foto: "/foto/13.webp", video: null },
  { id: 14, nama: "Yoga",     warna: "coral",  foto: "/foto/14.webp", video: null },
  { id: 15, nama: "Anggun",   warna: "coral",  foto: "/foto/15.webp", video: null },
  { id: 16, nama: "Bimo",     warna: "kuning", foto: "/foto/16.webp", video: null },
  { id: 17, nama: "Wulan",    warna: "lilac",  foto: "/foto/17.webp", video: null },
  { id: 18, nama: "Satria",   warna: "coral",  foto: "/foto/18.webp", video: null },
  { id: 19, nama: "Melati",   warna: "lilac",  foto: "/foto/19.webp", video: null },
  { id: 20, nama: "Adit",     warna: "sage",   foto: "/foto/20.webp", video: null },
  { id: 21, nama: "Prita",    warna: "coral",  foto: "/foto/21.webp", video: null },
]
```

Nama-nama asli belum diberikan. Saat nanti diganti, **hanya kolom `nama`
yang berubah** — warna tetap, supaya identitas orang tidak bergeser kalau
urutannya berubah.

Kartu dengan `video: null` tetap muncul tapi belum bisa dibuka.

---

## 1.6 Foto placeholder

Foto asli belum ada. **Jangan buat file gambar dummy.** Kartu merender
kotak warna aksen orangnya dengan inisial namanya di tengah, dan baru
menampilkan `<img>` kalau file-nya benar-benar ada.

Komponen kartu (tahap 2) menangani ini dengan `onError` yang menyembunyikan
`<img>` sehingga latar berwarna di bawahnya yang terlihat. Tidak perlu
request 404 berulang — `onError` hanya jalan sekali per gambar.

Saat foto asli sudah ada, taruh di `public/foto/01.webp` … `21.webp`,
`.webp`, lebar maksimal 1600px. Tidak ada perubahan kode yang diperlukan.

---

## 1.7 `src/lib/colors.js`

Satu-satunya tempat nama warna diterjemahkan jadi class.
Jangan menyusun class dengan template string (`bg-${warna}`) — Tailwind
memindai kode sebagai teks dan tidak akan menemukan class yang dirakit
saat runtime, jadi CSS-nya tidak akan ikut ter-build.

```js
export const ACCENTS = ['coral', 'kuning', 'sage', 'langit', 'lilac']

const BG = {
  coral:  'bg-coral',
  kuning: 'bg-kuning',
  sage:   'bg-sage',
  langit: 'bg-langit',
  lilac:  'bg-lilac',
}

const ON = {
  coral:  'text-on-coral',
  kuning: 'text-on-kuning',
  sage:   'text-on-sage',
  langit: 'text-on-langit',
  lilac:  'text-on-lilac',
}

const HEX = {
  coral:  '#FF7A59',
  kuning: '#FFC94A',
  sage:   '#7FB99C',
  langit: '#6FA8DC',
  lilac:  '#B49BE0',
}

const ON_HEX = {
  coral:  '#5C1F0E',
  kuning: '#4D3702',
  sage:   '#123528',
  langit: '#0E2F4D',
  lilac:  '#2E1B4D',
}

export const bgClass = (w) => BG[w] ?? BG.coral
export const onClass = (w) => ON[w] ?? ON.coral

/* Hanya untuk nilai yang dianimasikan Motion/GSAP — di situ class tidak berlaku. */
export const bgHex = (w) => HEX[w] ?? HEX.coral
export const onHex = (w) => ON_HEX[w] ?? ON_HEX.coral
```

---

## 1.8 `src/lib/motion.js`

Semua angka gerak hidup di sini. Kalau ada durasi atau easing tertulis
sebagai literal di dalam komponen, itu bug.

```js
export const EASE = {
  in:        [0.16, 1, 0.3, 1],
  smooth:    [0.25, 1, 0.5, 1],
  overshoot: [0.34, 1.56, 0.64, 1],
  out:       [0.6, 0, 1, 1],
}

export const DUR = {
  micro: 0.2,
  enter: 0.6,
  exit:  0.45,
  page:  0.8,
}

/* Stagger mengecil. Untuk 21 elemen, linier terasa lamban;
   power2.in membuat ekornya rapat. */
export const stagger = (count, total = 0.9) => (i) =>
  total * Math.pow(i / Math.max(count - 1, 1), 2)

export const spring = {
  soft:  { type: 'spring', stiffness: 220, damping: 26, mass: 0.9 },
  snap:  { type: 'spring', stiffness: 420, damping: 30, mass: 0.7 },
  loose: { type: 'spring', stiffness: 120, damping: 18, mass: 1.1 },
}

/* Asimetri sebagai kebijakan: masuk pakai EASE.in, keluar pakai EASE.out. */
export const reveal = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: DUR.enter, ease: EASE.in } },
  exit:    { opacity: 0, y: -12, transition: { duration: DUR.exit, ease: EASE.out } },
}

/* Padanan sentuh wajib — dipasang di semua yang bisa ditekan. */
export const tapPress = {
  whileTap: { scale: 0.94 },
  transition: spring.snap,
}
```

---

## 1.9 Hook lingkungan

### `src/hooks/useReducedMotion.js`

Motion punya `useReducedMotion` sendiri, tapi kita butuh nilainya juga di
kode GSAP. Satu hook, satu sumber.

```js
import { useEffect, useState } from 'react'

export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = (e) => setReduced(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  return reduced
}
```

### `src/hooks/usePointerFine.js`

Gerbang untuk kursor kustom dan efek magnetik. Kalau `false`, **jangan
pasang listener `mousemove` sama sekali** — bukan sekadar menyembunyikan
hasilnya.

```js
import { useEffect, useState } from 'react'

export function usePointerFine() {
  const [fine, setFine] = useState(
    () => window.matchMedia('(pointer: fine)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    const on = (e) => setFine(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  return fine
}
```

---

## 1.10 Smooth scroll — Lenis

Satu instans untuk seluruh aplikasi, dipasang di `Layout`.
**Wajib dimatikan kalau `prefers-reduced-motion`** — smooth scroll adalah
gerak yang tidak diminta pengguna.

GSAP ScrollTrigger harus tahu Lenis yang menggerakkan scroll, kalau tidak
posisi trigger akan meleset. Baris `lenis.on('scroll', ScrollTrigger.update)`
itu yang menyambungkannya.

`src/hooks/useLenis.js`:

```js
import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from './useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

export function useLenis() {
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return

    const lenis = new Lenis({
      autoRaf: false,          // WAJIB — kita yang menjalankan raf lewat gsap.ticker
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [reduced])
}
```

`autoRaf: false` wajib. Secara default Lenis menjalankan loop `requestAnimationFrame`-nya
sendiri; karena kita sudah memanggil `lenis.raf()` dari `gsap.ticker`, tanpa flag ini
ada **dua loop** yang berjalan dan scroll terasa dobel/tersendat.

`syncTouch: false` disengaja. Di mobile, smooth scroll buatan terasa lebih
buruk daripada scroll asli sistem — dan menghabiskan baterai.

---

## 1.11 Routing

### `src/main.jsx`

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
```

`BrowserRouter`, bukan `HashRouter` — Vercel menangani SPA fallback sendiri.

Kita memakai React Router **declarative mode** (elemen `<Routes>`, tanpa `routes.ts`,
tanpa loader, tanpa SSR). Pola `<Routes location key>` di dalam `AnimatePresence`
hanya sah di mode ini. **Jangan pindah ke framework mode** — di sana `<Routes>`
tidak ada, dan animasi keluar bertabrakan dengan data-loading router.

### `src/App.jsx`

`AnimatePresence` dengan `mode="wait"` supaya halaman lama selesai keluar
sebelum yang baru masuk. `key={location.pathname}` wajib, kalau tidak
Motion tidak tahu halamannya berganti.

**Jangan pakai `initial={false}` di sini.** Itu mematikan animasi mount
**semua** elemen di render pertama — termasuk kartu terbang masuknya
`Formasi21` di tahap 5. `CLAUDE.md` minta pembuka selalu tampil penuh tiap
kunjungan, jadi refresh `/` harus memainkan seluruh urutan, bukan cuma
scramble. Konsekuensinya: transisi masuk `PageShell` (fade-up 0,8s) ikut
jalan di load pertama tiap route — itu diinginkan.

**Scroll-to-top saat pindah route.** React Router declarative tidak reset
scroll. Tanpa ini, pindah dari `/pesan` (tinggi ~4 layar karena tumpukan
tahap 7) ke `/penutup` mendarat di posisi scroll lama. `App.jsx` merender
`<ScrollToTop pathname={location.pathname} />` yang memanggil
`lenisRef.current.scrollTo(0, { immediate: true })` — atau `window.scrollTo`
kalau Lenis mati (reduced-motion). `lenisRef` diekspor dari `useLenis.js`;
`window.scrollTo` saja tidak cukup karena Lenis melawannya.

```jsx
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import Layout from './components/Layout.jsx'
import Pembuka from './pages/Pembuka.jsx'
import Pesan from './pages/Pesan.jsx'
import Surat from './pages/Surat.jsx'
import Penutup from './pages/Penutup.jsx'

export default function App() {
  const location = useLocation()

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"        element={<Pembuka />} />
          <Route path="/pesan"   element={<Pesan />} />
          <Route path="/surat"   element={<Surat />} />
          <Route path="/penutup" element={<Penutup />} />
          <Route path="*"        element={<Pembuka />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  )
}
```

### `src/components/Layout.jsx`

Tempat Lenis dipasang, dan nanti tempat provider musik membungkus semuanya
(tahap 3). Sengaja tipis.

```jsx
import { useLenis } from '../hooks/useLenis.js'

export default function Layout({ children }) {
  useLenis()

  return (
    <div className="min-h-dvh bg-bg text-ink">
      {children}
    </div>
  )
}
```

### Transisi halaman — `src/components/PageShell.jsx`

Tiap halaman membungkus dirinya dengan ini supaya transisinya seragam.
Durasi `DUR.page` (800ms), asimetris: masuk naik dengan `EASE.in`,
keluar turun dengan `EASE.out`.

```jsx
import { motion } from 'motion/react'
import { DUR, EASE } from '../lib/motion.js'

export default function PageShell({ children, className = '', tanpaGeser = false }) {
  const props = tanpaGeser
    ? {
        initial: false,
        animate: { opacity: 1 },
        exit: { opacity: 0, transition: { duration: DUR.page * 0.5, ease: EASE.out } },
      }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0, transition: { duration: DUR.page, ease: EASE.in } },
        exit: { opacity: 0, y: -10, transition: { duration: DUR.page * 0.6, ease: EASE.out } },
      }

  return (
    <motion.main {...props} className={`min-h-dvh ${className}`}>
      {children}
    </motion.main>
  )
}
```

**`tanpaGeser`** untuk halaman yang berisi elemen ber-`layoutId` (kartu di
`/pesan`). Transform `y` pada `motion.main` induk membuat pengukuran layout
Motion untuk `layoutId` meleset saat mount → 21 kartu "glitch"/melompat
sepersekian detik ketika halaman muncul. Dengan `tanpaGeser`, transisi jadi
opacity murni dan `initial={false}` (kemunculan kartu instan; di jalur
normal ditutupi transisi "warna membludak" §5.7). `/pesan` mengopernya.

---

## 1.12 Halaman kosong

Empat file, semuanya bentuk yang sama. Tujuannya cuma membuktikan routing,
palet, dan font sudah benar — bukan mendesain apa pun.

`src/pages/Pesan.jsx` (tiga lainnya identik, ganti teks dan link):

```jsx
import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell.jsx'

export default function Pesan() {
  return (
    <PageShell className="flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="h-display text-[clamp(3rem,12vw,7rem)]">
        21 pesan
      </h1>
      <p className="text-muted">
        untuk <span className="italic-accent text-coral">Nailah Adlina</span>
      </p>
      <Link to="/" className="tap grid place-items-center underline underline-offset-4">
        kembali
      </Link>
    </PageShell>
  )
}
```

---

## 1.13 Deploy

`vercel.json` di root — Vercel biasanya mendeteksi Vite sendiri, tapi
menuliskannya menghilangkan satu kemungkinan gagal:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Tanpa ini, membuka `situs.com/pesan` langsung akan 404.

---

## Cek Sebelum Lanjut ke Tahap 2

- [ ] `npm run dev` jalan tanpa error di CMD.
- [ ] Keempat route bisa dibuka dan transisinya terasa (bukan lompat).
- [ ] Latar krem `#FDF8F0`, bukan putih. Cek dengan color picker, jangan
      percaya mata.
- [ ] Inter Tight benar-benar termuat — cek di DevTools > Network > Font.
      Kalau fallback ke system-ui, link Google Fonts salah.
- [ ] Familjen Grotesk hanya muncul di kata yang ber-class `italic-accent`.
- [ ] `messages.js` 21 entri, tidak ada tiga warna sama berturut-turut.
- [ ] Buka DevTools > Rendering > centang "Emulate prefers-reduced-motion:
      reduce" — transisi halaman jadi instan, smooth scroll mati.
- [ ] Viewport 375px: tidak ada scroll horizontal di satu route pun.
- [ ] `npm run lint` bersih.
