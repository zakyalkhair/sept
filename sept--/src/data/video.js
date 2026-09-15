/* ═══════════════════════════════════════════════════════════════════════
   SATU-SATUNYA BERKAS YANG PERLU DIUBAH SAAT VIDEO DIUNGGAH.
   Lihat docs/02-pesan.md §2.8 untuk langkah lengkapnya.
   ═══════════════════════════════════════════════════════════════════════ */

/* 1 — Cloud name dari dashboard Cloudinary. Bukan API key, bukan secret:
       nilai ini memang publik dan aman ada di kode klien. */
export const CLOUD = 'exswlgik'

/* 1b — Kartu yang videonya DIREKAM LANGSUNG di situs (Adlin, yang ulang
        tahun). Hasil rekaman diunggah ke Cloudinary lewat "unsigned upload
        preset": Settings → Upload → Upload presets → Add, Signing mode =
        Unsigned. Kosong = tombol rekam tidak muncul.

        Unggahan unsigned tidak bisa menimpa berkas lama, jadi tiap kiriman
        diberi tag `TAG_REKAM` dan yang diputar selalu yang TERBARU. Untuk
        itu daftar per-tag harus bisa dibaca publik: Settings → Security →
        Restricted media types → HILANGKAN centang "Resource list". */
export const UPLOAD_PRESET = 'ehc6b3ke'
export const KARTU_REKAM = 21
export const TAG_REKAM = 'adlin'

/* 2 — Nomor kartu yang videonya SUDAH diunggah. Boleh diisi bertahap;
       kartu di luar daftar ini otomatis menampilkan "videonya menyusul"
       dan tidak punya tombol putar.

       Contoh saat 5 video pertama sudah naik:  [1, 2, 3, 4, 5]
       Kalau semuanya sudah naik:               ISI_SEMUA               */
export const ISI_SEMUA = Array.from({ length: 21 }, (_, i) => i + 1)
export const SUDAH_ADA = ISI_SEMUA.filter((n) => n !== 21) // semua kecuali Adlin (yang ulang tahun)

/* Semua 21 sekaligus — pakai ini kalau semua video sudah diunggah:
   `export const SUDAH_ADA = ISI_SEMUA` */

/* 2b — Kartu yang BERBAGI satu video, karena orangnya tampil bersama di
        rekaman yang sama. Kunci = kartu yang ikut, nilai = nomor BERKAS
        yang diunggah.

        Sengaja duplikat, bukan digabung jadi satu kartu: tiap nama tetap
        punya kartunya sendiri di meja `/pesan` (sebaran 21 sel di
        `scatter.js` dan peta `warna` di `messages.js` dihitung untuk 21
        kartu — menghapus satu akan merusak keduanya). Yang dibagi cuma
        videonya.

        Akibatnya untuk `SUDAH_ADA`: yang didaftarkan adalah nomor BERKAS
        (nilai di kanan). Mendaftarkan `14` di situ tidak ada efeknya —
        id-nya sudah dialihkan sebelum dicek. Cukup unggah `13` lalu
        daftarkan `13`; `ISI_SEMUA` juga tetap benar tanpa penyesuaian. */
export const IKUT_VIDEO = {
  14: 13, // Kakak ikut video Almi
  12: 11, // Mamah ikut video Ayah — mereka satu rekaman
}

/* TANPA prefix folder di URL. Akun ini pakai "Dynamic folders" (Cloudinary):
   folder di situ cuma label organisasi di panel, BUKAN bagian dari Public
   ID sebenarnya. Public ID videonya persis "03", bukan "20sept/03" —
   dicek langsung ke server (`curl`/`Invoke-WebRequest`): "20sept/03" → 404,
   "03" saja → 200. Kalau nanti dipindah ke akun mode folder lama (fixed
   folders), baris ini yang perlu dikembalikan menyertakan folder. */
const nomor = (id) => String(id).padStart(2, '0')

/* URL Cloudinary deterministik dari nama file, jadi tidak ada SDK, tidak ada
   API yang dipanggil saat runtime, tidak ada kunci rahasia — ini cuma URL.

   `f_auto,q_auto` = format & kualitas terbaik per browser, dibayar sekali
   per video lalu di-cache. JANGAN menambahkan `w_` atau `h_`: tiap dimensi
   baru adalah transcoding baru yang dibayar lagi. */
/* Jalur rekaman terbaru, mis. "v1758000000/adlin-1758000000". Diisi
   `siapkanRekaman()` SEBELUM aplikasi dirender (lihat main.jsx). */
