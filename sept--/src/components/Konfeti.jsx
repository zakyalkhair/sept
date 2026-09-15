import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { ACCENTS, bgHex } from '../lib/colors.js'

/* Serpihan kertas yang beterbangan — dan KERAPATANNYA IKUT KECEPATAN SCROLL.
   Itu inti efeknya, bukan bentuk kepingannya.

   Referensinya (situs "four seasons") memakai daun: saat halaman digulung
   cepat, layarnya penuh; saat berhenti dibaca, tinggal tiga-empat helai
   melayang pelan. Yang membuatnya terasa hidup adalah hubungan sebab-akibat
   itu — lapisan yang jatuh terus-menerus dengan kerapatan tetap terbaca
   sebagai wallpaper, bukan sebagai sesuatu yang bereaksi pada kita.

   Daunnya diganti kertas karena situs ini memang bertema kertas: kartu
   ditumpuk, surat bergaris, kartu ucapan ter-emboss. Lagi pula konfeti
   memang benda ulang tahun, jadi maknanya tidak perlu dijelaskan.

   Tiga aturan yang menjaga ini tetap murah (05-pembuka §5.6.5):
   - Satu rAF untuk SEMUA kepingan, dan hasilnya ditulis LANGSUNG ke DOM.
     Tidak ada `setState` per frame — yang mahal bukan hitungannya, tapi
     seluruh pohon React yang ikut ter-render 60×/detik.
   - Hanya `transform` dan `opacity`. Tidak ada `filter`, tidak ada
     `box-shadow` yang ikut bergerak.
   - Posisi scroll dibaca di dalam rAF, bukan lewat event `scroll`. Selain
     lebih hemat, ini juga membuatnya bekerja apa adanya dengan Lenis. */

const BENTUK = ['kotak', 'pita', 'sobek']

/* Acak yang DITENTUKAN indeks, bukan `Math.random()`. Dengan begini
   susunannya sama tiap kali komponen ini dipasang — kalau memakai
   `Math.random()`, satu re-render saja sudah mengocok ulang semuanya dan
   kepingannya terlihat melompat. */
const acak = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function buatKepingan(jumlah, tenang) {
  return Array.from({ length: jumlah }, (_, i) => {
    const a = (k) => acak(i * 7 + k)

    /* Ambang = seberapa kencang orang harus scroll sebelum kepingan ini
       ikut muncul. Lima yang pertama diberi 0 supaya selalu ada — layar
       yang benar-benar kosong saat diam terbaca sebagai efeknya rusak. */
    const ambang = tenang || i < 5 ? 0 : 0.06 + (i / jumlah) * 0.8

    return {
      x: a(1) * 100,                        // vw
      p: a(2),                              // progres jatuh awal, 0..1
      lama: (tenang ? 16 : 9) + a(3) * 8,   // detik untuk sekali jatuh
      ukuran: 5 + a(4) * (tenang ? 9 : 13), // px
      hanyut: (a(5) - 0.5) * 26,            // geser mendatar sepanjang jatuh, vw
      ayun: 8 + a(6) * 26,                  // px
      ayunLaju: 0.5 + a(7) * 1.1,
      putar: (a(8) - 0.5) * 320,            // derajat per detik
      fase: a(9) * Math.PI * 2,
      warna: ACCENTS[Math.floor(a(10) * ACCENTS.length)],
      bentuk: BENTUK[Math.floor(a(11) * BENTUK.length)],
      ambang,
      o: ambang === 0 ? 1 : 0,              // opacity berjalan
    }
  })
}

