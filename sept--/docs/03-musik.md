# Tahap 3 — Musik Persisten

> **Diperbarui: DAFTAR PUTAR, bukan satu lagu.** Isinya di
> `src/data/musik.js`; berkasnya di `public/musik/`. Lihat §3.8.
> Saat ini dua lagu: "Ingatlah Hari Ini" (Project Pop) dan
> "Senja Teduh Pelita". Jumlahnya bebas — kode tidak memakai angka tetap
> di mana pun, semuanya membaca panjang array.

Selesai kalau: musik menyala dari tombol di halaman pembuka, tidak restart
saat pindah halaman, mengecil sendiri saat video diputar dan kembali setelah
selesai, berpindah sendiri ke lagu berikutnya saat satu lagu habis, dan ada
tombol mute yang selalu terjangkau.

---

## 3.1 Empat aturan yang tidak bisa ditawar

1. **Browser memblokir autoplay bersuara. Jangan coba akali.** Tidak ada
   trik `muted` lalu `unmute`, tidak ada `AudioContext.resume()` di
   `useEffect`. Musik menyala dari satu tap manusia di halaman pembuka.
   Titik.
2. **Satu elemen `<audio>` untuk seluruh aplikasi**, hidup di atas router.
   Kalau elemennya ada di dalam halaman, pindah route akan me-unmount-nya
   dan lagu mulai dari nol.
3. **Selalu ada tombol mute yang terjangkau.** Ini situs yang mungkin
   dibuka di ruangan berisi orang lain.
4. **File di `public/`, same-origin.** Ini yang membuat Web Audio API
   (tahap 9, garis reaktif) mungkin. Kalau nanti dipindah ke CDN, elemen
   audio wajib `crossOrigin="anonymous"` dan CDN-nya wajib mengirim header
   CORS — kalau tidak, `createMediaElementSource` melempar error dan
   **audionya ikut mati**, bukan cuma visualnya.

---

## 3.2 Provider

`src/lib/MusicContext.jsx`

Elemen `<audio>` ditulis langsung sebagai JSX di dalam provider, bukan
`new Audio()`. Alasannya: React yang mengurus lifecycle-nya, dan
`useRef` ke elemen nyata adalah yang dibutuhkan Web Audio API nanti.

```jsx
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const MusicContext = createContext(null)

const SRC = '/musik/semua-aku-dirayakan.mp3'
const VOL_NORMAL = 0.55
const VOL_DUCK = 0.12
const FADE_MS = 450

export function MusicProvider({ children }) {
  const audioRef = useRef(null)
  const fadeRef = useRef(0)

  const [main, setMain] = useState(false)
  const [mute, setMute] = useState(false)
  const [siap, setSiap] = useState(false)

  /* Fade volume dengan rAF. Tidak pakai transition CSS —
     volume bukan properti CSS. */
  const fadeKe = useCallback((target) => {
    const el = audioRef.current
    if (!el) return

    cancelAnimationFrame(fadeRef.current)

    const awal = el.volume
    const mulai = performance.now()

    const step = (t) => {
      const p = Math.min(1, (t - mulai) / FADE_MS)
      const e = 1 - Math.pow(1 - p, 3)
      el.volume = awal + (target - awal) * e
      if (p < 1) fadeRef.current = requestAnimationFrame(step)
    }

    fadeRef.current = requestAnimationFrame(step)
  }, [])

  const nyalakan = useCallback(async () => {
    const el = audioRef.current
    if (!el) return false
    try {
      el.volume = 0
      await el.play()
      setMain(true)
      fadeKe(VOL_NORMAL)
      return true
    } catch {
      /* Pengguna memblokir audio di level browser. Situs tetap jalan. */
      return false
    }
  }, [fadeKe])

  const toggleMute = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    const baru = !mute
    setMute(baru)
    el.muted = baru
  }, [mute])

  /* Dipanggil pemutar video: kecilkan saat video main, kembalikan setelah. */
  const duck = useCallback((aktif) => {
    if (!main) return
    fadeKe(aktif ? VOL_DUCK : VOL_NORMAL)
  }, [main, fadeKe])

  useEffect(() => () => cancelAnimationFrame(fadeRef.current), [])

  return (
    <MusicContext.Provider
      value={{ main, mute, siap, nyalakan, toggleMute, duck, audioRef }}
    >
      <audio
        ref={audioRef}
        src={SRC}
        loop
        preload="auto"
        onCanPlayThrough={() => setSiap(true)}
      />
      {children}
    </MusicContext.Provider>
  )
}

export const useMusic = () => {
  const c = useContext(MusicContext)
  if (!c) throw new Error('useMusic harus di dalam MusicProvider')
  return c
}
```

