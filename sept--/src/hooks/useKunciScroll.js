import { useEffect } from 'react'

/* Mengunci scroll latar TANPA menggeser layar.

   `document.body.style.overflow = 'hidden'` saja tidak cukup: menghilangkan
   scrollbar berarti area konten melebar selebar scrollbar itu (±15px di
   Windows), jadi seluruh halaman melompat ke kanan saat overlay dibuka dan
   melompat balik saat ditutup. Lebarnya diukur lalu diganti dengan
   `padding-right` sebesar itu, jadi lebar konten tidak berubah sama sekali.

   Overlay `position: fixed` tidak terpengaruh padding ini (lebarnya
   viewport, bukan body), jadi peredup dan taplak tetap penuh.

   Nilai lama disimpan dan dikembalikan, bukan diset ke string kosong —
   supaya dua overlay yang tumpang-tindih tidak saling menghapus. */
export function useKunciScroll(aktif = true) {
  useEffect(() => {
    if (!aktif) return

    const el = document.body
    const lebarBar = window.innerWidth - document.documentElement.clientWidth
    const overflowLama = el.style.overflow
    const padLama = el.style.paddingRight

    el.style.overflow = 'hidden'
    if (lebarBar > 0) el.style.paddingRight = `${lebarBar}px`

    return () => {
      el.style.overflow = overflowLama
      el.style.paddingRight = padLama
    }
  }, [aktif])
}