export default function Konfeti({ tenang = false, className = '' }) {
  const reduced = useReducedMotion()
  const wadahRef = useRef(null)

  /* `useState` dengan inisialisasi malas, BUKAN ref yang diisi saat render.
     Keduanya sama-sama "hitung sekali", tapi mengisi `ref.current` di badan
     render adalah pola yang memang dilarang React — dan di sini `useState`
     malah lebih tepat maksudnya: daftar ini milik komponen sejak lahir.

     Jumlahnya beda di layar sempit. Bukan soal HP tidak kuat, tapi karena
     kerapatan yang sama di layar kecil terbaca sesak. */
  const [daftar] = useState(() => {
    const sempit = window.innerWidth < 640
    const jumlah = tenang ? (sempit ? 6 : 9) : sempit ? 16 : 28
    return buatKepingan(jumlah, tenang)
  })

  useEffect(() => {
    if (reduced) return

    const wadah = wadahRef.current
    if (!wadah) return

    let tinggi = wadah.clientHeight || window.innerHeight
    let lebar = wadah.clientWidth || window.innerWidth

    const ukur = () => {
      tinggi = wadah.clientHeight || window.innerHeight
      lebar = wadah.clientWidth || window.innerWidth
    }
    window.addEventListener('resize', ukur)

    let aduk = 0
    let scrollLalu = window.scrollY
    let lalu = performance.now()
    let raf = 0

    const jalan = (kini) => {
      /* Dibatasi 1/20 detik. Kalau tab ditinggal lalu dibuka lagi, `dt`
         bisa jadi belasan detik dan semua kepingan melompat sekaligus. */
      const dt = Math.min((kini - lalu) / 1000, 0.05)
      lalu = kini

      if (!tenang) {
        const y = window.scrollY
        aduk = Math.min(1, aduk + Math.abs(y - scrollLalu) / 850)
        scrollLalu = y
        /* Peluruhan eksponensial, bukan pengurangan tetap: mengendapnya
           cepat di awal lalu melandai — sama seperti benda betulan yang
           kehilangan momentum. */
        aduk *= Math.exp(-dt * 1.6)
      }

      for (let i = 0; i < daftar.length; i++) {
        const k = daftar[i]
        const el = wadah.children[i]
        if (!el) continue

        /* Scroll tidak cuma memunculkan kepingan, tapi juga MEMPERCEPAT
           yang sudah ada. Tanpa ini, kepingan baru muncul dengan kecepatan
           yang sama seperti saat halaman diam dan tidak terbaca sebagai
           "teraduk". */
        k.p += (dt / k.lama) * (1 + aduk * 4)
        if (k.p > 1) k.p -= 1

        const y = k.p * (tinggi + k.ukuran * 4) - k.ukuran * 2
        const x =
          (k.x / 100) * lebar +
          (k.hanyut / 100) * lebar * k.p +
          Math.sin(k.p * Math.PI * 2 * k.ayunLaju + k.fase) * k.ayun

        k.sudut = (k.sudut ?? k.fase * 57) + dt * k.putar * (1 + aduk * 2.5)

        /* `scaleX` yang melewati nol = kertas berbalik menghadap kita.
           Ini yang membedakannya dari kepingan yang cuma berputar datar,
           dan harganya nol karena masih satu `transform` yang sama. */
        const balik = Math.cos((k.sudut * Math.PI) / 180)

        el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${k.sudut}deg) scaleX(${balik})`

        const tuju = aduk >= k.ambang ? 1 : 0
        if (k.o !== tuju) {
          /* Muncul lebih cepat daripada menghilangnya: kalau keduanya
             sama, kepingan berkedip tiap kali `aduk` melintasi ambang. */
          const laju = tuju === 1 ? 6 : 1.2
          k.o += (tuju - k.o) * Math.min(1, dt * laju)
          if (Math.abs(tuju - k.o) < 0.01) k.o = tuju
          el.style.opacity = k.o
        }
      }

      raf = requestAnimationFrame(jalan)
    }

    raf = requestAnimationFrame(jalan)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', ukur)
    }
  }, [reduced, tenang, daftar])

  if (reduced) return null

  return (
    <div
      ref={wadahRef}
      aria-hidden
      className={`konfeti-lapis ${className}`}
    >
      {daftar.map((k, i) => (
        <span
          key={i}
          className={`konfeti konfeti-${k.bentuk}`}
          style={{
            width: k.ukuran,
            height: k.bentuk === 'pita' ? k.ukuran * 0.42 : k.ukuran * 1.15,
            background: bgHex(k.warna),
            opacity: k.o,
          }}
        />
      ))}
    </div>
  )
}