**Kenapa `duck` pakai fade dan bukan set langsung:** volume yang turun
mendadak terdengar seperti bug. 450ms cukup untuk terasa disengaja.

---

## 3.3 Pasang di Layout

`src/components/Layout.jsx` — ganti isinya:

```jsx
import { MusicProvider } from '../lib/MusicContext.jsx'
import TombolMute from './TombolMute.jsx'
import { useLenis } from '../hooks/useLenis.js'

export default function Layout({ children }) {
  useLenis()

  return (
    <MusicProvider>
      <div className="min-h-dvh bg-bg text-ink">
        {children}
        <TombolMute />
      </div>
    </MusicProvider>
  )
}
```

`MusicProvider` di **atas** `children` dan di **luar** `AnimatePresence`
(yang ada di `App.jsx`). Kalau terbalik, transisi halaman akan me-unmount
providernya.

---

## 3.4 Tombol nyala di halaman pembuka

`src/components/TombolMasuk.jsx`

Satu tap melakukan dua hal: menyalakan musik dan pindah ke `/pesan`.
Musik dulu, navigasi kemudian — `play()` harus dipanggil di dalam
handler event yang sama dengan tap-nya, kalau ditunda browser menolaknya.

```jsx
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useMusic } from '../lib/MusicContext.jsx'
import { spring, tapPress } from '../lib/motion.js'

export default function TombolMasuk() {
  const { nyalakan } = useMusic()
  const navigate = useNavigate()

  const masuk = async () => {
    await nyalakan()
    navigate('/pesan')
  }

  return (
    <motion.button
      onClick={masuk}
      whileHover={{ scale: 1.05, transition: spring.snap }}
      {...tapPress}
      className="tap rounded-full border border-line bg-ink px-8 py-4 text-bg"
    >
      masuk
    </motion.button>
  )
}
```

`await nyalakan()` tidak memutus rantai gestur: `play()` sudah dipanggil
di frame yang sama, `await` hanya menunggu janjinya selesai. Kalau musik
gagal (pengguna memblokir audio di browser), `nyalakan` mengembalikan
`false` dan navigasi tetap jalan — situs tidak boleh tersandera musik.

**Update tahap 5:** setelah transisi "tinta membludak" (§5.7) dibuat,
`TombolMasuk` memanggil `nyalakan()` **tanpa await** lalu `mulai('/pesan',
…)`. `play()` tetap dipanggil di dalam gestur; navigasi kini ditunda ke
akhir animasi transisi, bukan ke promise audio. Perilaku "situs tidak
tersandera musik" tetap sama.

---

## 3.5 Tombol mute

`src/components/TombolMute.jsx`

Fixed di pojok, di atas segalanya termasuk overlay pemutar video.
Tidak muncul sebelum musik menyala — tombol mute untuk sesuatu yang belum
berbunyi hanya membingungkan.

```jsx
import { motion, AnimatePresence } from 'motion/react'
import { useMusic } from '../lib/MusicContext.jsx'
import { DUR, EASE, tapPress } from '../lib/motion.js'

export default function TombolMute() {
  const { main, mute, toggleMute } = useMusic()

  return (
    <AnimatePresence>
      {main && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { duration: DUR.enter, ease: EASE.in } }}
          exit={{ opacity: 0, transition: { duration: DUR.exit, ease: EASE.out } }}
          onClick={toggleMute}
          {...tapPress}
          aria-label={mute ? 'Nyalakan musik' : 'Matikan musik'}
          aria-pressed={mute}
          className="tap fixed bottom-5 right-5 z-[60] grid place-items-center rounded-full border border-line bg-bg/85 backdrop-blur-sm"
        >
          <Gelombang mati={mute} />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

/* Tiga garis. Bergoyang saat menyala, rata saat mute.
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
```

