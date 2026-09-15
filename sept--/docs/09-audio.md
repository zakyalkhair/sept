# Tahap 9 — Garis Audio-Reaktif untuk Pemutar Musik

Satu garis tipis horizontal di bawah layar yang bergelombang mengikuti
amplitudo lagu, dibaca lewat Web Audio API. Diam saat jeda, bergerak saat
lagu jalan.

**Ini yang terakhir, dan yang paling boleh dipotong.** Kalau waktu habis di
sini, situs tetap utuh tanpanya. Jangan mulai tahap ini kalau tahap 1–8
belum benar-benar selesai.

---

## 9.1 Kenapa ini bisa jalan

Web Audio API hanya boleh membaca isi audio kalau sumbernya **same-origin**
atau mengirim header CORS yang benar. Itulah sebabnya lagu disimpan sebagai
file di `public/musik/` sejak tahap 3, bukan di CDN.

Kalau nanti file-nya dipindah ke CDN, dua hal wajib: elemen `<audio>` harus
punya `crossOrigin="anonymous"`, dan CDN-nya harus mengirim
`Access-Control-Allow-Origin`. Kalau salah satu tidak ada,
`createMediaElementSource` melempar error — dan yang paling berbahaya:
**audionya ikut mati**, bukan cuma visualnya. Rute audio sudah dialihkan ke
graph Web Audio, dan graph itu tidak pernah tersambung ke speaker.

---

## 9.2 Aturan yang tidak boleh dilanggar

**Satu `AudioContext` untuk seumur hidup halaman.** Chrome lama melempar
error setelah 6 context; batas keras itu sudah lama dihapus, jadi jangan
menulis kode yang berjaga terhadap angka 6. Alasan yang masih berlaku lebih
sederhana: tiap context memegang thread audio dan perangkat keluaran sendiri.
Membuatnya di `useEffect` tanpa penjaga akan menumpuk context tiap navigasi
sampai audio tersendat. Buat sekali, pakai selamanya.

**`createMediaElementSource` hanya boleh dipanggil sekali per elemen.**
Panggilan kedua melempar `InvalidStateError`. Ini penyebab paling umum
"musik tiba-tiba mati setelah pindah halaman".

**`AudioContext` harus dibuat di dalam gestur pengguna.** Sama seperti
`play()`. Tempatnya: di dalam `nyalakan()` yang sudah ada di tahap 3.

**Jangan lupa `source.connect(ctx.destination)`.** Analyser saja tidak
mengeluarkan bunyi. Kalau lupa, visualnya jalan sempurna dan lagunya senyap.

---

## 9.3 Sambungkan ke `MusicContext`

Di `src/lib/MusicContext.jsx`, tambahkan ref dan perluas `nyalakan`.

```jsx
const analyserRef = useRef(null)
const ctxRef = useRef(null)
const sourceRef = useRef(null)

const pasangAnalyser = useCallback(() => {
  const el = audioRef.current
  if (!el || sourceRef.current) return      // sudah dipasang — jangan ulangi

  try {
    const AC = window.AudioContext || window.webkitAudioContext
    const ctx = new AC()
    const source = ctx.createMediaElementSource(el)
    const analyser = ctx.createAnalyser()

    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.82

    source.connect(analyser)
    analyser.connect(ctx.destination)       // WAJIB — tanpa ini tidak ada bunyi

    ctxRef.current = ctx
    sourceRef.current = source
    analyserRef.current = analyser
  } catch {
    /* Browser menolak. Garis akan jatuh ke mode palsu — lagunya tetap jalan. */
    analyserRef.current = null
  }
}, [])
```

Lalu di dalam `nyalakan()`, **sebelum** `el.play()`:

```js
const nyalakan = useCallback(async () => {
  const el = audioRef.current
  if (!el) return false
  pasangAnalyser()
  try {
    if (ctxRef.current?.state === 'suspended') await ctxRef.current.resume()
    el.volume = 0
    await el.play()
    setMain(true)
    fadeKe(VOL_NORMAL)
    return true
  } catch {
    return false
  }
}, [fadeKe, pasangAnalyser])
```

