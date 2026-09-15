# Tahap 8 — Halaman Penutup

Setelah semua pesan dibuka, kartu terbang kembali dan merakit angka "21"
sekali lagi — tapi sekarang semuanya sudah terbuka, warnanya berbeda.
Memberi rasa selesai.

**Halaman ini memakai ulang `Formasi21` dari tahap 5.** Jangan menulis
komponen formasi kedua. Kalau ada dua implementasi, keduanya akan bergeser
dan angka 21 di awal dan akhir tidak akan terlihat sama.

Teknik: **2 (kartu merakit formasi)** sebagai inti. Halaman ini semula
dirancang benar-benar diam; atas permintaan, ditambahkan tiga lapisan
ambient yang tetap ringan (§8.5) — bukan teknik berat baru, semuanya
bergerbang `prefers-reduced-motion`.

> **Checkpoint.** Sebelum §8.5, snapshot versi tenang disimpan di
> `scratchpad/penutup-checkpoint/` (`Penutup.jsx`, `Formasi21.jsx`,
> `index.css`, doc). Kalau lapisan ambient tidak disukai: kembalikan tiga
> file itu, hapus `LatarLebur.jsx` + `useFormasiTilt.js`, buang prop
> `hidup` dari `Formasi21`.

---

## 8.1 Apa yang berbeda dari pembuka

> ⚠️ **DIGANTI — lihat §8.6.** Rencana "formasi yang sama, dibalik" di bawah
> sudah tidak dipakai. Alasannya tetap layak dibaca, tapi keputusannya
> terbukti salah di layar: bedanya terlalu halus, dan orang tidak
> memperhatikan di halaman terakhir.

Formasi yang sama, tiga perbedaan:

```
Pembuka                          Penutup
kartu masuk urutan 1 → 21        urutan 21 → 1
semua kartu cerah                kartu yang sudah dibuka pudar (saturate 0.5)
formasi memudar ke 30% + blur    formasi tetap penuh, bernafas + ikut kursor
judul menimpa di tengah          judul di bawah, scramble-in
latar krem polos                 wash 5 warna aksen + satu beat perayaan
```

Urutan terbalik itu yang membuatnya terasa "pulang", bukan "datang lagi".
`Formasi21` sudah menanganinya lewat `varian="pulang"` — tidak ada kode baru.

Kartu pudar itulah seluruh maknanya: dia bisa melihat sendiri bahwa dua puluh
satu orang sudah didengar.

---

## 8.2 Halaman

`src/pages/Penutup.jsx`

Lihat `src/pages/Penutup.jsx` untuk versi lengkap. Kerangkanya:

```jsx
<PageShell className="relative isolate flex min-h-dvh flex-col items-center
                      justify-center gap-12 overflow-hidden px-6 py-[9vh]">
  <LatarLebur />                          {/* §8.5.2 — z-0 */}
  {!reduced && selesai && <BeatPerayaan />} {/* §8.5.3 — z-20 */}

  <div className="relative z-10">
    <Formasi21 varian="pulang" dibuka={dibuka} hidup   {/* §8.5.1 */}
      onSelesai={() => setSelesai(true)} />
  </div>

  <motion.div /* teks, z-10, muncul saat `selesai` */>
    <p className="h-display …">
      <span className="scramble block">{baris1}</span>       {/* useScramble */}
      <span className="scramble italic-accent block text-coral">{baris2}</span>
    </p>
    <p className="max-w-[26rem] text-muted">{kosong ? … : …}</p>
    <Link to="/pesan" className="link-garis …">kembali ke pesan</Link>
  </motion.div>
</PageShell>
```

`isolate` mengurung z-index jadi lokal. `overflow-hidden` aman di sini —
halaman ini tidak punya `sticky`. Judul di-scramble-in (`useScramble`,
sama seperti pembuka) alih-alih fade — menggemakan pembukaan.

Teks penutup ini masih dummy — ganti dengan kalimatmu sendiri. Yang penting
dipertahankan: **kalimatnya pendek.** Halaman ini bekerja lewat formasi
kartu yang pudar, bukan lewat kata-kata. Paragraf panjang di sini akan
bersaing dengan efeknya dan dua-duanya kalah.

