import { urlVideo } from './video.js'

/* Nama & warna saja — `video` diturunkan dari id-nya.

   `foto` TIDAK ada di sini, dan itu disengaja: tiap tempat pakai butuh
   ukuran berbeda (kartu ~460px, panel sorot ~760px), jadi komponennya
   masing-masing yang memanggil `urlFoto(id, { lebar, rasio })`. Satu URL
   foto untuk semua tempat berarti ada yang kebesaran — persis hal yang
   ingin dihindari.

   `warna` sengaja TIDAK diacak: nilainya dihitung dari peta sel sebaran
   supaya tidak ada kartu di sel yang sama atau bersebelahan yang sewarna
   (lihat docs/02-pesan.md §2.2). Mengubah urutan `nama` aman; mengubah
   `warna` akan merusak sebaran itu.

   Yang masih harus diisi manusia: ganti 21 nama di bawah dengan nama
   sebenarnya. Video diatur terpisah di video.js. */
const DAFTAR = [
  { id: 1,  nama: 'Megan',          warna: 'sage' },
  { id: 2,  nama: 'Vini',           warna: 'kuning' },
  { id: 3,  nama: 'Keisha Arkaana', warna: 'coral' },
  { id: 4,  nama: 'Bunga',          warna: 'lilac' },
  { id: 5,  nama: 'Naura Arkaana',  warna: 'lilac' },
  { id: 6,  nama: 'Auliya',         warna: 'langit' },
  { id: 7,  nama: 'Keisha Apasih',  warna: 'sage' },
  { id: 8,  nama: 'Jasmine',        warna: 'kuning' },
  { id: 9,  nama: 'Naura Apasih',   warna: 'coral' },
  { id: 10, nama: 'Shafwa',         warna: 'coral' },
  { id: 11, nama: 'Ayah',           warna: 'langit' },
  { id: 12, nama: 'Mamah',          warna: 'langit' },
  { id: 13, nama: 'Almi',           warna: 'lilac' },
  { id: 14, nama: 'Kakak',          warna: 'sage' },
  { id: 15, nama: 'Abang',          warna: 'lilac' },
  { id: 16, nama: 'Bina',           warna: 'sage' },
  { id: 17, nama: 'Tiara',          warna: 'kuning' },
  { id: 18, nama: 'Ammara',         warna: 'coral' },
  { id: 19, nama: 'Sofi',           warna: 'lilac' },
  { id: 20, nama: 'Zaky',           warna: 'langit' },
  { id: 21, nama: 'Adlin',          warna: 'langit' },
]

export const messages = DAFTAR.map((m) => ({
  ...m,
  video: urlVideo(m.id),
}))

/* Dipanggil setelah rekaman baru terkirim — objek pesan dipakai bersama
   seluruh halaman, jadi diperbarui di tempat. */
export function segarkanVideo(id) {
  const m = messages.find((x) => x.id === id)
  if (m) m.video = urlVideo(id)
}