Tambahkan `analyserRef` ke nilai provider, dan bersihkan saat unmount:

```js
useEffect(() => () => { ctxRef.current?.close() }, [])
```

`smoothingTimeConstant: 0.82` sengaja tinggi. Nilai rendah membuat garis
bergetar seperti seismograf — ramai, dan tidak terbaca sebagai musik.

`fftSize: 256` memberi 128 bin frekuensi. Lebih dari cukup untuk satu garis;
2048 hanya membuang CPU.

---

## 9.4 Komponen garis

`src/components/GarisAudio.jsx`

SVG, bukan canvas. 48 titik dan satu `<path>` yang diperbarui per frame jauh
lebih murah daripada menggambar ulang canvas, dan otomatis tajam di layar
retina tanpa mengurus `devicePixelRatio`.

```jsx
import { useEffect, useRef } from 'react'
import { useMusic } from '../lib/MusicContext.jsx'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

const TITIK = 48
const TINGGI = 40

export default function GarisAudio() {
  const { main, mute, analyserRef } = useMusic()
  const reduced = useReducedMotion()
  const pathRef = useRef(null)
  const rafRef = useRef(0)

  useEffect(() => {
    const path = pathRef.current
    if (!path) return

    const datar = `M 0 ${TINGGI / 2} L 1000 ${TINGGI / 2}`

    if (!main || mute || reduced) {
      path.setAttribute('d', datar)
      return
    }

    const analyser = analyserRef.current
    if (!analyser) {
      path.setAttribute('d', datar)
      return
    }

    const buf = new Uint8Array(analyser.frequencyBinCount)
    const halus = new Float32Array(TITIK)

    const gambar = () => {
      analyser.getByteFrequencyData(buf)

      let d = ''
      const per = Math.floor(buf.length / TITIK)

      for (let i = 0; i < TITIK; i++) {
        let jml = 0
        for (let j = 0; j < per; j++) jml += buf[i * per + j]
        const rata = jml / per / 255

        /* Redam ujung kiri-kanan supaya garis menyatu dengan tepi layar. */
        const tepi = Math.sin((i / (TITIK - 1)) * Math.PI)
        const target = rata * tepi

        halus[i] += (target - halus[i]) * 0.25

        const x = (i / (TITIK - 1)) * 1000
        const y = TINGGI / 2 - halus[i] * (TINGGI / 2) * 0.9
        d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `
      }

      path.setAttribute('d', d)
      rafRef.current = requestAnimationFrame(gambar)
    }

    rafRef.current = requestAnimationFrame(gambar)

    return () => cancelAnimationFrame(rafRef.current)
  }, [main, mute, reduced, analyserRef])

  if (!main) return null

  return (
    <svg
      aria-hidden
      viewBox={`0 0 1000 ${TINGGI}`}
      preserveAspectRatio="none"
      className="pointer-events-none fixed bottom-0 left-0 z-[55] h-10 w-full"
    >
      <path
        ref={pathRef}
        d={`M 0 ${TINGGI / 2} L 1000 ${TINGGI / 2}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className="text-ink/35"
      />
    </svg>
  )
}
```

Empat hal yang penting:

**`path.setAttribute` langsung, bukan `setState`.** Ini berjalan 60 kali per
detik. Melewatkannya lewat React akan me-render ulang pohon komponen 60 kali
per detik dan membekukan situs.

**`vectorEffect="non-scaling-stroke"`.** `preserveAspectRatio="none"`
merentang SVG secara horizontal; tanpa flag ini garisnya ikut menipis dan
menebal mengikuti lebar jendela.

**Peredam tepi (`Math.sin`).** Tanpa itu, garis putus mendadak di kiri dan
kanan layar dan terlihat seperti potongan, bukan gelombang.

**`halus[i] += (target - halus[i]) * 0.25`.** Peredaman kedua, di atas
`smoothingTimeConstant` milik analyser. Yang pertama meredam antar-frame,
yang ini meredam per-titik. Dua-duanya diperlukan supaya garis mengalir,
bukan bergerigi.

`z-[55]` — di atas overlay pemutar video (`z-50`), di bawah tombol mute
(`z-60`).

---

## 9.5 Pasang

`src/components/Layout.jsx`:

```jsx
<MusicProvider>
  <div className="min-h-dvh bg-bg text-ink">
    {children}
    <GarisAudio />
    <TombolMute />
  </div>
</MusicProvider>
```

Sebelum `TombolMute` supaya urutan DOM cocok dengan urutan z-index.

---

## 9.6 Kalau Web Audio gagal

Bisa gagal: browser lama, pengaturan privasi ketat, file dipindah ke CDN
tanpa CORS. `analyserRef.current` akan `null` dan garisnya jadi datar.

**Garis datar itu jawaban yang benar.** Jangan buat animasi palsu berbasis
`Math.sin(waktu)` sebagai cadangan — garis yang bergoyang tapi tidak
mengikuti lagu lebih buruk daripada garis diam. Orang akan menyadarinya
dalam sepuluh detik, dan sejak itu seluruh situs terasa palsu.

Yang penting: **lagunya tetap harus berbunyi** meski analyser gagal. `try`
di `pasangAnalyser` sudah menjaganya — kalau `createMediaElementSource`
melempar sebelum sempat menyambung, rute audio tidak pernah dialihkan dan
elemen `<audio>` tetap keluar ke speaker seperti biasa.

---

## Cek — Terakhir

- [ ] Nyalakan musik: garis mulai bergelombang mengikuti lagu.
- [ ] **Cocokkan dengan lagunya.** Bagian keras → gelombang besar, jeda →
      garis mendekati datar. Kalau bergoyang seragam terus, kemungkinan
      besar analyser gagal dan ada fallback palsu yang lolos masuk.
- [ ] Tekan mute: garis jadi datar, dan tetap datar.
- [ ] Unmute: garis hidup lagi tanpa lagu me-restart.
- [ ] Pindah `/pesan` → `/surat` → `/pesan` tiga kali: **musik tetap
      berbunyi**. Kalau mati, `createMediaElementSource` terpanggil dua kali.
- [ ] Console bersih. `InvalidStateError` berarti penjaga `sourceRef` bocor.
- [ ] Buka overlay video: garis masih terlihat di atas latar warna, dan
      tombol mute masih di atas garis.
- [ ] Ubah lebar jendela: tebal garis tidak berubah.
- [ ] `prefers-reduced-motion`: garis datar, musik tetap jalan.
- [ ] HP: buka Performance tab 10 detik. Kalau frame rate turun di bawah
      50fps, turunkan `TITIK` dari 48 ke 32.
- [ ] Navigasi bolak-balik 10 kali, lalu cek di DevTools > Memory: jumlah
      `AudioContext` tetap satu. Kalau bertambah, penjaga `sourceRef` bocor.

---

## Selesai

Kesembilan tahap sudah tertulis. Kalau ada yang tersisa sebelum 20 September,
urutan yang paling berbayar:

1. ~~Ganti 21 nama dummy dengan nama asli~~ — **selesai**, `src/data/messages.js`
   sudah berisi nama sebenarnya.
2. Isi `CLOUD` dan `SUDAH_ADA` di `src/data/video.js` (dua baris, bukan 21
   link) setiap kali rekaman baru masuk. Lihat `docs/02-pesan.md` §2.8.
   Foto ikut di sini juga (`FOTO_ADA`, `SURAT_FOTO_ADA`).
2b. ~~Taruh mp3 di `public/musik/`~~ — **selesai**: dua lagu sudah ada
   (`ingatlah-hari-ini.mp3`, `senja-teduh-pelita.mp3`). Menambah lagu
   cukup lewat `src/data/musik.js`; lihat `docs/03-musik.md` §3.8.
3. Tulis isi surat yang sebenarnya di `src/data/surat.js`.
4. Ganti teks penutup di `src/pages/Penutup.jsx`.
5. Masukkan 21 foto `.webp` ke `public/foto/`.

Nomor 1–4 tidak menyentuh satu baris pun kode komponen. Itu memang tujuannya.
