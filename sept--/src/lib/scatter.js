/* Hash 32-bit deterministik. Input sama → keluaran sama, selamanya. */
function hash(n) {
  let h = n * 2654435761
  h = (h ^ (h >>> 15)) * 2246822507
  h = (h ^ (h >>> 13)) * 3266489909
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/* Sebar 21 kartu: grid kasar 4×3 (12 sel) + jitter yang boleh tumpah
   keluar selnya. 21 kartu ke 12 sel lewat langkah 5 (koprima dengan 12)
   → 9 sel dapat 2 kartu (gerombol), 3 sel dapat 1 (sendirian). Jitter
   lebar (-0.25..1.25 sel) membuat pasangan kadang menumpuk rapat, kadang
   berjarak. Hasilnya seperti kartu dilempar sembarangan, bukan diatur. */
const COLS = 4
const ROWS = 3

/* Posisi dalam persen viewport, dengan margin supaya kartu tidak
   sepenuhnya keluar layar. */
export function scatterOf(id) {
  const i = id - 1
  const sel = (i * 5 + 2) % (COLS * ROWS)
  const cx = sel % COLS
  const cy = Math.floor(sel / COLS)

  const jx = (hash(id) - 0.5) * 1.3 + 0.5
  const jy = (hash(id + 977) - 0.5) * 1.3 + 0.5

  const x = Math.max(15, Math.min(86, ((cx + jx) / COLS) * 70 + 16)) // kiri dibiarkan kosong
  const y = Math.max(5, Math.min(80, ((cy + jy) / ROWS) * 70 + 8))

  return {
    x,
    y,
    rot: (hash(id + 1861) - 0.5) * 28, // -14deg..+14deg
    z: 22 - id, // urut nomor: kartu 1 paling atas, 21 paling bawah
  }
}

/* Menyibak: saat satu kartu disorot, tetangganya minggir menjauh darinya.

   Dihitung dari koordinat sebar (persen), BUKAN dari getBoundingClientRect —
   posisinya sudah diketahui tanpa menyentuh DOM, jadi tidak ada layout
   thrashing saat 21 kartu dihitung sekaligus.

   Keluarannya px, bukan persen: `x`/`y` Motion memakai lebar elemen sendiri
   untuk satuan persen, jadi persen di sini akan berarti "persen lebar kartu"
   dan dorongannya jadi tidak konsisten antar-ukuran layar. */
const SIBAK_KUAT = 96
const SIBAK_RADIUS = 38

export function sibakOf(pusat, s, id) {
  const dx = s.x - pusat.x
  const dy = s.y - pusat.y
  const d = Math.hypot(dx, dy)
  if (d > SIBAK_RADIUS) return { x: 0, y: 0 }

  /* Kartu yang nyaris setumpuk persis (sel yang sama) tidak punya arah —
     tanpa penanganan ini mereka diam di tempat dan tetap menutupi yang
     disorot. Diberi arah tetap dari hash id-nya. */
  if (d < 1) {
    const a = hash(id + 3121) * Math.PI * 2
    return { x: Math.cos(a) * SIBAK_KUAT, y: Math.sin(a) * SIBAK_KUAT }
  }

  const f = (1 - d / SIBAK_RADIUS) * SIBAK_KUAT
  return { x: (dx / d) * f, y: (dy / d) * f }
}

/* Mobile: hanya kemiringan, posisi diatur flow vertikal. */
export function tiltOf(id) {
  return (hash(id + 421) - 0.5) * 14   // -7deg..+7deg
}