`{dibuka.size} pesan sudah dibuka` disengaja tidak ditulis "21 dari 21" —
kalau ada video yang tidak jadi direkam, angka itu tidak akan pernah tercapai
dan kalimatnya jadi terasa seperti tugas yang belum selesai.

---

## 8.3 Kalau dia sampai ke sini tanpa membuka apa-apa

Bisa terjadi: `/penutup` diketik langsung di URL, atau `localStorage`
terhapus. Formasi tetap jalan, semua kartu cerah, dan kalimatnya jadi
"0 pesan sudah dibuka" — yang terbaca seperti bug.

`Tumpukan` (tahap 7) sudah mengunci link ke halaman ini, tapi URL langsung
tidak bisa dikunci tanpa membuat situs terasa curiga pada pemakainya.

Perbaikan yang cukup, di dalam komponen:

```jsx
const kosong = dibuka.size === 0
```

lalu ganti paragraf kedua:

```jsx
<p className="max-w-[26rem] text-muted">
  {kosong
    ? 'Pesan-pesannya belum dibuka. Mulai dari sana dulu.'
    : `${dibuka.size} pesan sudah dibuka. Kartunya tetap di sini kalau mau ditonton lagi.`}
</p>
```

Tidak ada redirect. Memaksa orang pindah halaman karena mereka datang dari
arah yang salah selalu terasa lebih buruk daripada satu kalimat yang jujur.

---

## 8.4 Satu hal yang harus diperiksa berdua

Buka `/` dan `/penutup` di dua tab, foto layar keduanya saat formasi selesai,
lalu tumpuk gambarnya.

**Angka 21-nya harus persis di posisi yang sama.** Kalau bergeser, ada
sesuatu di salah satu halaman yang mengubah lebar wadah — biasanya `gap`
atau `padding` di `PageShell` yang berbeda. Formasi yang bergeser antara
awal dan akhir merusak seluruh gagasan "kembali".

**Catatan implementasi:** `/` memusatkan formasi (judul `absolute`
menimpanya), sedangkan `/penutup` memakai `flex-col … justify-center` dengan
teks di bawah — jadi formasi di `/penutup` duduk **sedikit lebih tinggi**
dari tengah. Lebar dan ukurannya sama (`w-[min(78vw,44rem)]`), jadi angkanya
tetap terbaca konsisten. `py-[9vh]` memberi ruang napas di atas dan
`ScrollToTop` (tahap 1) memastikan halaman mendarat dari atas, bukan dari
posisi scroll `/pesan`. Kalau uji tumpuk gambar masih menunjukkan
pergeseran vertikal yang mengganggu, buat teksnya `absolute bottom-[…]`
seperti tombol di `/`.

---

## 8.5 Lapisan ambient (tambahan)

Tiga lapisan, semuanya mati di `prefers-reduced-motion`, tidak ada yang
menambah loop `rAF` permanen tanpa gerbang.

### 8.5.1 Formasi bernafas + ikut kursor — `hidup` prop di `Formasi21`

`Formasi21` menerima prop baru `hidup` (default `false`, jadi pembuka tahap
5 **tidak berubah**). Kalau `hidup` dan formasi sudah mendarat:

- **Bernafas:** grid dianimasikan `scale: [1, 1.014, 1]` loop 6,5s
  `easeInOut`. Satu animasi Motion, bukan 21. `easeInOut` diizinkan di sini
  — loop ambient tanpa awal/akhir, sama seperti gelombang tombol mute.
- **Ikut kursor:** `useFormasiTilt(aktif)` — **satu** listener `pointermove`
  di `window` (bukan per-kartu), memiringkan seluruh wadah `rotateX/rotateY`
  maks 7° dengan `useSpring`. Bergerbang `usePointerFine` +
  `useReducedMotion` + `IntersectionObserver` (root formasi keluar layar →
  kembali ke 0, listener idle). `transformPerspective: 900` di wadah.

Trigger "mulai bernafas" ada di `onAnimationComplete` kartu terakhir
(event handler), bukan di `useEffect` — supaya tidak kena
`set-state-in-effect`.