`z-[60]` di atas `z-50` milik pemutar video — mute harus tetap bisa
ditekan saat video sedang main. Itu justru saat paling dibutuhkan.

**Catatan:** `ease: 'easeInOut'` di goyangan gelombang adalah satu-satunya
tempat easing bawaan diizinkan, karena ini loop ambient tanpa awal dan
akhir — bukan elemen yang masuk atau keluar.

---

## 3.6 Sambungkan ducking ke pemutar video

Di `src/components/Pemutar.jsx` (tahap 2), tambahkan:

```jsx
import { useMusic } from '../lib/MusicContext.jsx'

// di dalam komponen, setelah state lain:
const { duck } = useMusic()

useEffect(() => {
  duck(true)
  return () => duck(false)
}, [duck])
```

Ditaruh di `useEffect` dengan cleanup, bukan di `onClick` tombol tutup.
Alasannya: overlay bisa hilang lewat Escape, geser, tombol tutup, atau
video habis. Cleanup menangkap semuanya sekaligus.

Karena `Pemutar` tetap ter-mount saat pindah ke pesan berikutnya, `duck(true)`
tidak dipanggil ulang — volume tetap kecil sepanjang rangkaian video, dan
baru kembali normal saat overlay benar-benar tutup. Itu yang diinginkan.

---

## 3.7 Halaman pembuka sementara

Tahap 5 yang akan mengisi halaman ini dengan formasi 21 dan teks teracak.
Untuk sekarang cukup ini, supaya tombol masuk bisa diuji:

`src/pages/Pembuka.jsx`

```jsx
import PageShell from '../components/PageShell.jsx'
import TombolMasuk from '../components/TombolMasuk.jsx'

export default function Pembuka() {
  return (
    <PageShell className="flex flex-col items-center justify-center gap-8 p-6 text-center">
      <h1 className="h-display text-[clamp(2.5rem,11vw,6.5rem)]">
        happy birthday
        <br />
        <span className="italic-accent text-coral">Nailah Adlina</span>
      </h1>
      <TombolMasuk />
    </PageShell>
  )
}
```

---

## 3.8 Daftar putar (tambahan)

`src/data/musik.js` — urutan di array = urutan main:

| # | Berkas di `public/musik/` | Judul |
|---|---|---|
| 1 | `ingatlah-hari-ini.mp3` | Ingatlah Hari Ini (Project Pop) |
| 2 | `senja-teduh-pelita.mp3` | Senja Teduh Pelita |

Menambah/mengurangi lagu cukup di array itu — tidak ada angka jumlah lagu
yang dipatok di kode mana pun.

Tiga hal yang menentukan, dan semuanya mudah salah:

1. **SATU elemen `<audio>` yang `src`-nya diganti — bukan tiga elemen.**
   `createMediaElementSource` hanya boleh dipanggil **sekali per elemen**
   (aturan §3.2). Kalau tiap lagu punya elemennya sendiri, analyser —
   garis gelombang di dasar layar — mati begitu lagu berganti. Mengganti
   `src` pada elemen yang sama aman: analyser tetap terpasang.

2. **Atribut `loop` DILEPAS.** Perulangannya sekarang ada di daftar
   (`onEnded` → lagu berikutnya, membungkus di ujung). Kalau `loop`
   ditinggal, lagu pertama mengulang selamanya dan dua lagu lain tidak
   pernah kebagian.

3. **Ganti lagu manual diredam dulu, `onEnded` tidak.** Mengganti `src`
   saat volume masih penuh terdengar sebagai potongan mendadak; tapi lagu
   yang memang sudah habis tidak ada yang perlu diredam. Makanya
   `gantiLagu(arah, redam)` punya dua jalur.

## 3.9 Bar musik — `BarMusik.jsx`

Menggantikan dua elemen mengambang yang dulu terpisah (`TombolMute` di pojok
+ `GarisAudio` melintang di dasar layar). `TombolMute.jsx` **dihapus**;
`GarisAudio.jsx` tinggal jadi visual gelombangnya saja (`absolute inset-0`,
tidak tahu-menahu soal posisi bar).