let rekaman = null

export function setRekaman(versi, publicId) {
  rekaman = `v${versi}/${publicId}`
  try { localStorage.setItem('rekaman-adlin', rekaman) } catch { /* abaikan */ }
}

export async function siapkanRekaman() {
  try { rekaman = localStorage.getItem('rekaman-adlin') } catch { /* abaikan */ }
  if (!CLOUD) return
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), 2500)
  try {
    const r = await fetch(`https://res.cloudinary.com/${CLOUD}/video/list/${TAG_REKAM}.json?t=${Date.now()}`, { signal: ctl.signal })
    if (!r.ok) return
    const { resources = [] } = await r.json()
    const terbaru = resources.sort((a, b) => b.version - a.version)[0]
    if (terbaru) rekaman = `v${terbaru.version}/${terbaru.public_id}`
  } catch { /* offline / daftar dikunci: pakai simpanan lokal */ } finally {
    clearTimeout(t)
  }
}

export function urlVideo(id) {
  if (id === KARTU_REKAM) {
    return rekaman ? `https://res.cloudinary.com/${CLOUD}/video/upload/f_auto,q_auto/${rekaman}` : null
  }
  /* Dialihkan DULU, baru dicek ke `SUDAH_ADA` — supaya kartu yang ikut
     (mis. 14) ikut hidup begitu berkas induknya (13) diunggah, tanpa
     perlu didaftarkan sendiri. */
  const berkas = IKUT_VIDEO[id] ?? id
  if (!CLOUD || !SUDAH_ADA.includes(berkas)) return null
  return `https://res.cloudinary.com/${CLOUD}/video/upload/f_auto,q_auto/${nomor(berkas)}`
}

/* ── FOTO ──────────────────────────────────────────────────────────────
   Ikut Cloudinary juga, bukan berkas lokal.

   Alasannya bukan kerapian: foto dari HP itu 3000–4000px / 3–8MB. Kalau
   dipasang mentah, browser mengunduh 5MB hanya untuk menggambar kartu
   selebar 200px — 21 kartu = 100MB per kunjungan, jauh lebih berat dari
   seluruh efek di situs ini digabung.

   ⚠️ PENTING — beda dengan video: aturan "JANGAN pakai `w_`" di atas itu
   KHUSUS VIDEO (transcoding dibayar per detik). Untuk GAMBAR, transformasi
   dihitung per 1000 dan praktis gratis di skala ini, jadi `w_` justru
   WAJIB dipakai. Ini satu-satunya tempat kedua aturan itu bertabrakan,
   makanya ditulis terpisah. */

/* 3 — Nomor kartu yang FOTO-nya sudah diunggah.
       Public ID di Cloudinary: `foto-01` … `foto-21`.
       Sengaja berawalan `foto-` supaya tidak tertukar dengan video yang
       Public ID-nya cuma angka (`01`, `03`, …). */
export const FOTO_ADA = ISI_SEMUA

/* 4 — Foto yang diselipkan di badan surat. Public ID: `surat-01`, dst. */
export const SURAT_FOTO_ADA = [1, 2, 3, 4, 5, 6, 7]

/* Lebar diminta EKSPLISIT di tiap pemakaian — tidak ada nilai default yang
   "aman". Justru itu gunanya: kartu (~208px) dan panel sorot (~350px) tidak
   boleh memuat berkas yang sama besarnya.

   `c_fill,g_auto` memotong ke rasio yang diminta dengan bagian penting
   (wajah) tetap di dalam frame — bukan dipotong dari tengah begitu saja. */
function ubahGambar({ lebar, rasio }) {
  const bagian = ['f_auto', 'q_auto', 'c_fill', 'g_auto', `w_${lebar}`]
  if (rasio) bagian.push(`ar_${rasio}`)
  return bagian.join(',')
}

/* Naikkan angka ini setiap kali foto DITIMPA di Cloudinary. CDN menyimpan
   hasil potongan lama per URL; segmen versi baru memaksa ambil ulang. */
const FOTO_VERSI = 2

export function urlFoto(id, opsi) {
  if (!CLOUD || !FOTO_ADA.includes(id)) return null
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${ubahGambar(opsi)}/v${FOTO_VERSI}/foto-${nomor(id)}`
}

export function urlFotoSurat(n, opsi) {
  if (!CLOUD || !SURAT_FOTO_ADA.includes(n)) return null
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${ubahGambar(opsi)}/v${FOTO_VERSI}/surat-${nomor(n)}`
}