### 8.5.2 Wash warna melebur — `LatarLebur.jsx`

Lima `<div>` warna aksen bertumpuk, `absolute inset-0 z-0`, masing-masing
`animation: latar-lebur 17s ease-in-out infinite` dengan `animation-delay`
negatif berbeda (`-3.4s` × index). Keyframe cuma `opacity: 0 → 0.06 → 0`.

Murni CSS: tidak ada `rAF`, browser otomatis menjeda saat tab tak terlihat.
Di `prefers-reduced-motion` komponen `return null` **dan** ada override
`.latar-lebur { animation: none }` di `index.css` sebagai jaring kedua.

Menyambung ke teknik 4 ("kartu melebur jadi layar") — di akhir, warna-warna
temannya yang melebur jadi latar.

### 8.5.3 Satu beat perayaan — DIHAPUS

> ⚠️ Array `BEAT` (5 kartu kecil melesat dari tepi bawah ke luar layar) sudah
> dibuang dari `Penutup.jsx`. Sejak halaman ini jadi kartu ucapan tercetak
> (§8.6), lima kotak warna melesat terasa nyasar dari komponen lama, bukan
> bagian dari kartunya. Bagian ini disimpan sebagai riwayat saja — jangan
> dipasang ulang di sini.

---

## 8.6 Kartu ucapan tercetak (menggantikan formasi)

Formasi 21 **dihapus dari halaman ini**. Yang dipakai `/` dan `/penutup`
sama-sama formasi kartu — di layar itu terbaca sebagai halaman yang sama,
dan tiga perbedaan di §8.1 (urutan terbalik, kartu pudar, judul di bawah)
terlalu halus untuk tertangkap di halaman terakhir.

Gantinya: **kartu ucapan tercetak** berisi **21 nama sungguhan**. Isinya yang
sama — "dua puluh satu orang sudah didengar" — tapi ditunjukkan lewat nama,
bukan lewat kotak warna.

### Emboss buta vs bertinta

Mekanik utamanya, dan yang paling kusuka dari halaman ini:

- Nama yang videonya **sudah ditonton** → **bertinta** (`.nama-tinta`), plus
  titik kecil berwarna kartunya sebagai tanda baca.
- Yang **belum** → **emboss buta** (`.nama-emboss`): huruf ditekan ke kertas
  **tanpa tinta**, terbaca hanya dari bayangannya. Ini teknik cetak undangan
  sungguhan, dan artinya kebetulan pas — yang sudah didengar punya tinta.

Arah bayangannya menentukan segalanya: **gelap di ATAS, sorot terang di
BAWAH**. Dibalik, hurufnya terlihat *timbul* (emboss), bukan *tertekan*
(deboss) — dan efeknya hilang.

### Hover pada nama — DIHAPUS

> ⚠️ **Riwayat: diganti tiga kali, lalu dihapus seluruhnya.**
> 1. Miring statis (`rotate` diam).
> 2. `cap-tekan` — `@keyframes` yang memantul. Dievaluasi **"efeknya
>    lompat"** — dibuang.
> 3. Coral tegas + tebal + glow tipis + membesar, murni `transition`. Sempat
>    dibedakan per status (sudah/belum ditonton), lalu diminta disatukan
>    supaya kedua jenis nama bereaksi identik.
> 4. **Dihapus total**, bukan diganti lagi.
>
> `.nama-cetak` sekarang murni penampung posisi
> (`position: relative; display: inline-block;`) — tidak ada `:hover` yang
> menyentuhnya di mana pun. Bobot 700 Inter Tight yang sempat ditambahkan
> untuk hover-bold (`;700` di URL Google Fonts, `index.html`) **dibiarkan
> tetap dimuat** — tidak salah untuk ada, dan mencabutnya cuma menghapus
> jaring pengaman kalau bobot itu dipakai lagi nanti.

