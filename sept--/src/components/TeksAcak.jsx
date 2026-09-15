import { useScramble } from '../hooks/useScramble.js'

/* Pembungkus daun untuk `useScramble`. Terlihat sepele, tapi inilah yang
   membuat efeknya tidak membebani halaman.

   `useScramble` memanggil `setState` tiap ~45ms. Kalau hook-nya dipakai
   LANGSUNG di komponen halaman (dulu begitu di Pembuka & Penutup), tiap
   tick me-render ulang SELURUH pohon halaman itu:

     Pembuka  → Formasi21 (21 KartuFormasi, masing-masing punya
                useMotionValue/useSpring) + CahayaSapu + Grain + TombolMasuk
     Penutup  → 21 <li> nama + kartu ucapan + LatarLebur

   Dua scramble berjalan bersamaan (judul dua baris) → sampai ~44 render
   per detik atas pohon sebesar itu, selama ~2 detik, tepat bersamaan dengan
   formasi yang sedang bergerak. Itu yang terasa sebagai lag berat.

   Dengan hook-nya dikurung di komponen daun ini, `setState` per tick hanya
   me-render ulang satu <span>. Sisa halamannya tidak tahu-menahu.

   ATURAN: jangan pernah memanggil `useScramble` langsung di komponen
   halaman — selalu lewat komponen ini. */
export default function TeksAcak({ teks, jalan, durasi, className = '' }) {
  const tampil = useScramble(teks, { jalan, durasi })
  return <span className={className}>{tampil}</span>
}