Isinya: gelombang suara sebagai latar, judul lagu di kiri, tombol ganti lagu
dan mute/nyalakan di kanan, plus **pegangan untuk menyembunyikan/menaikkan**.

**Yang digeser pembungkusnya, bukan badannya.** Pegangan duduk DI ATAS badan
(`top: -1.65rem`) dan ikut tergeser bersamanya — jadi saat bar turun setinggi
badannya, pegangan itulah yang tersisa terlihat di tepi layar. Kalau
pegangannya dipasang sebagai elemen `fixed` terpisah, dia akan tertimpa bar
saat terbuka.

> ⚠️ **`TINGGI_BADAN` di `BarMusik.jsx` dan `height` di `.bar-badan` harus
> sama** (4,5rem). Angka itu dipakai dua kali: sebagai tinggi bar, dan
> sebagai jarak gesernya saat ditutup. Mengubah satu tanpa yang lain
> menyisakan celah atau menenggelamkannya terlalu dalam.

**`Pemutar` diberi `pb-[7rem]`.** Bar ini `z-60`, di atas overlay video
(`z-50`) — supaya mute tetap bisa ditekan saat video main, justru saat
paling dibutuhkan. Tanpa ruang itu, bar menutupi "lewati semua" dan
petunjuk geser di dasar overlay.

### Gelombang: kurva coral berisi, bukan garis rambut gelap

Dua `path` dari data yang sama — satu untuk garisnya, satu kurva yang sama
tapi **ditutup ke dasar** untuk isian bergradasi. Isian itulah yang membuatnya
terbaca sebagai suara, bukan sebagai garis pembatas halaman.

`vectorEffect="non-scaling-stroke"` wajib: tanpa itu
`preserveAspectRatio="none"` ikut meregangkan tebal garisnya — tipis di layar
lebar, tebal di layar sempit.

### Tombol musik tampil SEBELUM musik menyala (kecuali di `/`)

> ⚠️ **Jalan buntu yang sudah pernah terjadi.** `nyalakan()` dulu cuma
> dipanggil dari tombol "masuk" di `/`, dan `TombolMute` digerbangi `main`.
> Begitu halaman di-**refresh** di `/pesan`, `/surat`, atau `/penutup`:
> musik tidak pernah menyala, **dan tidak ada satu pun kontrol untuk
> menyalakannya**. Buntu total — dan dari layar terbaca seperti fitur
> musiknya tidak pernah dibuat.
>
> Ini gampang luput waktu menguji, karena alur normal (klik "masuk" lalu
> maju) selalu benar. Yang salah hanya jalur masuk-langsung/refresh, dan
> itu justru yang paling sering dipakai saat mengembangkan.

Sekarang tombolnya tampil di semua halaman **kecuali `/`**, dan punya dua
peran: **menyalakan** kalau musik belum jalan, **mute/unmute** kalau sudah.
Ikonnya sama — garis rata berarti "tidak ada bunyi", entah karena belum
mulai atau karena di-mute.

`/` dikecualikan supaya halaman pembuka tetap bersih: di sana "masuk" memang
pintu yang dimaksud, dan menaruh tombol musik di sebelahnya cuma memecah
perhatian dari satu-satunya tindakan yang ditawarkan.

**Judul lagu & tombol ganti lagu TETAP TAMPIL** selama musik berjalan.
Syaratnya cuma `main` — tidak ada gunanya sebelum ada yang berbunyi.

> ⚠️ Sempat dibuat "pintar": chip judul hilang sendiri setelah ~4 detik dan
> tombol ganti lagu cuma muncul saat dihover, dengan alasan menjaga pojok
> tetap sepi. Dibuang. Dua-duanya kontrol yang orang butuh **saat mereka
> mencarinya**, dan menyembunyikannya membuat mereka tidak tahu kontrol itu
> ada sama sekali — masalah yang persis sama dengan tombol musik yang dulu
> digerbangi `main`. Menyembunyikan kontrol bukan kesunyian, itu
> menghilangkan fitur.

Perpindahan lagunya tetap terbaca tanpa perlu ada yang disembunyikan:
`key={lagu.judul}` di dalam chip membuat teksnya **bertukar dengan animasi**
saat lagu berganti (`AnimatePresence mode="wait"`).

