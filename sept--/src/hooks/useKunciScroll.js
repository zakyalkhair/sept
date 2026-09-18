import { useEffect } from 'react'
import { lenisRef } from './useLenis.js'

/* Mengunci scroll latar TANPA menggeser layar.

   `document.body.style.overflow = 'hidden'` saja tidak cukup: menghilangkan
   scrollbar berarti area konten melebar selebar scrollbar itu (±15px di
   Windows), jadi seluruh halaman melompat ke kanan saat overlay dibuka dan
   melompat balik saat ditutup. Lebarnya diukur lalu diganti dengan
   `padding-right` sebesar itu, jadi lebar konten tidak berubah sama sekali.

   Overlay `position: fixed` tidak terpengaruh padding ini (lebarnya
   viewport, bukan body), jadi peredup dan taplak tetap penuh.

   Dulu setiap pemakai menyimpan nilai lamanya sendiri. Itu justru sumber bug:
   saat Sorot ditutup sambil Pemutar dibuka, keduanya hidup bersamaan sesaat,
   Pemutar menyimpan "hidden" sebagai nilai lama, lalu mengembalikan "hidden"
   itu saat ia tutup — halaman terkunci selamanya. Sekarang kuncinya dihitung
   (counter): nilai asli disimpan sekali saat kunci pertama, dan dikembalikan
   sekali saat kunci terakhir dilepas.

   Lenis juga harus ikut berhenti. Kalau tidak, ia tetap membaca ukuran
   halaman selama terkunci, menyimpan tinggi yang salah (body sedang
   overflow: hidden), dan setelah overlay ditutup scroll-nya macet sampai
   layar di-resize — persis yang terjadi di tampilan mobile. `resize()`
   dipanggil setelah kunci dilepas supaya ukurannya diukur ulang. */

let jumlahKunci = 0
let overflowAsli = ''
let padAsli = ''

function kunci() {
  const el = document.body

  if (jumlahKunci === 0) {
    overflowAsli = el.style.overflow
    padAsli = el.style.paddingRight

    const lebarBar = window.innerWidth - document.documentElement.clientWidth
    el.style.overflow = 'hidden'
    if (lebarBar > 0) el.style.paddingRight = `${lebarBar}px`

    lenisRef.current?.stop()
  }

  jumlahKunci += 1
}

function lepas() {
  jumlahKunci = Math.max(0, jumlahKunci - 1)
  if (jumlahKunci > 0) return

  const el = document.body
  el.style.overflow = overflowAsli
  el.style.paddingRight = padAsli

  const lenis = lenisRef.current
  if (lenis) {
    lenis.start()
    /* Tunggu satu frame: tinggi body baru benar setelah gaya di atas dipakai. */
    requestAnimationFrame(() => lenisRef.current?.resize())
  }
}

export function useKunciScroll(aktif = true) {
  useEffect(() => {
    if (!aktif) return

    kunci()
    return lepas
  }, [aktif])
}
