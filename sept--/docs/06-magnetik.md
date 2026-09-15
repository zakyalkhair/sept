# Tahap 6 — Magnetik di Semua Tombol

Tombol tertarik ke kursor sebelum disentuh, membesar, lalu kembali dengan
spring. Ini teknik 6.

Selesai kalau: semua tombol di situs magnetik di desktop, tidak ada satu pun
listener `mousemove` yang terpasang di HP, dan Performance tab bersih saat
tombol keluar layar.

---

## 6.1 Tiga gerbang yang wajib

Efek ini jalan di `requestAnimationFrame` terus-menerus. Tanpa penjaga, dia
adalah baterai yang terbuang. Tiga gerbang, semuanya wajib:

1. **`matchMedia('(pointer: fine)')`** — kalau bukan `fine`, **jangan pasang
   listener `mousemove` sama sekali.** Bukan pasang lalu abaikan hasilnya.
2. **`IntersectionObserver`** — hentikan loop saat tombol keluar layar.
3. **`prefers-reduced-motion`** — matikan seluruhnya.

Ketiganya sudah punya hook dari tahap 1 dan 2. Jangan menulis ulang.

---

## 6.2 Hook

`src/hooks/useMagnetic.js`

Yang membuat versi ini murah: `mousemove` dipasang di **elemen itu sendiri
plus area tarik di sekelilingnya**, bukan di `window`. Satu listener per
tombol yang terlihat, bukan satu listener global yang menghitung jarak ke
semua tombol tiap gerakan mouse.

```js
import { useEffect, useRef } from 'react'
import { useMotionValue, useSpring } from 'motion/react'
import { usePointerFine } from './usePointerFine.js'
import { useReducedMotion } from './useReducedMotion.js'

const SPRING = { stiffness: 260, damping: 20, mass: 0.6 }

export function useMagnetic({ kuat = 0.32, radius = 90 } = {}) {
  const ref = useRef(null)
  const fine = usePointerFine()
  const reduced = useReducedMotion()
  const aktif = fine && !reduced

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, SPRING)
  const y = useSpring(my, SPRING)

  useEffect(() => {
    const el = ref.current
    if (!el || !aktif) return

    let terlihat = true

    const onMove = (e) => {
      if (!terlihat) return
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const jarak = Math.hypot(dx, dy)
      const jangkauan = Math.max(r.width, r.height) / 2 + radius

      if (jarak > jangkauan) {
        mx.set(0)
        my.set(0)
        return
      }

      /* Tarikan meluruh ke tepi jangkauan — tidak ada lompatan saat
         kursor melewati batas. */
      const luruh = 1 - jarak / jangkauan
      mx.set(dx * kuat * luruh)
      my.set(dy * kuat * luruh)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        terlihat = entry.isIntersecting
        if (!terlihat) {
          mx.set(0)
          my.set(0)
        }
      },
      { rootMargin: '120px' }
    )

    io.observe(el)
    window.addEventListener('pointermove', onMove, { passive: true })

    return () => {
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      mx.set(0)
      my.set(0)
    }
  }, [aktif, kuat, radius, mx, my])

  return { ref, x: aktif ? x : 0, y: aktif ? y : 0, aktif }
}
```

**`pointermove`, bukan `mousemove`.** `pointermove` juga menangani pena
stylus, dan di perangkat yang punya mouse *dan* sentuh, gerbang
`pointer: fine` sudah menyaringnya.

**`{ passive: true }`.** Handler ini tidak pernah memanggil `preventDefault`,
dan memberi tahu browser itu di depan membuat scroll tidak terhambat.

**Tarikan meluruh, tidak dipotong.** Kalau tarikan langsung nol di batas
jangkauan, tombol akan menyentak saat kursor melewatinya. `luruh` membuatnya
melepas pelan.

**`kuat: 0.32`.** Lebih dari 0,4 dan tombol terasa seperti lepas dari
halaman; kurang dari 0,2 dan orang tidak sadar ada efeknya.

---

## 6.3 Komponen `Tombol`

Daripada memasang `useMagnetic` di tiap tempat, buat satu komponen tombol
dan ganti semua tombol yang sudah ada dengan ini. Konsistensi itulah yang
membuat situs terasa satu tangan.

`src/components/Tombol.jsx`

```jsx
import { motion } from 'motion/react'
import { useMagnetic } from '../hooks/useMagnetic.js'
import { spring } from '../lib/motion.js'

export default function Tombol({
  children,
  onClick,
  className = '',
  kuat,
  radius,
  ...rest
}) {
  const { ref, x, y, aktif } = useMagnetic({ kuat, radius })

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      style={{ x, y }}
      whileHover={aktif ? { scale: 1.08 } : undefined}
      whileTap={{ scale: 0.94 }}
      transition={spring.snap}
      className={`tap grid place-items-center rounded-full ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  )
}
```

`whileTap` **tanpa** gerbang `aktif` — itu padanan sentuh yang wajib ada di
mobile. `whileHover` bergerbang, karena hover tidak ada artinya di sentuh.

`transition={spring.snap}` dari `src/lib/motion.js` — jangan tulis angka
spring baru di sini. Kalau butuh yang berbeda, tambahkan preset di
`motion.js`.

---

## 6.4 Ganti tombol yang sudah ada

Tiga tempat. Semuanya cukup mengganti elemen, bukan menulis ulang logika.

**`src/components/TombolMasuk.jsx`** — hapus `motion.button` dan
`whileHover`/`tapPress` manual:

```jsx
import { useNavigate } from 'react-router-dom'
import Tombol from './Tombol.jsx'
import { useMusic } from '../lib/MusicContext.jsx'