Ikut terhapus bersamanya: `judulTampil`, `tampilkanJudul()`, `JUDUL_MS`, dan
timer-nya — tidak ada lagi yang memakainya.

### Garis audio: jangan pernah menggambar garis lurus mati

> ⚠️ Dulu, kalau Web Audio ditolak browser atau musik sedang di-mute,
> `GarisAudio` tetap menggambar `M 0 20 L 1000 20` — **garis lurus
> melintasi seluruh lebar layar**. Itu bukan visualisasi apa pun; di atas
> taplak kotak-kotak `/pesan` ia terbaca sebagai garis pembatas halaman
> yang mengganggu.

Sekarang: komponennya **tidak dirender sama sekali** kecuali `main && !mute`,
dan kalau analyser-nya gagal dipasang, elemennya disembunyikan lewat DOM
langsung (bukan `setState` — tidak perlu render tambahan hanya untuk
memutuskan itu). Masuk/keluarnya memudar lewat `AnimatePresence`, tidak
muncul-hilang mendadak.

Ketebalannya juga diturunkan **`text-ink/35` → `text-ink/[0.18]`**: ini
lapisan ambient di tepi layar, bukan elemen yang harus dibaca.

### Satu berkas hilang TIDAK boleh mematikan seluruh lapisan musik

> ⚠️ **Mode gagal yang sudah pernah terjadi.** Lagu pertama di daftar belum
> ada berkasnya → `play()` ditolak → `main` tidak pernah jadi `true` →
> **tombol mute, garis gelombang, dan chip judul semuanya tidak muncul.**
> Dari layar itu terbaca seperti fitur musiknya tidak pernah dibuat, padahal
> cuma satu berkas yang kurang. Dua lagu lain yang sudah ada pun ikut tidak
> pernah berbunyi, karena tidak ada yang melewati lagu pertama.

Dua penjaga sekarang:

1. **`nyalakan()` mencoba berurutan** sampai ada lagu yang benar-benar bisa
   diputar. `el.src` diset **langsung**, tidak menunggu React me-render
   ulang — di dalam loop `await` itu, render berikutnya belum terjadi.
2. **`onError` pada `<audio>`** melompat ke lagu berikutnya kalau berkasnya
   bermasalah saat sedang berjalan. `gagalRef` mencegah putaran tak
   berujung kalau semua berkas bermasalah; dinolkan lagi tiap ada lagu yang
   berhasil berbunyi (`onCanPlayThrough`).

Keduanya menangani "berkas tidak ada" dan "browser memblokir audio" dengan
jalur yang sama — kalau memang diblokir, semuanya gagal dan situs tetap
jalan tanpa musik, seperti sebelumnya.

**Efek "putar lagu baru" dijaga `laguRef`.** Tanpa itu, efeknya ikut menyala
saat mount pertama dan saat `main` berubah — padahal `nyalakan()` sudah
mengurus start pertama, dan menjalankan keduanya membuat volumenya di-fade
dua kali.

**Kontrol di pojok**: chip judul + tombol ganti lagu. Chip muncul karena dua
sebab yang digabung di satu tempat (`judulTampil || dekat`): lagunya baru
berganti sendiri (hilang sendiri setelah ~4 detik), atau kursornya sedang di
situ. Tombol ganti lagu **hanya muncul saat didekati** — di situs sesunyi
ini, dua tombol permanen di pojok terasa ramai.

---

## Cek Sebelum Lanjut ke Tahap 4

- [ ] Muat halaman pembuka: **tidak ada suara sama sekali** sebelum tombol
      ditekan. Kalau ada, ada autoplay yang lolos.
- [ ] Tekan "masuk": musik masuk dengan fade, bukan langsung keras.
- [ ] Pindah `/pesan` → `/surat` → `/pesan`: lagu terus jalan dari posisi
      yang sama, tidak mengulang.
- [ ] Buka video: musik mengecil dalam ~450ms, tidak mendadak.
- [ ] Tutup video: musik kembali ke volume semula.
- [ ] Buka video → "berikutnya" → "berikutnya" → tutup: volume kecil
      sepanjang rangkaian, kembali normal sekali saja di akhir.