Nama dibungkus `<span>` sendiri, tidak langsung di `<li>` — ini bertahan
walau hover sudah tidak ada, karena alasannya bukan soal hover:  Motion
menulis `transform` **inline** ke elemen yang dianimasikannya (animasi masuk
`y`), dan style inline akan **mengalahkan** aturan CSS apa pun di elemen
yang sama. Kalau nanti ada gaya baru untuk nama, taruh di `<span>` bagian
dalam ini. Jebakan yang sama dengan `zIndex` inline vs `:hover` di 02-pesan.

### Angka "21"

Ditulis sebagai **angka**, bukan dieja, supaya jadi jangkar mata di halaman
ini: **Familjen Grotesk italic 700, coral, 1,42em** dari sisa judulnya.
Perbedaan **font**-nya (sisa judul memakai Inter Tight) yang membuatnya
terbaca sebagai angka yang ditempel, bukan sebagai bagian kalimat.

- Bobot **700 harus ditambahkan ke URL Google Fonts** di `index.html`
  (`1,700`). Sebelumnya hanya 400 & 500 yang dimuat, dan browser akan
  memalsukannya jadi tebal sintetis yang bentuknya rusak.
- Angkanya **tidak ikut scramble**. Angka yang teracak terbaca sebagai galat,
  bukan sebagai tulisan yang sedang terbentuk — jadi dia dapat animasi
  masuknya sendiri (pegas kecil), dan yang di-scramble tinggal "wishes".
  Prinsip ini sekarang juga dipasang di dalam `useScramble` sendiri (hanya
  huruf yang diacak, lihat 05-pembuka §5.4), jadi "21st" di baris foil pun
  aman tanpa penanganan khusus.

> **Teks judul:** `21` + `wishes` / `for 21st birthday`. Sebelumnya
> `21 orang,` / `satu Nailah`. Sama dengan header `/pesan`; `/` **sengaja
> beda** — di sana baris keduanya "for Nailah Adlina" (menyapa orangnya,
> lihat 05-pembuka §5.4).

> Ada **dua** aksen di judul ini: coral pada "21" dan foil emas pada baris
> keduanya. Kalau nanti terasa berebut, yang dilepas foil-nya — angkanya
> yang membawa isi.

### Baris hitungan: dihapus

Dulu ada kalimat "N dari 21 nama sudah bertinta…". Dibuang: daftar namanya
**sudah** mengatakan hal yang sama — mana yang bertinta, mana yang masih
tertekan — jadi menghitungnya lagi cuma mengulang dengan kata-kata, dan
menambah baris teks di halaman yang justru butuh sunyi.

### Foil emas

Satu-satunya emas di seluruh situs, dipakai **hanya di baris kunci**
("for 21st birthday"). Karena cuma sekali, dia yang menahan bobot halaman
ini; kalau emasnya di banyak tempat, langsung terbaca murah.

Gradasinya **tiga titik** (tua → terang → tua) lalu digeser pelan
(`@keyframes foil-sapu`, 7s). Itu yang membedakan foil dari sekadar teks
kuning: logam menangkap cahaya di **satu pita sempit**, tidak bersinar rata.
Mesinnya `background-clip: text` — sama dengan mesin scrub surat versi lama
(04-surat §4.1), dipakai ulang untuk hal yang memang cocok.

Tepi emas kartunya **setipis rambut** (`0 0 0 1px`, alpha 0.28). Lebih tebal
dari itu langsung terbaca murah.

### Yang tetap

`LatarLebur` (wash 5 warna) dan `BEAT` (lima kartu melesat) dipertahankan —
keduanya latar, bukan isi, jadi tidak ikut membuat halaman terasa kembar.

### Sisa yang belum dibereskan

`Formasi21` sekarang **hanya dipakai `/`**. Jalur `varian="pulang"`, prop
`hidup`/`dibuka`, dan hook `useFormasiTilt` jadi tidak terpakai. Sengaja
belum dihapus — kalau keputusan ini dibalik, semuanya masih utuh.

---

## 8.7 Konfeti — versi `tenang`

Aturan lengkap, mekanik, dan alasan bentuknya ada di
[04-surat.md §4.8](04-surat.md); jangan diduplikasi di sini. Yang khusus
halaman ini cuma satu keputusan, dan keputusan itu **membatasi**:

