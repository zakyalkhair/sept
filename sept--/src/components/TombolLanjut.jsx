import { Link } from 'react-router-dom'
import { useTransisi } from '../lib/TransisiContext.jsx'

/* Penutup surat — tombol pekat, bukan tautan bergaris.

   Sengaja memakai bahasa yang sama dengan tombol "masuk" di `/`
   (tinta pekat, teks krem, pil): keduanya satu jenis tindakan — pintu ke
   babak berikutnya — dan halaman ini butuh penutup yang jelas, bukan
   tautan kecil yang mudah terlewat di ujung teks panjang.

   Tetap `<Link>`, bukan `<button>`: ini navigasi, jadi harus bisa dibuka di
   tab baru dan terbaca sebagai tautan oleh pembaca layar. Klik biasa
   di-`preventDefault` supaya transisinya sempat jalan; klik dengan
   Ctrl/Cmd/tengah dibiarkan lewat ke perilaku bawaan browser. */
export default function TombolLanjut({ ke = '/penutup', anak = 'lanjut' }) {
  const { mulaiPesta } = useTransisi()

  const klik = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    const r = e.currentTarget.getBoundingClientRect()
    mulaiPesta(ke, r.left + r.width / 2, r.top + r.height / 2)
  }

  return (
    <Link to={ke} onClick={klik} className="tombol-lanjut tap" data-kursor-teks="lanjut!">
      {anak}
    </Link>
  )
}