- [ ] Tombol mute tampil hanya setelah musik menyala, dan tetap bisa
      ditekan saat overlay video terbuka.
- [ ] Mute lalu unmute: lagu tetap di posisi yang sama, tidak mengulang.
- [ ] Tombol mute ≥44×44px di 375px, tidak menutupi tombol lain.
- [ ] Reload halaman: musik mati lagi dan butuh tap. Ini benar, bukan bug.
- [ ] Network tab: mp3 hanya diunduh sekali, tidak per navigasi.

Daftar putar (§3.8):

- [ ] Biarkan satu lagu habis: **lanjut sendiri** ke lagu berikutnya, dan
      teks di chip judul **bertukar dengan animasi** (bukan berganti
      mendadak, bukan menghilang).
- [ ] Judul lagu & tombol ganti lagu **selalu terlihat** selama musik jalan
      — tidak perlu dihover, tidak hilang sendiri.

Bar musik (§3.9):

- [ ] Tekan pegangan di kanan atas bar: bar turun, **pegangannya tetap
      terlihat** di tepi layar dan panahnya berbalik arah. Tekan lagi:
      naik kembali.
- [ ] Arah panahnya menunjuk **tujuan, bukan keadaan sekarang**: bar
      terbuka → panah ke BAWAH (tekan untuk menurunkan); bar tersembunyi →
      panah ke ATAS.
- [ ] Bar tersembunyi **tidak menyisakan celah** di dasar layar dan tidak
      tenggelam terlalu dalam — `TINGGI_BADAN` dan `.bar-badan` cocok.
- [ ] Keadaan buka/tutupnya **bertahan saat pindah halaman** (bar tinggal di
      `Layout`, tidak ikut mount ulang).
- [ ] Buka video: bar masih di atas overlay dan bisa ditekan, tapi **tidak
      menutupi** "lewati semua" maupun petunjuk geser.
- [ ] Gelombangnya coral berisi (ada gradasi memudar ke bawah), tebal
      garisnya **sama di layar lebar maupun sempit**. Kalau berubah-ubah,
      `vectorEffect` hilang.
- [ ] Setelah lagu TERAKHIR habis: kembali ke lagu pertama, bukan berhenti.
- [ ] **Garis gelombang di dasar layar tetap hidup setelah lagu berganti.**
      Kalau mati, `createMediaElementSource` terpanggil ulang — berarti ada
      lebih dari satu elemen `<audio>`.
- [ ] Tekan tombol ganti lagu: musik **diredam dulu** baru berpindah, tidak
      terpotong mendadak.
- [ ] Ganti lagu saat sedang mute: tetap tidak bersuara (mute tidak lepas
      sendiri).
- [ ] **Hapus sementara satu berkas mp3, lalu tekan "masuk".** Musik tetap
      menyala dari lagu lain, dan tombol mute + garis gelombang tetap
      muncul. Kalau semuanya hilang, penjaga di §3.8 tidak jalan — dan itu
      bug yang paling menyesatkan di sini, karena terlihat seperti fitur
      musiknya tidak ada.
- [ ] Hapus SEMUA mp3: situs tetap jalan normal tanpa musik, tidak ada
      error di console, tidak ada putaran tak berujung di Network tab.
- [ ] **Buka `/pesan` langsung lewat URL (atau refresh di situ).** Tombol
      musik **tetap ada** di pojok kanan bawah walau musik belum menyala,
      dan menekannya menyalakan musik. Ini jalur yang paling sering
      terlewat saat menguji.
- [ ] Ulangi juga di `/surat` dan `/penutup`.
- [ ] Di `/` sebelum menekan "masuk": tombol musik **tidak** ada — halaman
      pembuka sengaja cuma menawarkan satu tindakan.
- [ ] Menyalakan musik lewat tombol pojok: **judul lagu langsung tampil**
      di sebelahnya, dan tetap di situ.
- [ ] **Mute musik: garis di dasar layar ikut hilang** (memudar, bukan jadi
      garis lurus). Unmute: muncul lagi dan bergelombang.
- [ ] Tidak pernah ada garis lurus melintasi layar dalam keadaan apa pun —
      itu bukan visualisasi, cuma coretan.
