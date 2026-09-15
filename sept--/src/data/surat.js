/* Isi surat. Semua di sini teks — tidak ada satu pun komponen yang perlu
   disentuh untuk menggantinya. */

export const suratKop = {
  tanggal: '20 09 2026',
  kepada: 'happy birthday',
}

/* Badan surat. Tiap entri satu paragraf, di-scrub satu per satu saat
   discroll (lihat docs/04-surat.md §4.2). */
export const surat = [
  "Happy birthday dinaa, aku sayang bangett sama kamu, ga nyangka udah 4 tahun ngerayain ulang tahun kamu. Banyak banget yang berubah dari kita selama 4 tahun ( and its a good thing). Aku punya banyak wish buat kamu di umur kamu yang 21 ini. WOW KAMU BENERAN MEMULAI PETUALANGAN IN YOUR 20's",
  'Aku berdoa semoga kamu mendapatkan impian-impian kamu tahun ini. I know pasti berat karena aku juga ngerasain, tapi semoga kehadiran aku bisa selalu ada buat kamu terutama ketika kamu feeling overwhelmed, anxiety, ovt, atau sekedar stress. I wish you never lose yourself in overworking and in the pressure of success, your soul, your kindness, your mindset is muchh more valuable than all your achievements. INGET OKSIGEN KAMU, jangan sampe terlalu fokus ke achievement sampe kamu lupa tentang present!! i love you tanpa peduli all your achievements.',
  'Aku berharap juga semoga kamu bisa lebih happy tahun ini. Semoga banyak hal baik dan menyenangkan datang ke kamu dan kamu juga react positively ke hal hal baik tersebut. maybe we wont always understand each other, and thats normal, but i need you to remember that i will always love you despite our condition',
  "Aku juga berharap kamu bisa nemuin sparks!! apapun itu ke depannya, mau karir, mau s2, mau lanjut ke jenjang selanjutnya. I WANT YOU TO ENJOY YOUR LIFE. its your 20's, apapun pilihan hidup kamu, aku doain kamu suka dan bersyukur dengan itu. Aku akan selalu berusaha bantu supaya perjalanan kamu lebih seru, lebih mudah, dan lebih menyenangkan",
  'Maafin aku kalo hadiahnya serba kekurangan, aku akuin ini persiapannya kurang mantep, tapi ini udah sekuat yang aku bisa, aku selalu luangin waktu dari bulan kemarin untuk riset riset, untuk reachout temen-temen kamu, maaf kalo ga sespesial itu, tapi semoga cintanya dan effortnya bisa sampe ke kamu 🫰🏻🫰🏻',
  'Love you so much, semoga kamu makin merasa happy dengan diri kamu, seneng sama semua yang udah kamu lewatin, aku selalu bangga dan support kamu apapun kondisi kamu!!!',
]

/* Kalimat pamungkas — SENGAJA dipisah dari `surat`. Dia tidak ikut di-scrub
   seperti paragraf lain; dia punya panggungnya sendiri, datang huruf per
   huruf setelah jeda panjang. Menaruhnya kembali ke dalam array akan
   membuatnya berbobot sama dengan kalimat biasa. */
export const suratAkhir = 'LOVE YOU SO MUCH'


/* Foto yang diselipkan di badan surat, seperti foto yang dititipkan di
   dalam amplop.

   - `n`       → Public ID di Cloudinary: `surat-01`, `surat-02`, …
                 Nomornya juga harus didaftarkan di `SURAT_FOTO_ADA`
                 (src/data/video.js), sama seperti video.
   - `setelah` → muncul SESUDAH paragraf ke-berapa (0 = paragraf pertama).
   - `teks`    → keterangan kecil di bawah fotonya. Boleh dikosongkan.
   - `miring`  → derajat kemiringan. Kecil saja (±3°); lebih dari itu
                 terbaca sebagai stiker, bukan foto yang ditempel tangan.

   Kosong = tidak ada foto yang dirender sama sekali. Isi bertahap sesuai
   foto yang sudah diunggah.

   Contoh:
     { n: 1, setelah: 0, teks: 'entah tahun berapa', miring: -2 },
     { n: 2, setelah: 2, teks: '', miring: 1.6 },                  */
export const suratFoto = [
  { n: 1, setelah: 0, teks: '', miring: -2 },
  { n: 2, setelah: 1, teks: '', miring: 1.6 },
  { n: 3, setelah: 2, teks: '', miring: -1.4 },
  { n: 4, setelah: 3, teks: '', miring: 2 },
  { n: 5, setelah: 4, teks: '', miring: -1.8 },
  { n: 6, setelah: 4, teks: '', miring: 1.2 },
  { n: 7, setelah: 5, teks: '', miring: -2.2 },
]