`/penutup` **tidak men-scroll** — satu kartu di tengah, `overflow-hidden`,
semuanya masuk sekali jalan. Padahal seluruh nyawa efek itu ada pada
kerapatan yang bereaksi pada scroll. Jadi di sini masukannya memang tidak
ada, dan menyamakan pengaturannya dengan `/surat` hanya menghasilkan versi
lemah dari efek di sana: jatuh terus dengan kerapatan tetap — persis
"wallpaper bergerak" yang dihindari §4.8.

Maka perannya sengaja dibedakan, bukan disamakan:

```jsx
<Konfeti tenang className="z-[1]" />
```

- `tenang` → 9 kepingan (6 di HP), jatuhnya ~2× lebih lambat, `aduk` tidak
  pernah dihitung sama sekali, semua ambang `0`.
- `z-[1]` → **di belakang kartu** (kartunya `z-10`), di depan `LatarLebur`
  (`z-0`). Di `/surat` kepingannya di DEPAN kertas; di sini tidak, karena
  kartu ucapan dengan foil dan emboss itulah yang harus dibaca lebih dulu.

Ini juga menjaga janji §8.5: tetap tidak ada loop rAF yang tidak bergerbang
— `Konfeti` tidak me-render apa pun saat `prefers-reduced-motion`.

---

## Cek Sebelum Lanjut ke Tahap 9

- [ ] `/penutup` **tidak lagi terlihat seperti `/`** dalam sekali lihat.
      Buka keduanya berdampingan.
- [ ] 21 nama tampil. Yang sudah ditonton **bertinta + bertitik warna**;
      sisanya **tertekan ke kertas** (terbaca dari bayangan, bukan dari
      warna abu).
- [ ] Nama emboss terlihat **tertekan**, bukan timbul. Kalau timbul, arah
      `text-shadow`-nya terbalik.
- [ ] Buka beberapa pesan → kembali ke `/penutup`: yang bertinta bertambah.
- [ ] Foil di "for 21st birthday": ada **pita terang menyapu** sesekali,
      bukan warna kuning rata. Uji juga di Safari
      (`-webkit-background-clip`).
- [ ] Tidak ada emas di tempat lain mana pun di situs.
- [ ] Teks muncul setelah kartunya mendarat, bukan bersamaan.
- [ ] "21" tampil **italic tebal coral** dengan font yang jelas berbeda dari
      "wishes". Kalau tebalnya terlihat gepeng/kasar, bobot 700 tidak termuat
      — cek URL Google Fonts di `index.html` dan tab Network.
- [ ] **Tidak ada angka yang teracak** di halaman mana pun: "21" di kartu
      ini, "21st" di baris foil, dan "21" di judul `/` semuanya langsung
      tampil sebagai angka sejak frame pertama scramble.
- [ ] Tidak ada lagi baris hitungan "N dari 21 nama…" di bawah daftar.
- [ ] Hover nama mana pun: **tidak terjadi apa-apa** — tidak membesar, tidak
      berubah warna, tidak ada glow. Kartunya (bertinta / emboss) tampil
      sama persis diam maupun dihover.
- [ ] Tidak ada lagi kartu warna melesat di halaman ini (`BEAT` sudah
      dihapus).
- [ ] Ketik `/penutup` langsung tanpa membuka apa pun: kalimatnya masuk
      akal, tidak ada "0 pesan".
- [ ] Hapus `localStorage` lalu buka `/penutup`: tidak ada error di console.
- [ ] 375px: kartu muat, 21 nama membungkus rapi, teks tidak terpotong.
- [ ] Datang dari `/surat` → `/penutup` mendarat **dari atas**, bukan di
      tengah/bawah.
- [ ] Wash warna: terlihat samar bergeser, tidak "berkedip" atau mencolok.
- [ ] Beat perayaan: lima kartu naik sekali saat tiba, lalu hilang.
- [ ] `prefers-reduced-motion`: formasi langsung utuh, teks langsung ada,
      **tidak ada** wash, tidak ada nafas, tidak ada beat, tidak ada tilt.
- [ ] Musik masih jalan — halaman ini tidak boleh me-restart lagu.
