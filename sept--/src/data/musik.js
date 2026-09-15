/* Daftar putar. Berkasnya taruh di `public/musik/` dengan nama persis
   seperti di bawah.

   Urutannya = urutan main. Setelah lagu terakhir habis, kembali ke lagu
   pertama (perulangan ada di daftar, BUKAN di elemen `<audio>` — atribut
   `loop` sudah dilepas, kalau tidak lagu pertama akan mengulang selamanya
   dan dua lagu lain tidak pernah kebagian).

   `oleh` boleh dikosongkan; kalau kosong, chip judulnya cuma menampilkan
   judul lagu. */
export const musik = [
  {
    berkas: '/musik/ingatlah-hari-ini.mp3',
    judul: 'Ingatlah Hari Ini',
    oleh: 'Project Pop',
  },
  {
    berkas: '/musik/senja-teduh-pelita.mp3',
    judul: 'Senja Teduh Pelita',
    oleh: '',
  },
]