export default function TombolMasuk() {
  const { nyalakan } = useMusic()
  const navigate = useNavigate()

  const masuk = async () => {
    await nyalakan()
    navigate('/pesan')
  }

  return (
    <Tombol
      onClick={masuk}
      kuat={0.4}
      radius={140}
      className="border border-line bg-ink px-8 py-4 text-bg"
    >
      masuk
    </Tombol>
  )
}
```

`kuat: 0.4` dan `radius: 140` — lebih kuat dari default. Ini satu-satunya
tombol di layar dan tugasnya menarik perhatian.

**`src/components/Pemutar.jsx`** — tombol "tutup" dan "berikutnya":

```jsx
<Tombol
  onClick={onTutup}
  aria-label="Tutup"
  className="px-5"
  style={{ background: 'rgba(255,255,255,0.28)' }}
>
  tutup
</Tombol>
```

Perhatikan `style` tetap diteruskan lewat `...rest` — tapi `useMagnetic`
juga menulis ke `style`. **Ini bentrok.** Perbaikannya: `Tombol` menggabung
`style`-nya sendiri dengan yang datang dari luar.

Ganti baris `style` di `Tombol.jsx` jadi:

```jsx
const { style: styleLuar, ...sisanya } = rest
// ...
style={{ ...styleLuar, x, y }}
```

dan sebarkan `{...sisanya}`, bukan `{...rest}`. Kalau tidak, latar transparan
tombol di pemutar video akan hilang begitu magnetik dipasang.

**`src/components/TombolMute.jsx`** — jangan diganti. Tombol mute fixed di
pojok layar; kalau dia bergerak mengikuti kursor, dia jadi sasaran yang
susah ditekan. Biarkan `motion.button` seperti apa adanya.

---

## 6.5 Link juga

Ada dua link teks yang bukan tombol: "lanjut" di `/surat` dan navigasi ke
`/penutup`. Magnetik pada teks terasa aneh — yang tepat untuk link adalah
garis bawah yang masuk dari kiri dan **keluar ke kanan**, bukan mundur.

Itu asimetri termurah yang ada, dicuri dari noomoagency.com.

Tambahkan ke `index.css`:

```css
.link-garis {
  position: relative;
  text-decoration: none;
}

.link-garis::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -0.25em;
  height: 1px;
  width: 100%;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: right;             /* keluar: menyusut ke kanan */
  transition: transform 320ms var(--ease-out);
}

.link-garis:hover::after,
.link-garis:focus-visible::after {
  transform: scaleX(1);
  transform-origin: left;              /* masuk: tumbuh dari kiri */
  transition: transform 420ms var(--ease-in);
}
```

Dua `transform-origin` yang berbeda antara keadaan diam dan hover — itu
seluruh triknya. Durasi masuk (420ms) juga sengaja lebih lama dari keluar
(320ms).

Pakai `.link-garis` menggantikan `underline underline-offset-4` di semua
`<Link>` yang ada — dan juga di dua tombol teks "lewati" (§2.6 header
`/pesan` dan §2.7 "lewati semua" di overlay). Keduanya `motion.button`,
bukan `<Link>`, tapi secara visual berperan sebagai link jadi garisnya
harus konsisten. `.link-garis` bekerja di elemen apa pun lewat `::after` +
`:hover`.

---

## 6.6 Anggaran

Magnetik jalan di `rAF` seperti teknik 3 (kecepatan → skew). **Keduanya
tidak boleh ada di halaman yang sama dalam jumlah besar.**

Di `/pesan` ada 21 kartu ber-`useVelocitySkew`. Kalau tiap kartu juga
magnetik, itu 42 loop. **Jangan pasang magnetik di kartu** — hanya di tombol
di dalam overlay pemutar, yang jumlahnya dua dan hanya ada saat overlay
terbuka.

Di `/` (pembuka) magnetik ada di satu tombol saja, dan formasi 21 sudah
selesai animasinya sebelum tombol muncul. Aman.

---

## Cek Sebelum Lanjut ke Tahap 7

- [ ] Desktop: dekati tombol "masuk" — dia condong ke arah kursor sebelum
      disentuh, lalu kembali dengan spring saat kursor menjauh.
- [ ] Lewati batas jangkauan dengan cepat: tombol **tidak menyentak**.
- [ ] HP (atau DevTools device mode): buka `chrome://inspect` atau pasang
      breakpoint — **tidak ada listener `pointermove` sama sekali**.
      Menyembunyikan hasilnya tidak cukup.
- [ ] Tombol di overlay pemutar video: latar transparan `rgba(255,255,255,0.28)`
      masih ada. Kalau hilang, `style` bentrok belum diperbaiki.
- [ ] Tekan tombol di HP: mengecil lalu kembali dengan overshoot.
- [ ] Scroll tombol keluar layar, buka Performance tab: tidak ada aktivitas.
- [ ] Tombol mute **tidak** magnetik dan tetap mudah ditekan.
- [ ] Link "lanjut": garis masuk dari kiri saat hover, **keluar ke kanan**
      saat kursor pergi. Rekam layar kalau ragu.
- [ ] Tab ke link dengan keyboard: garis muncul (`focus-visible`).
- [ ] `prefers-reduced-motion`: tidak ada tarikan sama sekali, tombol tetap
      bisa ditekan.
